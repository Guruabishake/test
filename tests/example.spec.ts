import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://staging-amazertrans.cargowayz.net/login/AMAZERTRANS');
  await page.locator('input[type="text"]').click();
  await page.locator('input[type="text"]').fill('superadmin@amazertrans.com');
  await page.getByRole('combobox').selectOption('1');
  await page.locator('input[type="password"]').click();
  await page.locator('input[type="password"]').fill('Welcome@123');
  await page.getByRole('button').filter({ hasText: /^$/ }).click();
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('button', { name: 'Master' }).click();
  await page.getByRole('button', { name: 'Document Type' }).click();
  await page.getByRole('button', { name: '+ Create' }).click();
  await page.getByRole('textbox', { name: 'Document Type' }).click();
  await page.getByRole('textbox', { name: 'Document Type' }).fill('Allwin muthuraj');
  await page.getByRole('button', { name: 'Create' }).click();
});