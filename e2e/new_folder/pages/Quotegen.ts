import { Page } from '@playwright/test';
import { quoteData } from '../utils/testData';
import { loginData } from '../utils/testData';
// import { EnquiryPage } from './EnquiryPage.ts';
export class QuoteGen {


  constructor(private page: Page) {}

  /* ================= LOGIN ================= */

  async login() {
    console.log('Starting login...');
    await this.page.goto(loginData.url);
    await this.page.waitForLoadState('networkidle');
    console.log('Page loaded, filling credentials...');

    await this.page.locator('input[type="text"]').fill(loginData.username);
    await this.page.getByRole('combobox').selectOption(loginData.branch);
    await this.page.locator('input[type="password"]').fill(loginData.password);
    console.log('Credentials filled, clicking login...');
    await this.page.getByRole('button', { name: 'Login' }).click();
    await this.page.waitForLoadState('networkidle');
    console.log('Login completed, current URL:', this.page.url());
  }

  /* ================= NAVIGATION ================= */

  async navigateToEnquiry() {
    console.log('Starting navigation to enquiry...');
    await this.page.getByRole('button', { name: 'CRM' }).click();
    await this.page.waitForLoadState('networkidle');
    console.log('CRM clicked');
    await this.page.getByRole('button', { name: 'Sales Management' }).click();
    await this.page.waitForLoadState('networkidle');
    console.log('Sales Management clicked');
    await this.page.getByRole('button', { name: 'Enquiry' }).click();
    await this.page.waitForLoadState('networkidle');
    console.log('Enquiry clicked, current URL:', this.page.url());
  }

  async generateQuote() {
    await this.page.waitForLoadState('networkidle');
    
    // Check if we're on the right page and if there are enquiries
    console.log('Current URL:', this.page.url());
    const pageTitle = await this.page.title();
    console.log('Page title:', pageTitle);
    
    // Look for any enquiries in the table
    const enquiryRows = await this.page.locator('table tbody tr').count();
    console.log('Number of enquiry rows found:', enquiryRows);
    
    if (enquiryRows === 0) {
      console.log('No enquiries found. You may need to create an enquiry first.');
      return; // Exit early if no enquiries
    }
    
    // capture state before trying to click
    const html = await this.page.content();
    console.log('PAGE HTML snippet:', html.slice(0, 1000));
    await this.page.screenshot({ path: 'debug-generate-quote.png', fullPage: true });

    // Try different selectors for the Generate Quote button
    try {
      await this.page.locator('button:has-text("Generate Quote")').first().click({ timeout: 5000 });
    } catch (err) {
      console.log('Primary selector failed:', err);
      // Fallback to looking by title or aria-label
      await this.page.locator('[title*="Generate Quote"], [aria-label*="Generate Quote"]').first().click();
    }
    
    this.page.once('dialog', async dialog => {
      console.log('Dialog:', dialog.message());
      await dialog.accept();
    });
  }

  async openQuotationGeneration() {
    await this.page.getByRole('button', { name: 'CRM' }).click();
    await this.page.getByRole('button', { name: 'Quotation Generation' }).click();
    await this.page.getByRole('button', { name: 'Edit', exact: true }).first().click();
  }

  /* ================= PRODUCT INFO ================= */

  async fillProductInfo() {
    await this.page.getByRole('button', { name: 'Product Information' }).click();
    await this.page.getByRole('button', { name: 'Quote' }).click();

    await this.page.getByLabel('FF Vendor').selectOption(quoteData.vendorName);
    await this.page.getByLabel('CB Vendor').selectOption(quoteData.vendorName);
    await this.page.getByLabel('TMS Vendor').selectOption(quoteData.vendorName);
  }

  /* ================= ORIGIN ================= */

  async addOrigin() {
    const data = quoteData.origin;

    await this.page.getByRole('button', { name: '+ Add Origin' }).click();
    await this.page.getByLabel('Charge Description').selectOption(data.charge);
    await this.page.getByRole('textbox', { name: 'Quantity' }).fill(data.quantity);
    await this.page.getByRole('textbox', { name: 'Buy Rate' }).fill(data.buyRate);
    await this.page.getByLabel('Buy Currency').selectOption(data.currency);
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  /* ================= INTERNATIONAL ================= */

  async addInternational() {
    const data = quoteData.international;

    await this.page.getByRole('button', { name: 'International' }).click();
    await this.page.getByRole('button', { name: '+ Add International' }).click();
    await this.page.getByLabel('Charge Description').selectOption(data.charge);
    await this.page.getByRole('textbox', { name: 'Quantity' }).fill(data.quantity);
    await this.page.getByRole('textbox', { name: 'Buy Rate' }).fill(data.buyRate);
    await this.page.getByLabel('Buy Currency').selectOption(data.currency);
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  /* ================= DESTINATION ================= */

  async addDestination() {
    const data = quoteData.destination;

    await this.page.getByRole('button', { name: 'Destination' }).click();
    await this.page.getByRole('button', { name: '+ Add Destination' }).click();
    await this.page.getByLabel('Charge Description').selectOption(data.charge);
    await this.page.getByRole('textbox', { name: 'Quantity' }).fill(data.quantity);
    await this.page.getByRole('textbox', { name: 'Buy Rate' }).fill(data.buyRate);
    await this.page.getByLabel('Buy Currency').selectOption(data.currency);
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  /* ================= SUMMARY + UPLOAD ================= */

  async uploadDocument() {
    await this.page.getByRole('button', { name: 'Summary' }).click();
    await this.page.getByRole('button', { name: 'Upload File' }).click();
    await this.page.getByLabel('Document Type').selectOption('Aadhar');

    await this.page.setInputFiles('input[type="file"]', quoteData.uploadFile);

    await this.page.getByRole('button', { name: 'Upload', exact: true }).click();
  }

  /* ================= UPDATE + PRICING ================= */

  async finalizeQuote() {
    await this.page.getByRole('button', { name: 'Update' }).first().click();
    await this.page.getByRole('button', { name: 'Edit', exact: true }).first().click();
    await this.page.getByRole('button', { name: 'Update' }).first().click();

    this.page.once('dialog', async dialog => {
      console.log('Dialog:', dialog.message());
      await dialog.dismiss();
    });

    await this.page.getByRole('button', { name: 'Initiate Pricing' }).first().click();
  }
}
