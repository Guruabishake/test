import { Page, Locator, expect } from '@playwright/test';
import { selectCustomDropdown } from '../utils/commonActions';
import { EnquiryData, CargoItemData } from '../utils/testData';

const CREATE_ENQUIRY_API = '/middleware/api/v1/enquiry/createEnquiry';

/**
 * Enquiry (CRM -> Sales Management -> Enquiry) is a multi-tab, multi-service form - far more
 * complex than Customer/Vendor. Only the Freight-Forwarding service path is automated so far
 * (confirmed live to be the majority of real existing records); Customs Broker and Transport
 * Management System each reveal their own distinct required-field sets in Product Information
 * and are intentionally out of scope for this phase.
 */
export class EnquiryPage {
  readonly page: Page;
  readonly pageHeading: Locator;
  readonly createButton: Locator;
  readonly filterButton: Locator;
  readonly createFormHeading: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeading = page.getByRole('heading', { name: 'Enquiry', exact: true });
    // Rendered as two adjacent spans ("+" / "Create") with no separating whitespace, same as
    // Customer/Vendor - exact "+ Create" role-name match is unreliable, so match loosely.
    this.createButton = page.getByRole('button', { name: /create/i }).first();
    this.filterButton = page.getByRole('button', { name: 'Filter', exact: true });
    this.createFormHeading = page.getByRole('heading', { name: 'Create Enquiry', exact: true });
    this.submitButton = page.getByRole('button', { name: 'Create', exact: true });
    this.cancelButton = page.getByRole('button', { name: 'Cancel', exact: true }).first();
  }

  /** Real app navigation: sidebar CRM -> Sales Management -> Enquiry (no direct URL navigation). */
  async navigateFromSidebar() {
    await this.page.getByRole('button', { name: 'CRM', exact: true }).click();
    await this.page.getByRole('button', { name: 'Sales Management', exact: true }).click();
    await this.page.getByRole('button', { name: 'Enquiry', exact: true }).click();
    await expect(this.pageHeading).toBeVisible();
  }

  async verifyListingPageElements() {
    await expect(this.pageHeading).toBeVisible();
    await expect(this.createButton).toBeVisible();
    await expect(this.filterButton).toBeVisible();
    await expect(this.page.getByText('Enquiry No', { exact: true })).toBeVisible();
    await expect(this.page.getByText('Customer Name', { exact: true })).toBeVisible();
    await expect(this.page.getByText('Enquiry Status', { exact: true })).toBeVisible();
  }

  async openCreateForm() {
    await this.createButton.click();
    await expect(this.createFormHeading).toBeVisible();
  }

  /** Confirmed live: at least one Service checkbox must be checked - this gates which Product Information fields become required. */
  async selectServices(services: Array<'Freight-Forwarding' | 'Customs Broker' | 'Transport Management System'>) {
    for (const service of services) {
      await this.page.getByRole('checkbox', { name: service, exact: true }).check();
    }
  }

  private async openTab(tabName: 'Customer Information' | 'Product Information' | 'Cargo Information' | 'Upload File') {
    await this.page.getByRole('button', { name: tabName, exact: true }).click();
  }

  /**
   * Fills the Customer Information tab. Customer Id is the same searchable custom-combobox
   * widget used on Customer/Vendor - confirmed live it is wired to real Customer Management
   * records (via the customers dropdown API) and auto-fills/disables Customer Name, Address 1
   * and Address 2 once a record is selected, so those three are deliberately not set here.
   */
  async fillCustomerInformation(customerSearchText: string, sourceOfEnquiry: string) {
    await this.openTab('Customer Information');
    // Confirmed live: each option renders as "<name> [CUST-ID]", so an exact match on the name
    // alone never matches - use 'contains' (the one confirmed exception to the shared helper's
    // default exact match, see commonActions.ts).
    await selectCustomDropdown(this.page, 'Customer Id', customerSearchText, 'contains');
    await this.page.getByRole('textbox', { name: 'Source of Enquiry' }).fill(sourceOfEnquiry);
  }

  /**
   * Fills the Product Information fields required for the Freight-Forwarding service only.
   * Confirmed live: Inco Term, Service, POL, POD and the Origin Clearance By/Location fields are
   * NOT required (no validation error appears for them) - only Shipment Mode, Shipment
   * Direction, Business Type and the Destination Clearance By/Location pair are mandatory, an
   * asymmetric Origin-vs-Destination requirement confirmed on the live app.
   */
  async fillFreightForwardingProductInfo(data: EnquiryData) {
    await this.openTab('Product Information');
    await selectCustomDropdown(this.page, 'Shipment Mode', data.shipmentMode);
    await selectCustomDropdown(this.page, 'Shipment Direction', data.shipmentDirection);
    await selectCustomDropdown(this.page, 'Business Type', data.businessType);
    await selectCustomDropdown(this.page, 'Destination Clearance By', data.destinationClearanceBy);
    await this.page.getByRole('textbox', { name: 'Destination Clearance Location' }).fill(data.destinationClearanceLocation);
  }

  /**
   * Adds one Cargo row via the "Add Cargo" inline form and Saves it. Confirmed live: Create
   * fails with "At least one cargo item must be added." until this table has at least one row -
   * it is not optional once a service (here, Freight-Forwarding) has been selected.
   */
  async addCargoItem(cargo: CargoItemData) {
    await this.openTab('Cargo Information');
    // Rendered as adjacent "+" / "Add Cargo" spans with no separating whitespace, same pattern
    // as the listing's "+ Create" button - an exact "Add Cargo" match is unreliable.
    await this.page.getByRole('button', { name: /add cargo/i }).click();
    await this.page.getByRole('textbox', { name: 'No Of Packages' }).fill(cargo.noOfPackages);
    // Confirmed live: unlike every other field in this row, Cargo Name is exposed with
    // role="combobox" (an autocomplete-enabled input), not role="textbox" - still a plain
    // fill()-able input underneath, just a different accessible role.
    await this.page.getByRole('combobox', { name: 'Cargo Name' }).fill(cargo.cargoName);
    await this.page.getByRole('textbox', { name: 'Gross Wt' }).fill(cargo.grossWt);
    await this.page.getByRole('textbox', { name: 'Net Wt' }).fill(cargo.netWt);
    await selectCustomDropdown(this.page, 'UOM', cargo.uom);
    await this.page.getByRole('textbox', { name: 'Commodity' }).fill(cargo.commodity);
    await this.page.getByRole('textbox', { name: 'Kind Of Packages' }).fill(cargo.kindOfPackages);
    await selectCustomDropdown(this.page, 'DG/Non-DG', cargo.dgNonDg);
    await this.page.getByRole('button', { name: 'Save', exact: true }).click();
  }

  async submitAndExpectSuccess() {
    const responsePromise = this.page.waitForResponse(
      (res) => res.url().includes(CREATE_ENQUIRY_API) && res.request().method() === 'POST'
    );
    await this.submitButton.click();
    const response = await responsePromise;
    expect(response.status(), `createEnquiry API should return 200. Body: ${await response.text()}`).toBe(200);
    await expect(this.pageHeading).toBeVisible();
  }

  /** Submits and asserts the specific inline validation message(s) shown, without leaving the form. */
  async submitAndExpectValidationErrors(...messages: string[]) {
    await this.submitButton.click();
    for (const message of messages) {
      await expect(this.page.getByText(message, { exact: true }).first()).toBeVisible();
    }
    await expect(this.createFormHeading).toBeVisible();
  }

  /** Confirmed on the live app: Cancel discards the in-progress form and returns to the listing without calling the create API. */
  async cancelCreateForm() {
    await this.cancelButton.click();
    await expect(this.pageHeading).toBeVisible();
  }

  /**
   * The listing has no semantic <table>/<tr> - each row is a plain div laid out with inline CSS
   * grid, same structural pattern confirmed for Customer/Vendor - so rows are scoped by that
   * structural marker plus the exact Customer Name they contain, never by position/.nth().
   * Enquiry No is server-generated and unknown ahead of creation, so Customer Name is the only
   * reliable unique key available to the caller at Create time.
   */
  getRowByCustomerName(customerName: string): Locator {
    return this.page
      .locator('div[style*="grid-template-columns"]')
      .filter({ has: this.page.getByText(customerName, { exact: true }) })
      .first();
  }

  async verifyEnquiryInListing(customerName: string, shipmentMode: string, status: string) {
    const row = this.getRowByCustomerName(customerName);
    await expect(row).toBeVisible();
    await expect(row).toContainText(shipmentMode);
    await expect(row).toContainText(status);
  }
}
