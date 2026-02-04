import { test, expect } from '@playwright/test';

test('Create Document Type', async ({ page }) => {

  // 1️⃣ Open Login Page
  await page.goto('https://staging-amazertrans.cargowayz.net/login/AMAZERTRANS');

  // 2️⃣ Enter Username
  const usernameInput = page.locator('input[type="text"]');
  await usernameInput.click();
  await usernameInput.fill('superadmin@amazertrans.com');

  // 3️⃣ Select Company / Role (Dropdown)
  const companyDropdown = page.getByRole('combobox');
  await companyDropdown.selectOption('1');

  // 4️⃣ Enter Password
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.click();
  await passwordInput.fill('Welcome@123');

  // 5️⃣ Click Login Button
  await page.getByRole('button', { name: 'Login' }).click();

  // 6️⃣ Navigate to Master → Document Type
  await page.getByRole('button', { name: 'Master' }).click();
  await page.getByRole('button', { name: 'Document Type' }).click();

  // 7️⃣ Click + Create Button
  await page.getByRole('button', { name: '+ Create' }).click();

  // 8️⃣ Fill Document Type Name
  const docTypeInput = page.getByRole('textbox', { name: 'Document Type' });
  await docTypeInput.click();
  await docTypeInput.fill('Allwayz Doc Type');

  // 9️⃣ Click Create
  await page.getByRole('button', { name: 'Create' }).click();

});
