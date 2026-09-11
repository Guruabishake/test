#!/usr/bin/env node
/**
 * Runs ONE Playwright spec (never the full AmazerTrans suite), prints a clear execution summary
 * (the active configuration plus real pass/fail/skipped counts), then generates the Allure report
 * from that run's results and opens it in Google Chrome - so the user never needs to run
 * `allure serve`/`allure open` by hand after every run.
 *
 * Allure's static report needs to be loaded over HTTP (its JS fetches data/*.json - opening
 * index.html directly via file:// hits Chrome's file-origin fetch restrictions and the report
 * never populates), so *some* server is unavoidable. Serving it is done via a plain in-process
 * Node `http` server (below), not the Allure CLI's own `allure open` - `allure open` spawns a
 * separate detached Java process this script did not own or track, so it was never actually
 * stopped once the report opened; the resulting orphaned process (confirmed live via `tasklist`
 * across runs in this repo) is exactly what held `test-results/allure-server.log`'s file handle
 * open indefinitely, which is what produced the Windows EPERM on a later run trying to touch that
 * same log path. The in-process server here is `server.close()`d by this same script right after
 * Chrome has had time to load the report, so nothing outlives this process and nothing is ever
 * written to a log file in the first place.
 *
 * Usage: node scripts/run-with-allure.js <specPath> <ENQUIRY|QUOTATION>
 */
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
require('dotenv').config();

const [, , specPath, label = 'TEST'] = process.argv;
if (!specPath) {
  console.error('Usage: node scripts/run-with-allure.js <specPath> <ENQUIRY|QUOTATION>');
  process.exit(1);
}

const ROOT = process.cwd();
const ALLURE_RESULTS_DIR = path.join(ROOT, 'allure-results');
const ALLURE_REPORT_DIR = path.join(ROOT, 'allure-report');
const JSON_OUTPUT = path.join(ROOT, 'test-results', `${label.toLowerCase()}-run.json`);

// Common per-machine/per-user Chrome install locations, checked in order - covers 64-bit,
// 32-bit and per-user installs without assuming any one of them. CHROME_PATH (if set) always
// wins over all of this. If none of these exist either (a non-default install directory),
// `openInChrome` below falls back to Windows' own "start chrome" resolution, which finds Chrome
// via its registered App Paths entry regardless of where it's actually installed - so no path
// ever needs to be hardcoded as the only option.
const KNOWN_CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
];

function resolveChromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  return KNOWN_CHROME_PATHS.find((p) => p && fs.existsSync(p));
}

/** Opens `url` in Chrome. Prefers a resolved executable path; falls back to Windows' own "start chrome" (App Paths registry lookup - no hardcoded install path required) when none of the known locations exist. */
function openInChrome(url) {
  const chromePath = resolveChromePath();
  if (chromePath) {
    spawn(chromePath, [url], { detached: true, stdio: 'ignore' }).unref();
    return;
  }
  spawn('cmd', ['/c', 'start', '""', 'chrome', url], { detached: true, stdio: 'ignore' }).unref();
}

function printEnquiryConfig() {
  // The 4 required Service combinations (and their Shipment Direction/Mode) are fixed in code -
  // e2e/AmazerTrans/utils/testData.ts's ENQUIRY_SCENARIOS - not env-configured, so this just
  // states what always runs rather than reading env vars that no longer exist.
  console.log('\nENQUIRY TEST EXECUTION\n');
  console.log('Service Combinations (fixed, one Enquiry each, same Customer/Vendor/session):');
  console.log('  FF + CB       - Export / Sea');
  console.log('  CB + TMS      - Import / Air');
  console.log('  FF + TMS      - Export / Air');
  console.log('  FF + CB + TMS - Import / Sea\n');
}

function printQuotationConfig() {
  // Same fixed 4-combination Enquiries as ENQUIRY (see printEnquiryConfig) drive this run - one
  // Customer/Vendor/session, each processed through the full Quotation workflow to Initiate
  // Pricing. Only the per-section entry counts and upload files are env-configurable.
  console.log('\nQUOTATION TEST EXECUTION\n');
  console.log('Enquiries processed: FF+CB, CB+TMS, FF+TMS, FF+CB+TMS (fixed, one Customer/Vendor/session)\n');
  console.log(`Origin entries: ${process.env.QUOTATION_ORIGIN_COUNT || 5}`);
  console.log(`International entries: ${process.env.QUOTATION_INTERNATIONAL_COUNT || 5}`);
  console.log(`Destination entries: ${process.env.QUOTATION_DESTINATION_COUNT || 5}`);
  console.log(`Upload Files: ${process.env.QUOTATION_UPLOAD_FILES || 'sample.png,sample2.png (default)'}\n`);
}

if (label === 'ENQUIRY') printEnquiryConfig();
else if (label === 'QUOTATION') printQuotationConfig();

// 1. Run ONLY the requested spec - never the full suite, never Customer/Vendor/E2E regression.
const testRun = spawnSync(
  'npx',
  ['playwright', 'test', specPath, '--project=chromium', '--workers=1', '--reporter=list,json,allure-playwright'],
  {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: JSON_OUTPUT },
  }
);
const testExitCode = testRun.status ?? 1;

// 2. Parse the real pass/fail/skip counts from Playwright's own JSON reporter output - never
//    guessed or scraped from free-text console output.
let stats = { passed: 0, failed: 0, skipped: 0, total: 0 };
try {
  const report = JSON.parse(fs.readFileSync(JSON_OUTPUT, 'utf-8'));
  const passed = (report.stats.expected || 0) + (report.stats.flaky || 0);
  const failed = report.stats.unexpected || 0;
  const skipped = report.stats.skipped || 0;
  stats = { passed, failed, skipped, total: passed + failed + skipped };
} catch (err) {
  console.warn(`[run-with-allure] Could not parse ${JSON_OUTPUT} for result counts: ${err.message}`);
}

console.log('Tests:');
console.log(`Passed: ${stats.passed}`);
console.log(`Failed: ${stats.failed}`);
console.log(`Skipped: ${stats.skipped}`);
console.log(`Total: ${stats.total}\n`);

// 3. Generate the static Allure report from the results this run just wrote.
console.log('Allure report:');
const generate = spawnSync('allure', ['generate', ALLURE_RESULTS_DIR, '--clean', '-o', ALLURE_REPORT_DIR], {
  stdio: 'inherit',
  shell: true,
});
if (generate.status !== 0) {
  console.error('Failed to generate the Allure report.');
  process.exit(testExitCode);
}
console.log('Generated successfully');
console.log('Opening in Chrome...');

// A handful of extensions actually present in an Allure static report - anything else falls back
// to a generic binary content-type, which browsers still render/download fine.
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

/**
 * Minimal static file server for the already-generated `allure-report/` directory - deliberately
 * not the Allure CLI's own `allure open`, which spawns an external process this script would not
 * fully control (see the file header). Serving in-process means there is nothing to detach, log to
 * a file, or leak: `server.close()` below shuts it down for good before this script exits.
 */
function serveReport(reportDir) {
  return http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const relativePath = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    // Resolve-and-check-prefix guards against a request path escaping reportDir via "..".
    const filePath = path.join(reportDir, relativePath);
    if (!filePath.startsWith(reportDir)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
}

/**
 * Serves the report just long enough for the browser to load it, then stops the server itself -
 * no fixed "sleep N seconds" guess. Every request the report's own page makes (its HTML, JS bundle,
 * then its data/*.json fetches) resets an idle timer; once nothing has been requested for
 * IDLE_MS, the initial load is done and the server shuts down. MAX_WAIT_MS bounds how long this
 * waits for that first request at all (e.g. Chrome being slow to launch), so the script can never
 * hang waiting on a browser that never shows up.
 */
async function serveReportThenClose(reportDir) {
  const IDLE_MS = 2000;
  const MAX_WAIT_MS = 20000;
  const server = serveReport(reportDir);

  // Chrome keeps its HTTP/1.1 connection to us alive (keep-alive) well past the point the page has
  // actually finished loading, so plain server.close() alone would sit waiting for that idle
  // socket to close on its own - it never does in time. Tracking sockets lets the shutdown below
  // destroy them outright once the idle window has elapsed, so close() resolves immediately.
  const sockets = new Set();
  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}/index.html`;

  openInChrome(url);
  console.log(`Allure report open at ${url}`);

  let lastRequestAt = Date.now();
  server.on('request', () => {
    lastRequestAt = Date.now();
  });

  const startedAt = Date.now();
  await new Promise((resolve) => {
    const check = setInterval(() => {
      const idleFor = Date.now() - lastRequestAt;
      const waitedFor = Date.now() - startedAt;
      if (idleFor >= IDLE_MS || waitedFor >= MAX_WAIT_MS) {
        clearInterval(check);
        resolve();
      }
    }, 250);
  });

  await new Promise((resolve) => {
    server.close(resolve);
    for (const socket of sockets) socket.destroy();
  });
}

async function main() {
  await serveReportThenClose(ALLURE_REPORT_DIR);
  // Preserve Playwright's own exit code - this wrapper must not mask a real test failure. The
  // report server above has already been closed, so nothing keeps the process alive past this.
  process.exit(testExitCode);
}

main();
