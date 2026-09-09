//Enquiry Screen Action
// utils/commonActions.ts
import { Page } from '@playwright/test';

export async function selectDropdown(page: Page, label: string, value: string) {
  await page.getByLabel(label).selectOption(value);
}

export async function fillTextbox(page: Page, name: string, value: string) {
  const field = page.getByRole('textbox', { name });
  await field.click();
  await field.fill(value);
  await field.press('Tab');
}

export async function fillField(page: Page, label: string, value: string) {
  const field = page.getByRole('textbox', { name: label, exact: true });
  await field.fill(value);
}

export async function selectDropdown1(page: Page, label: string, value: string) {
  await page.getByLabel(label).selectOption(value);
}

export async function clickBtn(page: Page, name: string, index = 0) {
  await page.getByRole('button', { name }).nth(index).click();
}