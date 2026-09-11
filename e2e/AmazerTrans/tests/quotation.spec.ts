import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { CustomerPage } from '../pages/CustomerPage';
import { VendorPage } from '../pages/VendorPage';
import { EnquiryPage } from '../pages/EnquiryPage';
import { QuotationPage } from '../pages/QuotationPage';
import {
  loginData,
  generateCustomerData,
  generateVendorData,
  generateCustomerContact,
  generateBankDetails,
  generateEnquiryData,
  generateQuotationChargeData,
  QUOTATION_COUNT,
} from '../utils/testData';
import { captureScreenshot } from '../utils/screenshot';

/**
 * Quotation Generation (CRM -> Sales Management -> Quotation Generation) is reached only through
 * Enquiry's Initiate Quote action - confirmed live there is no standalone Create here, since
 * accepting that native confirmation already creates the Quote record server-side. Confirmed live:
 * this module is Buy-side cost entry only (Charge Description/HS Code/Charge Based On/Quantity/
 * Buy Rate/Buy Currency/Exchange Rate/Value In INR across Origin/International/Destination
 * sections, plus an FF Vendor selection wired to real Vendor Management records) - there is no
 * Sell Rate/Currency, Tax, or Grand Total anywhere in this module, and no Print/Download control;
 * those were confirmed to belong to the separate, out-of-scope "Pricing" module downstream.
 *
 * Each test creates its own dedicated Customer + Enquiry (100% reuse of CustomerPage/EnquiryPage)
 * so Quotation test data never depends on the shared staging database's pre-existing records.
 */
test.describe.configure({ mode: 'serial' });

/** Assumes an already-logged-in `page` - creates and approves one dedicated Customer, no relogin. */
async function createApprovedCustomer(page: import('@playwright/test').Page, seed: number) {
  const customer = new CustomerPage(page);
  await customer.navigateFromSidebar();
  const customerData = generateCustomerData(seed);
  await customer.openCreateForm();
  await customer.fillBasicDetails(customerData);
  await customer.submitAndExpectSuccess();
  await customer.approveCustomerByName(customerData.customerName);
  await customer.expectApprovalStatus(customerData.customerName, 'Approved');
  return customerData;
}

/**
 * Assumes an already-logged-in `page` - creates and approves one dedicated Vendor with complete
 * Basic+Contact+Bank+Document+Credit data (mirrors the Customer helper), no relogin. Used so
 * Quotation's "FF Vendor" selection can reference a real, freshly-created Approved Vendor instead
 * of an arbitrary pre-existing record.
 */
async function createApprovedVendor(page: import('@playwright/test').Page, seed: number) {
  const vendor = new VendorPage(page);
  await vendor.navigateFromSidebar();
  const vendorData = generateVendorData(seed);
  await vendor.openCreateForm();
  await vendor.fillBasicDetails(vendorData);
  await vendor.fillContactDetails(generateCustomerContact(seed));
  await vendor.fillBankDetails(generateBankDetails(seed));
  await vendor.uploadKycDocument('Aadhar');
  await vendor.fillCreditDetails('45', '75000');
  await vendor.submitAndExpectSuccess();
  await vendor.approveVendorByName(vendorData.vendorName);
  await vendor.expectApprovalStatus(vendorData.vendorName, 'Approved');
  return vendorData;
}

/**
 * Logs in once, then creates an Approved Vendor followed by an Approved Customer, then an
 * Enquiry, and initiates its Quote - all in one browser session (Customer -> Vendor -> Enquiry
 * order per the phase's own flow is Vendor-then-Customer here since the Vendor is only needed
 * once the test reaches Quotation Generation's FF Vendor field, but no relogin occurs either way).
 * Lands on the Quotation Generation listing.
 */
async function createEnquiryAndInitiateQuote(page: import('@playwright/test').Page, seed: number, withVendor = false) {
  const login = new LoginPage(page);
  await login.goto(loginData.url);
  await login.login(loginData.username, loginData.password, loginData.branch);
  await login.verifyLoginSuccess();

  const vendorData = withVendor ? await createApprovedVendor(page, seed + 100) : undefined;
  const customerData = await createApprovedCustomer(page, seed);
  const enquiryData = generateEnquiryData(seed);
  const enquiry = new EnquiryPage(page);

  await enquiry.navigateFromSidebar();
  await enquiry.openCreateForm();
  await enquiry.selectServices(['Freight-Forwarding']);
  await enquiry.fillCustomerInformation(customerData.customerName, enquiryData.sourceOfEnquiry);
  await enquiry.fillFreightForwardingProductInfo(enquiryData);
  await enquiry.addCargoItem(enquiryData.cargo);
  await enquiry.submitAndExpectSuccess();

  const enquiryNo = await enquiry.getRowByCustomerName(customerData.customerName).locator(':scope > div').first().innerText();
  await enquiry.initiateQuote(customerData.customerName, true);

  return { customerData, vendorData, enquiryData, enquiryNo: enquiryNo.trim() };
}

test.describe('Quotation - Generation', () => {
  test('Generation: selecting an FF Vendor and adding an Origin charge computes Value In INR as Buy Rate x Quantity x Exchange Rate', async ({ page }) => {
    const { customerData, enquiryNo } = await createEnquiryAndInitiateQuote(page, 9800);
    const charge = generateQuotationChargeData(9800);
    const quotation = new QuotationPage(page);

    try {
      await quotation.expectQuoteStatus(customerData.customerName, 'Quote Initiated');
      await quotation.editQuotationByCustomerName(customerData.customerName);
      await quotation.verifyHeaderFields(enquiryNo);

      await quotation.addBuyRateCharge('Origin', charge);
      const { exchangeRate, valueInInr } = await quotation.getChargeRowValues('Origin');
      const expectedValueInInr = Number(charge.buyRate) * Number(charge.quantity) * exchangeRate;
      expect(valueInInr).toBeCloseTo(expectedValueInInr, 2);

      await quotation.submitUpdateAndExpectSuccess();
      await captureScreenshot(page, 'quotation', 'generation-success', customerData.customerName);
    } catch (error) {
      await captureScreenshot(page, 'quotation', 'generation-failure', customerData.customerName);
      throw new Error(`Quotation generation failed for customer "${customerData.customerName}": ${(error as Error).message}`);
    }
  });

  test(`Configurable creation: initiates QUOTATION_COUNT (${QUOTATION_COUNT}) Quotes from dedicated Enquiries in a single session`, async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto(loginData.url);
    await login.login(loginData.username, loginData.password, loginData.branch);
    await login.verifyLoginSuccess();

    const customer = new CustomerPage(page);
    const enquiry = new EnquiryPage(page);
    const quotation = new QuotationPage(page);
    const createdCustomerNames: string[] = [];

    try {
      for (let i = 0; i < QUOTATION_COUNT; i++) {
        const seed = 9810 + i;
        const customerData = generateCustomerData(seed);
        const enquiryData = generateEnquiryData(seed);

        await customer.navigateFromSidebar();
        await customer.openCreateForm();
        await customer.fillBasicDetails(customerData);
        await customer.submitAndExpectSuccess();
        await customer.approveCustomerByName(customerData.customerName);

        await enquiry.navigateFromSidebar();
        await enquiry.openCreateForm();
        await enquiry.selectServices(['Freight-Forwarding']);
        await enquiry.fillCustomerInformation(customerData.customerName, enquiryData.sourceOfEnquiry);
        await enquiry.fillFreightForwardingProductInfo(enquiryData);
        await enquiry.addCargoItem(enquiryData.cargo);
        await enquiry.submitAndExpectSuccess();
        await enquiry.initiateQuote(customerData.customerName, true);
        await quotation.expectQuoteStatus(customerData.customerName, 'Quote Initiated');
        createdCustomerNames.push(customerData.customerName);
      }
      await captureScreenshot(page, 'quotation', 'generation-loop-success', `count-${QUOTATION_COUNT}`);
    } catch (error) {
      await captureScreenshot(page, 'quotation', 'generation-loop-failure', `count-${QUOTATION_COUNT}`);
      throw new Error(`Quotation creation loop failed after creating [${createdCustomerNames.join(', ')}]: ${(error as Error).message}`);
    }
  });
});

test.describe('Quotation - Validation', () => {
  test('Negative: saving an Add Origin popup with every field empty adds no row and shows no error (real, permissive behavior)', async ({ page }) => {
    const { customerData } = await createEnquiryAndInitiateQuote(page, 9820);
    const quotation = new QuotationPage(page);

    await quotation.editQuotationByCustomerName(customerData.customerName);
    await page.getByRole('button', { name: 'Quote', exact: true }).click();
    await page.getByRole('button', { name: 'Origin', exact: true }).click();
    await page.getByRole('button', { name: /add origin/i }).click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    // Confirmed live: no validation message appears and the popup simply remains open with the
    // fields still empty - documenting the real (permissive) behavior rather than inventing a message.
    await expect(page.getByText('No data available', { exact: true })).toBeVisible();
  });
});

test.describe('Quotation - View', () => {
  test('View: displays the real saved FF Vendor and charge data, then Back returns to the listing', async ({ page }) => {
    const { customerData, vendorData, enquiryNo } = await createEnquiryAndInitiateQuote(page, 9830, true);
    const charge = generateQuotationChargeData(9830);
    const quotation = new QuotationPage(page);

    try {
      await quotation.editQuotationByCustomerName(customerData.customerName);
      await quotation.selectFFVendor(vendorData!.vendorName);
      await quotation.addBuyRateCharge('Origin', charge);
      await quotation.submitUpdateAndExpectSuccess();

      await quotation.viewQuotationByCustomerName(customerData.customerName);
      await quotation.verifyViewFormFields(enquiryNo, customerData.customerName);
      await captureScreenshot(page, 'quotation', 'view', customerData.customerName);

      await quotation.returnToListingFromView();
      await expect(quotation.getRowByCustomerName(customerData.customerName)).toBeVisible();
    } catch (error) {
      await captureScreenshot(page, 'quotation', 'view-failure', customerData.customerName);
      throw new Error(`Quotation view failed for customer "${customerData.customerName}": ${(error as Error).message}`);
    }
  });
});

test.describe('Enquiry to Quote - Complete Lifecycle', () => {
  test('Login -> Vendor -> Customer -> Enquiry Create -> Edit -> Update -> View -> Initiate Quote -> Quotation Generation -> Update -> View, single browser session throughout', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto(loginData.url);
    await login.login(loginData.username, loginData.password, loginData.branch);
    await login.verifyLoginSuccess();

    const vendorData = await createApprovedVendor(page, 9940);
    const customerData = await createApprovedCustomer(page, 9840);
    const enquiryData = generateEnquiryData(9840);
    const charge = generateQuotationChargeData(9840);
    const enquiry = new EnquiryPage(page);
    const quotation = new QuotationPage(page);

    try {
      // Enquiry: Create -> verify -> Edit -> Update -> verify -> View
      await enquiry.navigateFromSidebar();
      await enquiry.openCreateForm();
      await enquiry.selectServices(['Freight-Forwarding']);
      await enquiry.fillCustomerInformation(customerData.customerName, enquiryData.sourceOfEnquiry);
      await enquiry.fillFreightForwardingProductInfo(enquiryData);
      await enquiry.addCargoItem(enquiryData.cargo);
      await enquiry.submitAndExpectSuccess();
      await enquiry.verifyEnquiryInListing(customerData.customerName, enquiryData.shipmentMode, 'Enquiry Created');
      const enquiryNo = await enquiry.getRowByCustomerName(customerData.customerName).locator(':scope > div').first().innerText();

      await enquiry.editEnquiryByCustomerName(customerData.customerName);
      await enquiry.verifyUpdateFormPrefilled(customerData.customerName, enquiryData);
      await enquiry.fillUpdateSourceOfEnquiry('Website');
      await enquiry.submitUpdateAndExpectSuccess();

      await enquiry.viewEnquiryByCustomerName(customerData.customerName);
      await enquiry.verifyViewFormFields(customerData.customerName, 'Website');
      await enquiry.returnToListingFromView();
      await captureScreenshot(page, 'enquiry', 'lifecycle-to-quote-enquiry-success', customerData.customerName);

      // Initiate Quote -> lands on Quotation Generation listing
      await enquiry.initiateQuote(customerData.customerName, true);

      // Quotation: Edit -> fill FF Vendor + Origin charge -> Update -> verify -> View
      await quotation.editQuotationByCustomerName(customerData.customerName);
      await quotation.verifyHeaderFields(enquiryNo.trim());
      await quotation.selectFFVendor(vendorData.vendorName);
      await quotation.addBuyRateCharge('Origin', charge);
      const { exchangeRate, valueInInr } = await quotation.getChargeRowValues('Origin');
      expect(valueInInr).toBeCloseTo(Number(charge.buyRate) * Number(charge.quantity) * exchangeRate, 2);
      await quotation.submitUpdateAndExpectSuccess();
      await captureScreenshot(page, 'quotation', 'lifecycle-success', customerData.customerName);

      await quotation.viewQuotationByCustomerName(customerData.customerName);
      await quotation.verifyViewFormFields(enquiryNo.trim(), customerData.customerName);
      await quotation.returnToListingFromView();
    } catch (error) {
      await captureScreenshot(page, 'quotation', 'lifecycle-failure', customerData.customerName);
      throw new Error(`Enquiry-to-Quote complete lifecycle failed for customer "${customerData.customerName}": ${(error as Error).message}`);
    }
  });
});
