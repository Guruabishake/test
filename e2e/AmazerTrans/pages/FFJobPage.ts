import { Page, Locator, expect } from '@playwright/test';

export interface FFJobRowData {
  jobNo: string;
  combinedJobNo: string;
  linerBookingNo: string;
  enquiryNo: string;
  quoteNo: string;
  customerId: string;
  customerName: string;
  sbNo: string;
  status: string;
}

/**
 * FF Export Sea's own "Job List" (FF -> "FF - Export Sea" expandable submenu -> "Job List", route
 * `/ff/exportseachildjob`, heading "Job List") - a brand-new automation area (no prior AmazerTrans-
 * conforming Page Object existed; an older, non-conforming prototype at
 * `e2e/new_folder/FF/Export_Sea/cro.ts` describes a DIFFERENT, now-outdated real flow - see
 * `clickInitiateCRO` below). Confirmed live via direct UI discovery (never assumed):
 *
 * - "FF - Export Sea" (like CB's own "CB - Export Sea") is an EXPANDABLE SUBMENU under the
 *   top-level "FF" sidebar icon (a separate icon from "CB"), with real sub-links: "Job List", "CRO",
 *   "Stuffing", "Draft Invoice", "Final Invoice", "HBL Generation", "Vendor Bill" - the same idempotent
 *   submenu-reopen pattern already established for CB is used here too.
 * - Confirmed live: the SAME real Enquiry this suite's own CB Export Sea automation creates (with
 *   `freightForwarding: true`) genuinely spawns a real, separate FF Export Sea Job (`FFJOB-XXXXXX`)
 *   tied to the SAME Enquiry/Combined Job/Customer/SB No - no new Enquiry/Combined Job is needed
 *   for this continuation.
 * - List columns, confirmed real order: Job No / Combined Job No / Liner Booking No / Enquiry No /
 *   Quote No / Customer ID / Customer Name / SB No. / Job Status / Actions - each a direct child
 *   `div` of the row's own `div[style*="grid-template-columns"]` container (`:scope > div`
 *   convention). Confirmed live: "Liner Booking No" is genuinely BLANK until the real CRO process
 *   has produced one - a fresh Job Generated/pre-CRO record has no value there, not an automation
 *   gap.
 * - A row's own Actions cell holds TWO real text buttons together: "Update Status" (always) and
 *   "Initiate CRO" (present at this "Job Generated" stage).
 * - "Update Status" opens a real modal (heading "Update Status", confirmed live it renders
 *   alongside the existing "Job List" heading rather than replacing it) - same real mechanism
 *   already confirmed for CB Job's own Update Status: a "Search Status" filter textbox above a
 *   scrollable checklist of every real status, each its own real `<input type=checkbox>` (NOT an
 *   icon-only fake). Real full status list confirmed live for a "Job Generated" record: Job
 *   Generated (checked+disabled), CRO Received (enabled+unchecked - the real immediate next status),
 *   Cntr No. Received, Stuffing Completed, SI Received, Draft MBL Received, Liner Invoice Received,
 *   MBL Received, Invoice Generated, HBL Generated, Payment Received, Job Completed (all further
 *   ones disabled) - the app enforces sequential progression, this Page Object does not.
 *   Cancel/Save buttons. Confirmed live: checking "CRO Received" then clicking "Cancel" closes the
 *   modal WITHOUT committing the change - the row's own Job Status stays "Job Generated" afterward,
 *   a real, confirmed non-destructive Cancel (never assumed).
 * - "Initiate CRO": confirmed live via direct navigation (NOT the old prototype's own assumed
 *   "fill a CRO creation form" flow, which is now outdated for this app version) that it navigates
 *   straight to a real, distinct "CRO List" screen (route `/ff/exportseacro`, heading "CRO List") -
 *   its own rows expose an "Initiate Stuffing" action, out of this suite's current scope.
 * - Filter panel: 8 real fields, confirmed live via their own `name` attributes (7 required by this
 *   suite's own task, plus one extra "Customer Name" not required): `child_job_no` ("Job No"),
 *   `booking_job_no` ("Combined Job No"), `cro_no` ("Liner Booking No" - confirmed live real `name`
 *   attribute despite its own misleading text), `enquiry_no` ("Enquiry No"), `quote_no`
 *   ("Quote No"), `customer_id` ("Customer ID"), `customer_name` ("Customer Name"), `sb_no`
 *   ("SB Number"). Same standalone Search/Reset toolbar convention as every other list in this suite.
 */
export class FFJobPage {
  readonly page: Page;
  readonly pageHeading: Locator;
  readonly filterButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeading = this.page.getByRole('heading', { name: 'Job List', exact: true });
    this.filterButton = this.page.getByRole('button', { name: 'Filter', exact: true });
  }

  private async ensureExportSeaSubmenuOpen() {
    await this.page.getByRole('button', { name: 'FF', exact: true }).click();
    await this.page.waitForTimeout(300);
    const jobListVisible = await this.page.getByRole('button', { name: 'Job List', exact: true }).isVisible().catch(() => false);
    if (!jobListVisible) {
      await this.page.getByRole('button', { name: 'FF - Export Sea', exact: true }).click();
    }
  }

  async navigateFromSidebar() {
    await this.ensureExportSeaSubmenuOpen();
    await this.page.getByRole('button', { name: 'Job List', exact: true }).click({ timeout: 15_000 });
    await expect(this.pageHeading).toBeVisible();
    await expect(this.filterButton).toBeVisible({ timeout: 15_000 });
  }

  /** Job No. (`FFJOB-XXXXXX`) is the reliable, unique row identifier for this suite's own job. */
  getRowByJobNo(jobNo: string): Locator {
    return this.page.locator('div[style*="grid-template-columns"]').filter({ hasText: jobNo }).first();
  }

  async readRowData(jobNo: string): Promise<FFJobRowData> {
    const row = this.getRowByJobNo(jobNo);
    await expect(row).toBeVisible({ timeout: 15_000 });
    const cells = await row.locator(':scope > div').allInnerTexts();
    return {
      jobNo: (cells[0] ?? '').trim(),
      combinedJobNo: (cells[1] ?? '').trim(),
      linerBookingNo: (cells[2] ?? '').trim(),
      enquiryNo: (cells[3] ?? '').trim(),
      quoteNo: (cells[4] ?? '').trim(),
      customerId: (cells[5] ?? '').trim(),
      customerName: (cells[6] ?? '').trim(),
      sbNo: (cells[7] ?? '').trim(),
      status: (cells[8] ?? '').trim(),
    };
  }

  async openFilter() {
    const alreadyOpen = await this.page.locator('input[name="child_job_no"]').isVisible().catch(() => false);
    if (!alreadyOpen) {
      await this.filterButton.click();
    }
    await expect(this.page.locator('input[name="child_job_no"]')).toBeVisible();
  }

  private async searchAndWait() {
    await this.page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(this.page.getByText(/\d+(\s+of\s+\d+)?\s+records$/)).toBeVisible();
  }

  async filterByJobNo(value: string) {
    await this.page.locator('input[name="child_job_no"]').fill(value);
    await this.searchAndWait();
  }
  async filterByCombinedJobNo(value: string) {
    await this.page.locator('input[name="booking_job_no"]').fill(value);
    await this.searchAndWait();
  }
  async filterByLinerBookingNo(value: string) {
    await this.page.locator('input[name="cro_no"]').fill(value);
    await this.searchAndWait();
  }
  async filterByEnquiryNo(value: string) {
    await this.page.locator('input[name="enquiry_no"]').fill(value);
    await this.searchAndWait();
  }
  async filterByQuoteNo(value: string) {
    await this.page.locator('input[name="quote_no"]').fill(value);
    await this.searchAndWait();
  }
  async filterByCustomerId(value: string) {
    await this.page.locator('input[name="customer_id"]').fill(value);
    await this.searchAndWait();
  }
  async filterBySbNo(value: string) {
    await this.page.locator('input[name="sb_no"]').fill(value);
    await this.searchAndWait();
  }

  /**
   * Confirmed live via two real runs: asserting the exact pre-filter total after Reset is
   * genuinely flaky on this shared staging environment - the real total can shift between the
   * "before" capture and the post-Reset check (other concurrent activity on the same shared Job
   * List), causing a real, non-deterministic failure unrelated to whether Reset itself worked.
   * Reset's own real purpose is "the filter was cleared and the unfiltered list re-rendered" -
   * confirmed by the unscoped `N records` pattern reappearing at all, not by pinning its exact
   * value against a stale snapshot.
   */
  async resetFilter() {
    await this.page.getByRole('button', { name: 'Reset', exact: true }).click({ timeout: 20_000 });
    await expect(this.pageHeading).toBeVisible();
    await expect(this.page.getByText(/^\d+ records$/)).toBeVisible({ timeout: 20_000 });
  }

  async openUpdateStatusModal(jobNo: string) {
    await this.getRowByJobNo(jobNo).getByRole('button', { name: 'Update Status', exact: true }).click({ timeout: 15_000 });
    await expect(this.page.getByRole('heading', { name: 'Update Status', exact: true })).toBeVisible();
  }

  /** Confirmed live: a real `<input type=checkbox>`, not an icon-only fake - `check()`/`isChecked()` work directly. Caller verifies the actual checked state rather than assuming the click alone succeeded. */
  async checkCroReceived() {
    const checkbox = this.page.getByRole('checkbox', { name: 'CRO Received', exact: true });
    await checkbox.check({ timeout: 10_000 });
    return checkbox.isChecked();
  }

  /** Confirmed live: this genuinely does NOT commit the change - the row's own status stays at its real prior value afterward. */
  async cancelStatusUpdate() {
    await this.page.getByRole('button', { name: 'Cancel', exact: true }).click({ timeout: 15_000 });
    await expect(this.page.getByRole('heading', { name: 'Update Status', exact: true })).not.toBeVisible({ timeout: 15_000 });
    await expect(this.pageHeading).toBeVisible();
  }

  /**
   * Confirmed live: navigates straight to a real, distinct "CRO List" screen (route
   * `/ff/exportseacro`) - NOT a CRO creation form (an older, non-conforming prototype elsewhere in
   * this repo describes that outdated flow; re-confirmed live this app version does not do that).
   */
  async clickInitiateCRO(jobNo: string) {
    await this.getRowByJobNo(jobNo).getByRole('button', { name: 'Initiate CRO', exact: true }).click({ timeout: 15_000 });
  }
}
