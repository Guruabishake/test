import { Page } from '@playwright/test';
import { loginData } from '../utils/testData';
import * as path from 'path';

const uploadFile = path.resolve(process.cwd(), 'e2e', 'new_folder', 'assets', 'sample.png');

export class PricingPage {
  constructor(private page: Page) {}

  async navigateToPricing() {
    // ensure we're logged in before navigating
    await this.page.goto(loginData.url);
    await this.page.waitForLoadState('networkidle');
    await this.page.locator('input[type="text"]').fill(loginData.username);
    await this.page.getByRole('combobox').selectOption(loginData.branch);
    await this.page.locator('input[type="password"]').fill(loginData.password);
    await this.page.getByRole('button', { name: 'Login' }).click();
    await this.page.waitForLoadState('networkidle');

    // now go to quotation generation to start pricing
    await this.page.getByRole('button', { name: 'CRM' }).click();
    await this.page.waitForLoadState('networkidle');
    await this.page.getByRole('button', { name: 'Sales Management' }).click();
    await this.page.waitForLoadState('networkidle');
    await this.page.getByRole('button', { name: 'Quotation Generation' }).click();

    this.page.once('dialog', async dialog => {
      console.log('Dialog:', dialog.message());
      await dialog.dismiss();
    });

    await this.page.getByRole('button', { name: 'Initiate Pricing' }).first().click();

    // wait for backend processing
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(3000);
    
    // reload and check available buttons
    await this.page.reload({ waitUntil: 'networkidle' });

    // try to navigate to Pricing - it might be under a different name
    try {
      // First try exact match
      const pricingBtn = this.page.getByRole('button', { name: 'Pricing', exact: true });
      await pricingBtn.waitFor({ state: 'visible', timeout: 5000 });
      await pricingBtn.click();
    } catch (err) {
      // If not found, try partial match or alternative navigation
      console.log('Pricing exact button not found, trying alternatives...');
      try {
        const pricingBtn = this.page.locator('button:has-text("Pricing")').first();
        await pricingBtn.waitFor({ state: 'visible', timeout: 5000 });
        await pricingBtn.click();
      } catch {
        // Navigate through CRM menu again
        await this.page.getByRole('button', { name: 'CRM' }).click();
        await this.page.waitForLoadState('networkidle');
        
        // List all available buttons to debug
        const buttons = await this.page.locator('button').all();
        console.log(`Available buttons: ${buttons.length}`);
        for (let i = 0; i < Math.min(15, buttons.length); i++) {
          const text = await buttons[i].textContent();
          console.log(`Button ${i}: "${text}"`);
        }
        
        throw new Error('Pricing button not found - check console for available buttons');
      }
    }
  }

  async editOriginCharges() {
    await this.page.getByRole('button', { name: 'Edit' }).first().click();
    await this.page.getByRole('button', { name: 'Product Information' }).click();
    await this.page.getByRole('button', { name: 'Quote' }).click();

    await this.page.locator('.flex.items-center.gap-x-3 > button').first().click();
    await this.page.getByRole('textbox', { name: 'Quantity' }).fill('1000');
    await this.page.getByRole('textbox', { name: 'Buy Rate' }).fill('100');
    await this.page.getByRole('button', { name: 'Update' }).first().click();

    const table = this.page.getByRole('table')
      .filter({ hasText: 'S.noCharge DescriptionHS CodeCharge Based OnQuantityMargin %Sell RateSell' });

    await table.locator('input[type="text"]').first().fill('10');
    await this.page.locator('td:nth-child(11) > .flex.items-center.justify-center').click();
    await this.page.getByRole('button', { name: 'Update' }).first().click();
  }

  async editInternational() {
    await this.page.getByRole('button', { name: 'International' }).click();

    const table = this.page.getByRole('table')
      .filter({ hasText: 'S.noCharge DescriptionHS CodeCharge Based OnQuantityMargin %Sell RateSell' });

    await table.locator('input[type="text"]').first().fill('10');

    await this.page.getByRole('button', { name: 'Edit' }).click();
    await this.page.getByRole('textbox', { name: 'Sell Rate' }).fill('12');
    await this.page.getByRole('button', { name: 'Update' }).first().click();
  }

  async editDestination() {
    await this.page.getByRole('button', { name: 'Destination' }).click();

    const table = this.page.getByRole('table')
      .filter({ hasText: 'S.noCharge DescriptionHS CodeCharge Based OnQuantityMargin %Sell RateSell' });

    await table.locator('input[type="text"]').first().fill('10');
  }

  async uploadAndSubmit() {
    await this.page.getByRole('button', { name: 'Summary' }).click();
    await this.page.getByRole('button', { name: 'Upload File' }).click();
    await this.page.locator('#sell_document_type').selectOption('Aadhar');

    await this.page.setInputFiles('input[type="file"]', uploadFile);

    await this.page.getByRole('button', { name: 'Upload' }).nth(2).click();
    await this.page.getByRole('button', { name: 'Update' }).click();

    this.page.once('dialog', async dialog => {
      console.log('Dialog:', dialog.message());
      await dialog.dismiss();
    });

    await this.page.getByRole('button', { name: 'Submit To Approval' }).first().click();
  }
}
