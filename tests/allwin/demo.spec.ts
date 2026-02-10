import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://staging-amazertrans.cargowayz.net/login/AMAZERTRANS');
  await page.locator('input[type="text"]').click();
  await page.locator('input[type="text"]').fill('allwun@gmail.com');
  await page.locator('input[type="text"]').press('Tab');
  await page.getByRole('combobox').selectOption('15');
  await page.locator('input[type="password"]').click();
  await page.locator('input[type="password"]').fill('sdfsfgsfg');
  await page.getByRole('button', { name: 'Login' }).click();
});