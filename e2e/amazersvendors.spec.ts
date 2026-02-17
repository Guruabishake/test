import { test, expect } from '@playwright/test';
import * as path from 'path';

const filePath = path.join('C:/Users/chinnadurai.m/Pictures/Screenshots/Screenshot 2026-02-16 121252.png');






//const filepath = "C:/Users/allwin.a/Pictures/2025-05-26_12-48.png"

test('Create Vendor - CRM', async ({ page }) => {

  /* =========================
        1️⃣ LOGIN
  ========================== */

  await page.goto('https://staging-amazertrans.cargowayz.net/login/AMAZERTRANS');

  await page.locator('input[type="text"]').fill('devtest@gmail.com');
  await page.getByRole('combobox').selectOption('15');
//   await page.locator('input[type="password"]').fill('Welcom@123');
  await page.locator('input[type="password"]').fill('Welcome@123');
  await page.getByRole('button', { name: 'Login' }).click();


  /* =========================
        2️⃣ NAVIGATION
  ========================== */

  await page.getByRole('button', { name: 'CRM' }).click();
  await page.getByRole('button', { name: 'Vendor Management' }).click();
  await page.getByRole('button', { name: '+ Create' }).click();


  /* =========================
        3️⃣ BASIC VENDOR DETAILS
  ========================== */

  await page.getByRole('textbox', { name: 'Vendor Name' })
    .fill('RED supplier and service');

  await page.getByLabel('Vendor Type').selectOption('Domestic');
  await page.getByLabel('Sub Type').selectOption('Regular');

  await page.getByRole('textbox', { name: 'Vendor GL Code' }).fill('9865');

  await page.getByRole('textbox', { name: 'Address 1' }).fill('107 BYO PASS');
  await page.getByRole('textbox', { name: 'Address 2' }).fill('107');
  await page.getByRole('textbox', { name: 'Address 3' }).fill('NO NEED');   

await page.getByRole('textbox', { name: 'Address 3' }).press('Tab');
 await page.getByLabel('Country').press('Tab'); 
 await page.getByLabel('State', { exact: true }).selectOption('Telangana');
  await page.getByLabel('State', { exact: true }).selectOption('Arunachal Pradesh');
  await page.getByRole('textbox', { name: 'City' }).fill('MDU');
  await page.getByRole('textbox', { name: 'Phone Number' }).fill('6549653498');
  await page.getByRole('textbox', { name: 'Email Address' })
    .fill('GREEN@GMAIL.COM');

  await page.getByRole('textbox', { name: 'PAN' }).fill('OA87897987');
  await page.getByRole('textbox', { name: 'IEC' }).fill('8764984987');
  await page.getByRole('textbox', { name: 'CIN No' })
    .fill('SDF9898SDF89898SDDF');

  await page.getByLabel('Operational Status').selectOption('true');

  await page.getByRole('textbox', { name: 'Sales Person' })
    .fill('REEMA');

  await page.getByRole('textbox', { name: 'Contract Start Date' })
    .fill('2026-02-16');
  await page.getByRole('textbox', { name: 'Contract End Date' })
    .fill('2026-02-17');
  await page.getByRole('textbox', { name: 'KYC Expiry Date' })
    .fill('2026-03-07');


  /* =========================
        4️⃣ CONTACT DETAILS
  ========================== */

  await page.getByRole('heading', { name: 'Contact Details' }).click();

  await page.getByRole('textbox', { name: 'First Name' }).fill('HERXONE');
  await page.getByRole('textbox', { name: 'Designation' }).fill('HEAD');

  await page.locator('#phone_no').nth(1).fill('2898798989');
  await page.locator('#email').nth(1).fill('HERX@GMAIL.COM');


  /* =========================
        5️⃣ BANK DETAILS
  ========================== */

  await page.getByText('Bank Details').click();

  await page.getByRole('textbox', { name: 'Bank Name' }).fill('IMO');
  await page.getByRole('textbox', { name: 'Account Number' })
    .fill('9765498');

  await page.getByLabel('Account Type').selectOption('savings');
  await page.getByRole('textbox', { name: 'IFSC Code' })
    .fill('IFSC7454565');
  await page.getByRole('textbox', { name: 'Branch Name' })
    .fill('MUMBAI');


  /* =========================
        6️⃣ KYC DETAILS
  ========================== */

  await page.getByText('KYC Details').click();

  await page.locator('#state').nth(1).selectOption('Tamil Nadu');

  await page.getByRole('textbox', { name: 'GST No' })
    .fill('SDFS556868686846846');

  await page.getByRole('textbox', { name: 'Branch 1' }).fill('MUMBAI');
  await page.getByRole('textbox', { name: 'Branch Address' })
    .fill('MUMBAI');
  await page.getByRole('textbox', { name: 'Pincode' })
    .fill('979899');


  /* =========================
        7️⃣ DOCUMENT UPLOAD
  ========================== */

  await page.getByText('KYC Document Upload').click();

  await page.getByLabel('Document Type').selectOption('Aadhar');

  await page.setInputFiles('input[type="file"]', filePath);

  await page.getByRole('button', { name: 'Upload' }).click();
  await page.waitForTimeout(5000);


  /* =========================
        8️⃣ CREDIT DETAILS
  ========================== */

  await page.getByText('Credit Details').click();

  await page.getByRole('checkbox', { name: 'Invoice Overdue' }).check();

  await page.getByRole('textbox', { name: 'Payment Terms (In Days)' })
    .fill('20');

  await page.getByRole('checkbox', { name: 'Credit On Hold' }).check();

  await page.getByRole('textbox', { name: 'Credit Limits' })
    .fill('20');


  /* =========================
        9️⃣ SUBMIT
  ========================== */

  await page.getByRole('button', { name: 'Create' }).click();

});
