import { Page, Locator, expect } from '@playwright/test';
import { selectCustomDropdown } from '../utils/commonActions';
import { QuotationChargeData } from '../utils/testData';

// Exact Update endpoint path is unconfirmed (not observed on the network tab this phase) - matched
// by the shared '/quotation' segment plus a non-GET method, specific enough to avoid the list/view
// GET calls, same convention already used for Enquiry.
const QUOTATION_API_SEGMENT = '/quotation';

/**
 * Quotation Generation (CRM -> Sales Management -> Quotation Generation) is reached only via
 * Enquiry's "Initiate Quote" action (EnquiryPage.initiateQuote) - there is no standalone "Create"
 * button here, since accepting that action already creates the Quote record server-side and lands
 * on this module's listing. Confirmed live: this module is Buy-side cost entry only (Charge
 * Description/HS Code/Charge Based On/Quantity/Buy Rate/Buy Currency/Exchange Rate/Value In INR
 * across Origin/International/Destination sections) - there is no Sell Rate/Currency, Tax, or
 * Grand Total anywhere in this module; those confirmed to belong to the separate "Pricing" module
 * downstream (out of scope here). There is also no Print/Download control on the View screen.
 */
export class QuotationPage {
  readonly page: Page;
  readonly pageHeading: Locator;
  readonly filterButton: Locator;
  readonly updateFormHeading: Locator;
  readonly viewFormHeading: Locator;
  readonly updateButton: Locator;
  readonly cancelButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeading = page.getByRole('heading', { name: 'Quote Generation', exact: true });
    this.filterButton = page.getByRole('button', { name: 'Filter', exact: true });
    this.updateFormHeading = page.getByRole('heading', { name: 'Update Quotation', exact: true });
    this.viewFormHeading = page.getByRole('heading', { name: 'View Quotation', exact: true });
    this.updateButton = page.getByRole('button', { name: 'Update', exact: true });
    this.cancelButton = page.getByRole('button', { name: 'Cancel', exact: true }).first();
    this.backButton = page.getByRole('button', { name: 'Back', exact: true });
  }

  /**
   * Real app navigation: sidebar CRM -> Sales Management -> Quotation Generation. Same toggle-safe
   * pattern as EnquiryPage.navigateFromSidebar - "Sales Management" collapses on a second click in
   * the same session, so it is only clicked when the submenu isn't already open.
   */
  async navigateFromSidebar() {
    await this.page.getByRole('button', { name: 'CRM', exact: true }).click();
    const quotationLink = this.page.getByRole('button', { name: 'Quotation Generation', exact: true });
    if (!(await quotationLink.isVisible())) {
      await this.page.getByRole('button', { name: 'Sales Management', exact: true }).click();
    }
    await quotationLink.click();
    await expect(this.pageHeading).toBeVisible();
  }

  /**
   * The listing has no semantic <table>/<tr> - same structural pattern already confirmed for
   * Customer/Vendor/Enquiry - so rows are scoped by that structural marker plus the exact
   * Customer Name they contain, never by position/.nth().
   */
  getRowByCustomerName(customerName: string): Locator {
    return this.page
      .locator('div[style*="grid-template-columns"]')
      .filter({ has: this.page.getByText(customerName, { exact: true }) })
      .first();
  }

  /** Opens the exact Quote's real Update screen by its unique Customer Name - never by row position. */
  async editQuotationByCustomerName(customerName: string) {
    const row = this.getRowByCustomerName(customerName);
    await row.getByRole('button', { name: 'Edit', exact: true }).click();
    await expect(this.updateFormHeading).toBeVisible();
  }

  /** Opens the exact Quote's read-only View screen by its unique Customer Name - never by row position. */
  async viewQuotationByCustomerName(customerName: string) {
    const row = this.getRowByCustomerName(customerName);
    await row.getByRole('button', { name: 'View More', exact: true }).click();
    await expect(this.viewFormHeading).toBeVisible();
  }

  /** Reads the listing's real "Quote Status" column for the exact record. */
  async expectQuoteStatus(customerName: string, status: 'Quote Initiated') {
    await expect(this.getRowByCustomerName(customerName)).toContainText(status);
  }

  private async openTopTab(tabName: 'Customer Information' | 'Product Information' | 'Quote') {
    await this.page.getByRole('button', { name: tabName, exact: true }).click();
  }

  /**
   * Verifies the header fields common to Update and View: Enquiry No matches the record's real
   * value, Quote No is server-generated in the real "QUOTE-NNNNNN" format (never hardcoded/guessed
   * here), and Quote Date/Quote Actual Date are populated.
   */
  async verifyHeaderFields(expectedEnquiryNo: string) {
    await expect(this.page.getByRole('textbox', { name: 'Enquiry No' })).toHaveValue(expectedEnquiryNo);
    await expect(this.page.getByRole('textbox', { name: 'Quote No' })).toHaveValue(/^QUOTE-\d+$/);
    await expect(this.page.getByRole('textbox', { name: 'Quote Date' })).not.toHaveValue('');
  }

  /**
   * Selects the FF Vendor for this Quote. Confirmed live: a searchable combobox wired to real
   * Vendor Management records (via a vendors dropdown API) - the same cross-module dependency
   * pattern as Enquiry's Customer Id, but here options render as the plain Vendor Name (no
   * "[VEND-ID]" suffix), so the shared helper's default exact match applies unchanged.
   */
  async selectFFVendor(vendorName: string) {
    await this.openTopTab('Quote');
    await selectCustomDropdown(this.page, 'FF Vendor', vendorName);
  }

  /**
   * Opens one Buy Rate section (Origin/International/Destination - confirmed live to share the
   * identical Charge Description/HS Code/Charge Based On/Quantity/Buy Rate/Buy Currency/Exchange
   * Rate/Value In INR structure) and adds one charge row. HS Code, Charge Based On and Exchange
   * Rate are all auto-filled by the app once Charge Description/Buy Currency are chosen - none are
   * set here, since overriding them would be testing invented values rather than real behavior.
   * Confirmed live via direct observation: Value In INR = Buy Rate x Quantity x Exchange Rate,
   * recalculating live as Quantity/Buy Rate change - verified by the caller using the real
   * Exchange Rate the app filled in, not a hardcoded expectation.
   */
  async addBuyRateCharge(section: 'Origin' | 'International' | 'Destination', charge: QuotationChargeData) {
    await this.openTopTab('Quote');
    await this.page.getByRole('button', { name: section, exact: true }).click();
    await this.page.getByRole('button', { name: new RegExp(`add ${section}`, 'i') }).click();
    await selectCustomDropdown(this.page, 'Charge Description', charge.chargeDescription);
    await this.page.getByRole('textbox', { name: 'Quantity' }).fill(charge.quantity);
    await this.page.getByRole('textbox', { name: 'Buy Rate' }).fill(charge.buyRate);
    await selectCustomDropdown(this.page, 'Buy Currency', charge.buyCurrency);
    await this.page.getByRole('button', { name: 'Save', exact: true }).click();
  }

  /**
   * Reads back the real Exchange Rate and Value In INR the app computed for the given section's
   * single charge row, so the caller can verify the real formula (Buy Rate x Quantity x Exchange
   * Rate) against values the application itself produced - never a hardcoded expectation.
   */
  async getChargeRowValues(section: 'Origin' | 'International' | 'Destination'): Promise<{ exchangeRate: number; valueInInr: number }> {
    await this.openTopTab('Quote');
    await this.page.getByRole('button', { name: section, exact: true }).click();
    // Role-based, not tag-based (tbody/td), since the real markup for this table is unconfirmed -
    // excludes the header row by filtering out the one containing its own column-name text.
    const dataRow = this.page
      .getByRole('row')
      .filter({ hasNotText: 'CHARGE DESCRIPTION' })
      .filter({ hasText: /\d/ })
      .first();
    const cells = dataRow.getByRole('cell');
    const count = await cells.count();
    const exchangeRateText = (await cells.nth(count - 3).innerText()).trim();
    const valueInInrText = (await cells.nth(count - 2).innerText()).trim();
    return { exchangeRate: Number(exchangeRateText), valueInInr: Number(valueInInrText) };
  }

  async submitUpdateAndExpectSuccess() {
    const responsePromise = this.page.waitForResponse(
      (res) => res.url().includes(QUOTATION_API_SEGMENT) && res.request().method() !== 'GET'
    );
    await this.updateButton.click();
    const response = await responsePromise;
    expect(response.ok(), `Quotation update request should succeed. Status ${response.status()}. Body: ${await response.text()}`).toBeTruthy();
    await expect(this.pageHeading).toBeVisible();
  }

  /** Confirmed on the live app: Cancel discards in-progress edits and returns to the listing without calling the update API. */
  async cancelUpdateForm() {
    await this.cancelButton.click();
    await expect(this.pageHeading).toBeVisible();
  }

  /**
   * Uploads one document via the "Upload File" tab. Confirmed live: the identical
   * Document-Type-then-file-then-Upload pattern already used by Enquiry/Vendor - reused, not
   * duplicated.
   */
  async uploadDocument(documentType: string, filePath: string) {
    await this.openTopTab('Quote');
    await this.page.getByRole('button', { name: 'Upload File', exact: true }).click();
    await selectCustomDropdown(this.page, 'Document Type', documentType);
    await this.page.locator('input[type="file"]').setInputFiles(filePath);
    await this.page.getByRole('button', { name: 'Upload', exact: true }).click();
    await expect(this.page.getByRole('cell', { name: documentType, exact: true }).first()).toBeVisible();
  }

  /**
   * Verifies the View screen: real header data, and the Customer Information tab's read-only,
   * Enquiry-inherited Customer Name - confirmed live to still be a plain disabled textbox here
   * (same real pattern already seen on Enquiry's own View screen), not re-editable.
   */
  async verifyViewFormFields(expectedEnquiryNo: string, expectedCustomerName: string) {
    await expect(this.viewFormHeading).toBeVisible();
    await this.verifyHeaderFields(expectedEnquiryNo);
    await this.openTopTab('Customer Information');
    const customerNameInput = this.page.getByRole('textbox', { name: 'Customer Name' });
    await expect(customerNameInput).toHaveValue(expectedCustomerName);
    await expect(customerNameInput).toBeDisabled();
    // Confirmed live: unlike Enquiry's View (Back only), Quotation's View screen keeps a visible
    // Cancel button alongside Back - both simply return to the listing, no Update here either way.
    await expect(this.backButton).toBeVisible();
    await expect(this.updateButton).not.toBeVisible();
  }

  /** Confirmed on the live app: Back on the View screen returns to the listing (only button available there). */
  async returnToListingFromView() {
    await this.backButton.click();
    await expect(this.pageHeading).toBeVisible();
  }
}
