import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { CustomerPage } from '../pages/CustomerPage';
import { EnquiryPage } from '../pages/EnquiryPage';
import { loginData, generateCustomerData, generateEnquiryData } from '../utils/testData';
import { captureScreenshot } from '../utils/screenshot';

/**
 * Enquiry (CRM -> Sales Management -> Enquiry) is the entry point of the Sales Management
 * pipeline (Enquiry -> Quotation -> Pricing -> Quote Approval -> Confirm Order -> Combined Job ->
 * Contract) and is directly dependent on Customer Management - confirmed live via a real
 * "Customer Id" searchable dropdown wired to actual Customer records. Each test creates its own
 * dedicated Customer first (100% reuse of the existing CustomerPage) so Enquiry test data never
 * depends on the shared staging database's pre-existing records.
 *
 * Only the Freight-Forwarding service path is automated in this phase - Customs Broker and
 * Transport Management System each reveal their own distinct required-field sets (confirmed live
 * but out of scope here, per the incremental-implementation instruction for this phase).
 */
test.describe.configure({ mode: 'serial' });

/**
 * Creates and approves a dedicated Customer for one Enquiry test. Confirmed live: Enquiry's
 * "Customer Id" search only returns Approved customers (a real, intentional business rule - a
 * Pending customer never appears there, no matter how specific the search text is) - so every
 * Enquiry test needs an Approved customer, not just a created one.
 */
async function loginAndCreateApprovedCustomer(page: import('@playwright/test').Page, seed: number) {
  const login = new LoginPage(page);
  await login.goto(loginData.url);
  await login.login(loginData.username, loginData.password, loginData.branch);
  await login.verifyLoginSuccess();

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

test.describe('Enquiry Management (Freight-Forwarding)', () => {
  test('Create: a complete Freight-Forwarding Enquiry succeeds and appears in the listing', async ({ page }) => {
    const customerData = await loginAndCreateApprovedCustomer(page, 9600);
    const enquiryData = generateEnquiryData(9600);
    const enquiry = new EnquiryPage(page);

    try {
      await enquiry.navigateFromSidebar();
      await enquiry.verifyListingPageElements();
      await enquiry.openCreateForm();

      await enquiry.selectServices(['Freight-Forwarding']);
      await enquiry.fillCustomerInformation(customerData.customerName, enquiryData.sourceOfEnquiry);
      await enquiry.fillFreightForwardingProductInfo(enquiryData);
      await enquiry.addCargoItem(enquiryData.cargo);
      await enquiry.submitAndExpectSuccess();

      await enquiry.verifyEnquiryInListing(customerData.customerName, enquiryData.shipmentMode, 'Enquiry Created');
      await captureScreenshot(page, 'enquiry', 'create-success', customerData.customerName);
    } catch (error) {
      await captureScreenshot(page, 'enquiry', 'create-failure', customerData.customerName);
      throw new Error(`Enquiry creation failed for customer "${customerData.customerName}": ${(error as Error).message}`);
    }
  });

  test('Negative: submitting a completely empty form shows every baseline required-field message', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto(loginData.url);
    await login.login(loginData.username, loginData.password, loginData.branch);
    await login.verifyLoginSuccess();

    const enquiry = new EnquiryPage(page);
    await enquiry.navigateFromSidebar();
    await enquiry.openCreateForm();

    await enquiry.submitAndExpectValidationErrors(
      'At least one service must be selected.',
      'Customer ID is required.',
      'Source of Enquiry is required.'
    );
  });

  test('Negative: selecting Freight-Forwarding without its Product Information fields shows the service-specific required messages', async ({ page }) => {
    const customerData = await loginAndCreateApprovedCustomer(page, 9601);
    const enquiryData = generateEnquiryData(9601);
    const enquiry = new EnquiryPage(page);

    await enquiry.navigateFromSidebar();
    await enquiry.openCreateForm();
    await enquiry.selectServices(['Freight-Forwarding']);
    await enquiry.fillCustomerInformation(customerData.customerName, enquiryData.sourceOfEnquiry);

    await enquiry.submitAndExpectValidationErrors(
      'Shipment Mode is required.',
      'Shipment Direction is required.',
      'Business Type is required.',
      'This field is required for Freight Forwarding.'
    );
  });

  test('Negative: completing Customer and Product Information without adding a Cargo item is rejected', async ({ page }) => {
    const customerData = await loginAndCreateApprovedCustomer(page, 9602);
    const enquiryData = generateEnquiryData(9602);
    const enquiry = new EnquiryPage(page);

    await enquiry.navigateFromSidebar();
    await enquiry.openCreateForm();
    await enquiry.selectServices(['Freight-Forwarding']);
    await enquiry.fillCustomerInformation(customerData.customerName, enquiryData.sourceOfEnquiry);
    await enquiry.fillFreightForwardingProductInfo(enquiryData);

    await enquiry.submitAndExpectValidationErrors('At least one cargo item must be added.');
  });

  test('Cancel: discards the in-progress Create form and returns to the listing without creating an Enquiry', async ({ page }) => {
    const customerData = await loginAndCreateApprovedCustomer(page, 9603);
    const enquiry = new EnquiryPage(page);

    await enquiry.navigateFromSidebar();
    await enquiry.openCreateForm();
    await enquiry.selectServices(['Freight-Forwarding']);
    await enquiry.fillCustomerInformation(customerData.customerName, 'Mail');

    await enquiry.cancelCreateForm();
    await expect(enquiry.getRowByCustomerName(customerData.customerName)).toHaveCount(0);
  });
});
