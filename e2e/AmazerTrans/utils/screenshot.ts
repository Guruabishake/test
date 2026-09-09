import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'test-results', 'AmazerTrans-screenshots');

function sanitize(value: string): string {
  return value.replace(/[^a-zA-Z0-9-_]+/g, '_').slice(0, 80);
}

/**
 * Captures a full-page screenshot named "<module>-<action>-<identifier>-<timestamp>.png" so
 * repeated actions (loop iterations, retries) never overwrite each other's evidence. Shared by
 * every module (Customer/Vendor, success/failure) rather than each having its own utility.
 */
export async function captureScreenshot(
  page: Page,
  module: string,
  action: string,
  identifier: string
): Promise<string> {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const fileName = `${sanitize(module)}-${sanitize(action)}-${sanitize(identifier)}-${Date.now()}.png`;
  const filePath = path.join(SCREENSHOT_DIR, fileName);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}
