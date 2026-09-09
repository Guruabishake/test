import { Page } from '@playwright/test';
import { loginData, jobData } from '../utils/testData';

export class QuoteApprovalPage {

  constructor(private page: Page) {}

  async login() {

    await this.page.goto('https://staging-amazertrans.cargowayz.net/login/AMAZERTRANS');

    await this.page.locator('input[type="text"]').fill("mainModule.mail@getMaxListeners.com");
    await this.page.getByRole('combobox').selectOption('1');
    await this.page.locator('input[type="password"]').fill(loginData.password);
    await this.page.getByRole('button', { name: 'Login' }).click();

    await this.page.getByRole('textbox').first().fill("devtest@gmail.com");
    await this.page.getByRole('combobox').selectOption('15');
    await this.page.getByRole('button', { name: 'Login' }).click();
  }

  async approveQuote() {

    await this.page.getByRole('button', { name: 'CRM' }).click();
    await this.page.getByRole('button', { name: 'Sales Management' }).click();
    await this.page.getByRole('button', { name: 'Quote Approval' }).click();

    await this.page.getByRole('button', { name: 'Edit' }).click();
    await this.page.getByRole('button', { name: 'Product Information' }).click();
    await this.page.getByRole('button', { name: 'Quote' }).click();

    await this.page.getByRole('button', { name: 'Approve' }).click();
    await this.page.getByRole('button', { name: 'Yes, Approve' }).click();
  }

  async confirmQuote() {

    await this.page.getByRole('button', { name: 'Edit' }).click();
    await this.page.getByRole('button', { name: 'Product Information' }).click();
    await this.page.getByRole('button', { name: 'Quote' }).click();

    await this.page.getByRole('button', { name: 'Confirm Quote' }).click();
    await this.page.getByRole('button', { name: 'Yes, Confirm' }).click();
  }

  async confirmMasterJob() {

    await this.page.getByRole('button', { name: 'CRM' }).click();
    await this.page.getByRole('button', { name: 'Confirm Order List' }).click();

    await this.page.getByText('Forwarder').nth(2).click();

    await this.page.getByRole('button', { name: 'Confirm Master Job' }).click();

    await this.page.getByRole('textbox', { name: 'Reference Invoice No' }).fill(jobData.referenceInvoice);

    await this.page.getByRole('button', { name: 'Confirm', exact: true }).click();
  }

  async generateBookingJob() {

    await this.page.getByRole('button', { name: 'CRM' }).click();
    await this.page.getByRole('button', { name: 'Sales Management' }).click();
    await this.page.getByRole('button', { name: 'Booking Job Generation' }).click();

    await this.page.getByRole('button', { name: 'Edit' }).first().click();

    await this.page.getByRole('button', { name: 'Product Information' }).click();
    await this.page.getByRole('button', { name: 'Origin Information' }).click();
    await this.page.getByRole('button', { name: 'Destination Information' }).click();
    await this.page.getByRole('button', { name: 'Cargo Information' }).click();

    await this.page.getByRole('button', { name: 'Update' }).click();

    await this.page.getByRole('button', { name: 'Update Child Job' }).first().click();
    await this.page.getByRole('button', { name: 'Update / Generate Child Job' }).click();

    await this.page.getByRole('checkbox', { name: 'FF (Freight Forwarding)' }).check();

    await this.page.getByRole('button', { name: 'Update / Generate', exact: true }).click();

    await this.page.getByRole('button', { name: 'Update Child Job' }).first().click();
    await this.page.getByRole('button', { name: 'Update / Generate Child Job' }).click();

    await this.page.getByRole('checkbox', { name: 'TMS (Transport Management)' }).check();

    await this.page.getByRole('button', { name: 'Update / Generate', exact: true }).click();
  }

}
