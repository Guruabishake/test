#!/usr/bin/env node
/**
 * Runs ONE Playwright spec (never the full AmazerTrans suite), prints a clear execution summary
 * (the active configuration plus real pass/fail/skipped counts), then generates the Allure report
 * from that run's results and opens it in Google Chrome - so the user never needs to run
 * `allure serve`/`allure open` by hand after every run.
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
const ALLURE_PORT = Number(process.env.ALLURE_PORT) || 5252;
const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function printEnquiryConfig() {
  const raw = (process.env.ENQUIRY_SERVICE_CONFIG || 'FREIGHT_FORWARDING').toUpperCase();
  const tokens = raw.split(',').map((t) => t.trim());
  const all = tokens.includes('ALL');
  const ff = all || tokens.includes('FREIGHT_FORWARDING');
  const cb = all || tokens.includes('CUSTOMS_BROKER');
  const tms = all || tokens.includes('TRANSPORT_MANAGEMENT_SYSTEM');

  console.log('\nENQUIRY TEST EXECUTION\n');
  console.log('Service Configuration:');
  console.log(`  Freight-Forwarding: ${ff ? 'YES' : 'NO'}`);
  console.log(`  Customs Broker: ${cb ? 'YES' : 'NO'}`);
  console.log(`  Transport Management System: ${tms ? 'YES' : 'NO'}\n`);
  console.log(`Shipment Direction: ${process.env.SHIPMENT_DIRECTION || 'Export'}`);
  console.log(`Shipment Mode: ${process.env.SHIPMENT_MODE || 'Air'}\n`);
  console.log(`File Upload: ${process.env.ENQUIRY_UPLOAD_ENABLED !== 'false' ? 'ENABLED' : 'DISABLED'}\n`);
}

function printQuotationConfig() {
  console.log('\nQUOTATION TEST EXECUTION\n');
  console.log(`Quotation Count: ${process.env.QUOTATION_COUNT || 1}\n`);
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

/** Polls the report server's real HTTP readiness - no arbitrary fixed delay. */
function waitForServer(port, maxAttempts, intervalMs) {
  return new Promise((resolve) => {
    let attempts = 0;
    const check = () => {
      attempts += 1;
      const req = http.get({ host: '127.0.0.1', port, path: '/', timeout: 1000 }, (res) => {
        res.resume();
        resolve(true);
      });
      req.on('error', () => {
        if (attempts >= maxAttempts) resolve(false);
        else setTimeout(check, intervalMs);
      });
      req.on('timeout', () => req.destroy());
    };
    check();
  });
}

async function main() {
  // Serve the freshly-generated report on a fixed, known port so Chrome can be pointed at it
  // without depending on parsing the server's own stdout. Fully detached with file-based stdio
  // (not inherited pipes) so it keeps running independently once this script exits.
  const logFd = fs.openSync(path.join(ROOT, 'test-results', 'allure-server.log'), 'a');
  const server = spawn('allure', ['open', ALLURE_REPORT_DIR, '--port', String(ALLURE_PORT)], {
    shell: true,
    detached: true,
    stdio: ['ignore', logFd, logFd],
  });
  server.unref();

  const url = `http://127.0.0.1:${ALLURE_PORT}`;
  const ready = await waitForServer(ALLURE_PORT, 20, 500);
  if (!ready) {
    console.warn(`[run-with-allure] Allure server did not become ready at ${url} in time - it may still be starting; open it manually once it is.`);
  } else {
    spawn(CHROME_PATH, [url], { detached: true, stdio: 'ignore' }).unref();
    console.log(`Allure report open at ${url}`);
  }

  // Preserve Playwright's own exit code - this wrapper must not mask a real test failure.
  process.exit(testExitCode);
}

main();
