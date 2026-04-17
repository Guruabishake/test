import { Page } from '@playwright/test';
import { vendorData } from '../utils/testData';
import { loginData } from '../utils/testData';

import * as path from 'path';

const filepath1 = path.resolve(process.cwd(), 'e2e', 'new_folder', 'assets', 'sample.png');

export class VendorPage {
   
constructor(private page: Page) {}

// LOGIN
  async login() {
    await this.page.goto(loginData.url);
    await this.page.locator('input[type="text"]').fill(loginData.username);
    await this.page.getByRole('combobox').selectOption(loginData.branch);
    await this.page.locator('input[type="password"]').fill(loginData.password);
    await this.page.getByRole('button', { name: 'Login' }).click();
  }

  // NAVIGATION
  async navigateToVendor() {
    await this.page.getByRole('button', { name: 'CRM' }).click();
    await this.page.getByRole('button', { name: 'Vendor Management' }).click();
    await this.page.getByRole('button', { name: '+ Create' }).click();
  }

  // BASIC DETAILS
  async fillBasicDetails() {
    const v = vendorData.vendor;

    await this.page.getByRole('textbox', { name: 'Vendor Name' }).fill(v.name);
    await this.page.getByLabel('Vendor Type').selectOption('Domestic');
    await this.page.getByLabel('Sub Type').selectOption('Regular');
    await this.page.getByRole('textbox', { name: 'Vendor GL Code' }).fill(v.glCode);

    await this.page.getByRole('textbox', { name: 'Address 1' }).fill(v.address1);
    await this.page.getByRole('textbox', { name: 'Address 2' }).fill(v.address2);
    await this.page.getByRole('textbox', { name: 'Address 3' }).fill(v.address3);

    await this.page.getByLabel('State', { exact: true }).selectOption(v.state);
    await this.page.getByRole('textbox', { name: 'City' }).fill(v.city);
    await this.page.getByRole('textbox', { name: 'Phone Number' }).fill(v.phone);
    await this.page.getByRole('textbox', { name: 'Email Address' }).fill(v.email);

    await this.page.getByRole('textbox', { name: 'PAN' }).fill(v.pan);
    await this.page.getByRole('textbox', { name: 'IEC' }).fill(v.iec);
    await this.page.getByRole('textbox', { name: 'CIN No' }).fill(v.cin);
    await this.page.getByRole('textbox',{name:'Contract Start Date'}).fill(v.crtdate);
    await this.page.getByRole('textbox',{name:'Contract End Date'}).fill(v.crtEdate);
    await this.page.getByRole('textbox',{name:'KYC Expiry Date'}).fill(v.kycExpiryDate);
//      await this.page.getByRole('textbox', { name: 'Contract Start Date' }).fill('2026-02-01');
//   await this.page.getByRole('textbox', { name: 'Contract End Date' }).fill('2026-02-28');
//   await this.page.getByRole('textbox', { name: 'KYC Expiry Date' }).fill('2026-02-25');
  }

  // CONTACT
  async fillContact() {
    const c = vendorData.contact;

    await this.page.getByRole('heading', { name: 'Contact Details' }).click();
    await this.page.getByRole('textbox', { name: 'First Name' }).fill(c.firstName);
    await this.page.getByRole('textbox', { name: 'Designation' }).fill(c.designation);
    await this.page.locator('#phone_no').nth(1).fill(c.phone);
    await this.page.locator('#email').nth(1).fill(c.email);
  }

  // BANK
  async fillBank() {
    const b = vendorData.bank;

    await this.page.getByText('Bank Details').click();
    await this.page.getByRole('textbox', { name: 'Bank Name' }).fill(b.name);
    await this.page.getByRole('textbox', { name: 'Account Number' }).fill(b.accNo);
    await this.page.getByLabel('Account Type').selectOption('savings');
    await this.page.getByRole('textbox', { name: 'IFSC Code' }).fill(b.ifsc);
    await this.page.getByRole('textbox', { name: 'Branch Name' }).fill(b.branch);
  }

  // KYC
  async fillKYC() {
    const k = vendorData.kyc;

    await this.page.getByText('KYC Details').click();
    await this.page.locator('#state').nth(1).selectOption('Tamil Nadu');
    await this.page.getByRole('textbox', { name: 'GST No' }).fill(k.gst);
    await this.page.getByRole('textbox', { name: 'Branch 1' }).fill(k.branch);
    await this.page.getByRole('textbox', { name: 'Branch Address' }).fill(k.branch);
    await this.page.getByRole('textbox', { name: 'Pincode' }).fill(k.pincode);
  }

// UPLOAD
async uploadDocument() {
await this.page.getByText('KYC Document Upload').click();

await this.page.getByLabel('Document Type').selectOption('Aadhar');
await this.page.waitForTimeout(2000);


await this.page.locator('input[type="file"]').setInputFiles(filepath1);
// const fileChooserPromise = this.page.waitForEvent('filechooser');
// const fileChooser = await fileChooserPromise;
// await this.page.locator('input[type="file"]').setInputFiles(filePath);
await this.page.waitForTimeout(2000);
// await fileChooser.setFiles(filePath);
// await this.page.waitForTimeout(2000);


await this.page.getByRole('button', { name: 'Upload' }).click();
// Credit detials
await this.page.locator('xpath=//form/div[1]/div[6]/div').click();
// await this.page.getByRole('textbox', { name: 'Credit Limit' }).fill('1000000');
// await this.page.getByRole('combobox', { name: 'Credit Days' }).selectOption('90');
 await this.page.getByRole('checkbox', { name: 'Invoice Overdue' }).check();
  await this.page.getByRole('textbox', { name: 'Payment Terms (In Days)' }).click();
  await this.page.getByRole('textbox', { name: 'Payment Terms (In Days)' }).fill('10000');
  await this.page.getByRole('checkbox', { name: 'Credit On Hold' }).check();
  await this.page.getByRole('textbox', { name: 'Credit Limits' }).click();
  await this.page.getByRole('textbox', { name: 'Credit Limits' }).fill('10000');
}

  // SUBMIT
  async submit() {
    await this.page.getByRole('button', { name: 'Create' }).click();

    try {
      // verify success message
      await this.page.getByText('Vendor created successfully').waitFor({ timeout: 5000 });

    } catch (error) {

      // take screenshot if failed
      await this.page.screenshot({
        path: `test-results/vendor-failed-${Date.now()}.png`,
        fullPage: true
      });

      throw error; // re-throw so test fails properly
    }
  }
}
