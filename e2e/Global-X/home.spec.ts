import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://globalxau-staging.vercel.app/innovation/?_vercel_share=U23rAH3J8BC8Dn9vUQjO6yUviqMfHCSR');
  await page.getByRole('link', { name: 'Individual Investor' }).click();
  await page.getByRole('button', { name: 'Funds' }).click();
  await page.getByRole('link', { name: 'Leveraged & Inverse' }).click();
  await page.getByRole('link', { name: 'Global X Leveraged and' }).click();
  await page.getByRole('link', { name: 'Performance of Leveraged ETF' }).click();
  await page.getByRole('link', { name: 'How Do Leveraged and Inverse' }).click();
  await page.getByRole('link', { name: 'How to Invest in Leveraged' }).click();
  await page.getByRole('link', { name: 'What Are the Benefits of' }).click();
  await page.getByRole('link', { name: 'Are There Risks of Investing' }).click();
  await page.getByRole('link', { name: 'Related Funds' }).click();
  await page.getByRole('link', { name: 'Fund categories' }).click();
});