import { Page, Locator, expect } from '@playwright/test';

/**
 * FF Export Sea's own "HBL Generation" module - reached from the FF Job List's own "Initiate HBL"
 * row action (same real "no separate creation trigger" mechanism already confirmed for Draft
 * Invoice/other Initiate actions in this suite). This continuation only needs to confirm real
 * navigation onto the Create screen, so this Page Object starts minimal (a stable heading check)
 * and is meant to grow as later work exercises more of this module.
 */
export class HBLPage {
  readonly page: Page;
  readonly createHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createHeading = this.page.getByRole('heading', { name: /HBL Generation\s*-\s*Create/i });
  }

  async expectOnCreateScreen() {
    await expect(this.createHeading).toBeVisible({ timeout: 20_000 });
  }
}
