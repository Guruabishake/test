import { Page, Locator, expect } from '@playwright/test';
import * as path from 'path';
import { selectCustomDropdown, expandSection } from '../utils/commonActions';
import { CustomerData, CustomerContact, BankDetails, GstDetails } from '../utils/testData';

const CREATE_CUSTOMER_API = '/middleware/api/v1/customers/createCustomer';
const UPDATE_CUSTOMER_API = '/middleware/api/v1/customers/updateCustomer';
const sampleDocumentPath = path.resolve(process.cwd(), 'e2e', 'new_folder', 'assets', 'sample.png');

export class CustomerPage {
  readonly page: Page;
  readonly pageHeading: Locator;
  readonly createButton: Locator;
  readonly filterButton: Locator;
  readonly createFormHeading: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly updateFormHeading: Locator;
  readonly updateButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeading = page.getByRole('heading', { name: 'Customer Management', exact: true });
    // Rendered as two adjacent <span>s ("+" / "Create") with no separating whitespace in the DOM,
    // so an exact "+ Create" role-name match is unreliable - match loosely on "create" instead.
    this.createButton = page.getByRole('button', { name: /create/i }).first();
    this.filterButton = page.getByRole('button', { name: 'Filter', exact: true });
    this.createFormHeading = page.getByRole('heading', { name: 'Create Customer', exact: true });
    this.submitButton = page.getByRole('button', { name: 'Create', exact: true });
    this.cancelButton = page.getByRole('button', { name: 'Cancel', exact: true });
    this.updateFormHeading = page.getByRole('heading', { name: 'Update Customer', exact: true });
    this.updateButton = page.getByRole('button', { name: 'Update', exact: true });
    this.backButton = page.getByRole('button', { name: 'Back', exact: true });
  }

  /** Real app navigation: sidebar CRM -> Customer Management (no direct URL navigation). */
  async navigateFromSidebar() {
    await this.page.getByRole('button', { name: 'CRM', exact: true }).click();
    await this.page.getByRole('button', { name: 'Customer Management', exact: true }).click();
    await expect(this.pageHeading).toBeVisible();
  }

  async verifyListingPageElements() {
    await expect(this.pageHeading).toBeVisible();
    await expect(this.createButton).toBeVisible();
    await expect(this.filterButton).toBeVisible();
    await expect(this.page.getByText('Customer ID', { exact: true })).toBeVisible();
    await expect(this.page.getByText('Customer Name', { exact: true })).toBeVisible();
    await expect(this.page.getByText('Approval Status', { exact: true })).toBeVisible();
  }

  async openCreateForm() {
    await this.createButton.click();
    await expect(this.createFormHeading).toBeVisible();
  }

  /** Confirms the core required fields and the submit control are present before filling anything. */
  async verifyCreateFormFields() {
    await expect(this.page.getByRole('textbox', { name: 'Customer Name' })).toBeVisible();
    await expect(this.page.getByRole('textbox', { name: 'Address 1' })).toBeVisible();
    await expect(this.page.getByRole('textbox', { name: 'City' })).toBeVisible();
    await expect(this.page.getByRole('textbox', { name: 'Phone Number' })).toBeVisible();
    await expect(this.page.getByRole('textbox', { name: 'Email Address' })).toBeVisible();
    await expect(this.submitButton).toBeVisible();
    await expect(this.cancelButton).toBeVisible();
  }

  async fillBasicDetails(data: Partial<CustomerData>) {
    if (data.customerName !== undefined) {
      await this.page.getByRole('textbox', { name: 'Customer Name' }).fill(data.customerName);
    }
    if (data.customerType) {
      await selectCustomDropdown(this.page, 'Customer Type', data.customerType);
    }
    if (data.subType) {
      await selectCustomDropdown(this.page, 'Sub Type', data.subType);
    }
    if (data.gstApplicable) {
      await selectCustomDropdown(this.page, 'Gst Applicable', data.gstApplicable);
    }
    if (data.address1 !== undefined) {
      await this.page.getByRole('textbox', { name: 'Address 1' }).fill(data.address1);
    }
    if (data.address2 !== undefined) {
      await this.page.getByRole('textbox', { name: 'Address 2' }).fill(data.address2);
    }
    if (data.state) {
      await selectCustomDropdown(this.page, 'State', data.state);
    }
    if (data.city !== undefined) {
      await this.page.getByRole('textbox', { name: 'City' }).fill(data.city);
    }
    if (data.phone !== undefined) {
      await this.page.getByRole('textbox', { name: 'Phone Number' }).fill(data.phone);
    }
    if (data.email !== undefined) {
      await this.page.getByRole('textbox', { name: 'Email Address' }).fill(data.email);
    }
    if (data.pan !== undefined) {
      await this.page.getByRole('textbox', { name: 'PAN' }).fill(data.pan);
    }
  }

  async fillContactDetails(contact: CustomerContact) {
    await expandSection(this.page, 'Contact Details');
    await this.page.getByRole('textbox', { name: 'First Name' }).fill(contact.firstName);
    await this.page.getByRole('textbox', { name: 'Last Name' }).fill(contact.lastName);
    await this.page.getByRole('textbox', { name: 'Designation' }).fill(contact.designation);
    await this.page.locator('#phone_no').nth(1).fill(contact.phone);
    await this.page.locator('#email').nth(1).fill(contact.email);
  }

  async fillBankDetails(bank: BankDetails) {
    await expandSection(this.page, 'Bank Details');
    await this.page.getByRole('textbox', { name: 'Bank Name' }).fill(bank.bankName);
    await this.page.getByRole('textbox', { name: 'Account Number' }).fill(bank.accountNumber);
    await selectCustomDropdown(this.page, 'Account Type', bank.accountType);
    await this.page.getByRole('textbox', { name: 'IFSC Code' }).fill(bank.ifsc);
    await this.page.getByRole('textbox', { name: 'Branch Name' }).fill(bank.branchName);
  }

  async fillKycDetails(gst: GstDetails) {
    await expandSection(this.page, 'KYC Details');
    await selectCustomDropdown(this.page, 'State', gst.state);
    await this.page.getByRole('textbox', { name: 'GST No' }).fill(gst.gstNo);
    await this.page.getByRole('textbox', { name: 'Branch 1' }).fill(gst.branchName);
    await this.page.getByRole('textbox', { name: 'Branch Address' }).fill(gst.branchAddress);
    await this.page.getByRole('textbox', { name: 'Pincode' }).fill(gst.pincode);
  }

  async uploadKycDocument(documentType = 'Aadhar') {
    await expandSection(this.page, 'KYC Document Upload');
    await selectCustomDropdown(this.page, 'Document Type', documentType);
    await this.page.locator('input[type="file"]').setInputFiles(sampleDocumentPath);
    await this.page.getByRole('button', { name: 'Upload', exact: true }).click();
  }

  async fillCreditDetails(paymentTermsDays: string, creditLimit: string) {
    await expandSection(this.page, 'Credit Details');
    await this.page.getByRole('checkbox', { name: 'Invoice Overdue' }).check();
    await this.page.getByRole('textbox', { name: 'Payment Terms (In Days)' }).fill(paymentTermsDays);
    await this.page.getByRole('checkbox', { name: 'Credit On Hold' }).check();
    await this.page.getByRole('textbox', { name: 'Credit Limits' }).fill(creditLimit);
  }

  async submitAndExpectSuccess() {
    const responsePromise = this.page.waitForResponse(
      (res) => res.url().includes(CREATE_CUSTOMER_API) && res.request().method() === 'POST'
    );
    await this.submitButton.click();
    const response = await responsePromise;
    expect(response.status(), `createCustomer API should return 200. Body: ${await response.text()}`).toBe(200);
    await expect(this.pageHeading).toBeVisible();
    await expect(this.page).toHaveURL(/\/crm\/customerManagement/);
  }

  /** Submits and asserts the specific inline validation message(s) shown, without leaving the form. */
  async submitAndExpectValidationErrors(...messages: string[]) {
    await this.submitButton.click();
    for (const message of messages) {
      await expect(this.page.getByText(message, { exact: true }).first()).toBeVisible();
    }
    await expect(this.createFormHeading).toBeVisible();
  }

  /** Real backend duplicate-detection: reusing an existing customer's phone number returns HTTP 409. */
  async submitAndExpectDuplicatePhoneError() {
    const responsePromise = this.page.waitForResponse((res) => res.url().includes(CREATE_CUSTOMER_API));
    await this.submitButton.click();
    const response = await responsePromise;
    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.message).toBe('A customer with this phone number already exists.');
    await expect(this.createFormHeading).toBeVisible();
  }

  async verifyCustomerInListing(customerName: string) {
    await expect(this.page.getByText(customerName, { exact: true }).first()).toBeVisible();
  }

  /**
   * The listing has no semantic <table>/<tr> - each row is a plain div laid out with inline
   * CSS grid (confirmed via live DOM inspection), so rows are scoped by that structural marker
   * plus the exact customer name they contain, rather than position/.nth().
   */
  getRowByCustomerName(customerName: string): Locator {
    return this.page
      .locator('div[style*="grid-template-columns"]')
      .filter({ has: this.page.getByText(customerName, { exact: true }) })
      .first();
  }

  /** Opens the exact record's Edit screen by its unique Customer Name - never by row position. */
  async editCustomerByName(customerName: string) {
    const row = this.getRowByCustomerName(customerName);
    await row.getByRole('button', { name: 'Edit', exact: true }).click();
    await expect(this.updateFormHeading).toBeVisible();
  }

  /** Verifies the Update screen is pre-populated with the record's real data and has the expected field/button states. */
  async verifyUpdateFormFields(data: CustomerData) {
    await expect(this.updateFormHeading).toBeVisible();

    const customerIdInput = this.page.locator('#customer_id');
    await expect(customerIdInput).toBeDisabled();

    const nameInput = this.page.getByRole('textbox', { name: 'Customer Name' });
    await expect(nameInput).toHaveValue(data.customerName);
    await expect(nameInput).toBeEditable();

    await expect(this.page.getByRole('textbox', { name: 'Address 1' })).toHaveValue(data.address1);
    await expect(this.page.getByRole('textbox', { name: 'City' })).toHaveValue(data.city);
    await expect(this.page.getByRole('textbox', { name: 'Phone Number' })).toHaveValue(data.phone);
    await expect(this.page.getByRole('textbox', { name: 'Email Address' })).toHaveValue(data.email);
    await expect(this.page.getByText(data.customerType, { exact: true })).toBeVisible();

    await expect(this.backButton).toBeVisible();
    await expect(this.cancelButton).toBeVisible();
    await expect(this.updateButton).toBeVisible();
  }

  async submitUpdateAndExpectSuccess() {
    const responsePromise = this.page.waitForResponse(
      (res) => res.url().includes(UPDATE_CUSTOMER_API) && res.request().method() === 'PUT'
    );
    await this.updateButton.click();
    const response = await responsePromise;
    expect(response.status(), `updateCustomer API should return 200. Body: ${await response.text()}`).toBe(200);
    await expect(this.pageHeading).toBeVisible();
    await expect(this.page).toHaveURL(/\/crm\/customerManagement/);
  }

  /** Submits an Update and asserts the specific inline validation message(s) shown, without leaving the form. */
  async submitUpdateAndExpectValidationErrors(...messages: string[]) {
    await this.updateButton.click();
    for (const message of messages) {
      await expect(this.page.getByText(message, { exact: true }).first()).toBeVisible();
    }
    await expect(this.updateFormHeading).toBeVisible();
  }

  /** Real backend duplicate-detection also applies on Update: reusing another customer's phone number returns HTTP 409. */
  async submitUpdateAndExpectDuplicatePhoneError() {
    const responsePromise = this.page.waitForResponse((res) => res.url().includes(UPDATE_CUSTOMER_API));
    await this.updateButton.click();
    const response = await responsePromise;
    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.message).toBe('A customer with this phone number already exists.');
    await expect(this.updateFormHeading).toBeVisible();
  }

  /** Confirmed on the live app: Cancel discards in-progress edits and returns to the listing without calling the update API. */
  async cancelUpdateForm() {
    await this.cancelButton.click();
    await expect(this.pageHeading).toBeVisible();
  }
}
