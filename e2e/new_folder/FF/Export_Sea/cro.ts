import { Page } from '@playwright/test';
import { croData } from '../../utils/testData';

export class CROPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.getByRole('button', { name: 'CRM' }).click();
    await this.page.getByRole('button', { name: 'FF' }).click();
    await this.page.getByRole('button', { name: 'FF - Export Sea' }).click();
    await this.page.getByRole('button', { name: 'Child Job List' }).click();
  }

  async openJob() {
    await this.page.getByText('FFJOB').first().click({ button: 'middle' });
  }

  async initiateCRO() {
    const initiateCroButton = this.page.locator('button:visible', { hasText: 'Initiate CRO' }).first();

    await initiateCroButton.waitFor({ state: 'visible' });
    await initiateCroButton.scrollIntoViewIfNeeded();

    try {
      await initiateCroButton.click({ timeout: 5000 });
    } catch {
      await initiateCroButton.evaluate((button) => {
        (button as HTMLButtonElement).click();
      });
    }
  }

  async fillBasicDetails() {
    await this.page.getByRole('textbox', { name: 'Liner Booking No' })
      .fill(croData.linerBookingNo);

    await this.page.getByRole('textbox', { name: 'Contract No' })
      .fill(croData.contractNo);

    await this.page.getByRole('textbox', { name: 'Consignee' })
      .fill(croData.consignee);
  }

  // 🔥 LOOP - CONTAINERS
  async addContainers() {
    for (let i = 0; i < croData.containers.length; i++) {

      const c = croData.containers[i];

      await this.page.getByRole('button', { name: '+ Add New' }).first().click();

      await this.page.getByRole('textbox', { name: 'Container No.' }).fill(c.number);
      await this.page.getByLabel('Size of Container').selectOption(c.size);
      await this.page.getByLabel('Type of Container').selectOption(c.type);
      await this.page.getByRole('textbox', { name: 'Sub Equip' }).fill(c.subEquip);
      await this.page.getByRole('textbox', { name: 'Gross Weight' }).fill(c.grossWeight);
      await this.page.getByRole('textbox', { name: 'Pack Qty/Kind' }).fill(c.packQty);
      await this.page.getByRole('textbox', { name: 'Cargo Volume' }).fill(c.volume);

      await this.page.getByRole('button', { name: 'Add' }).click();
    }
  }

  // 🔥 LOOP - ROUTES
  async addRoutes() {
    for (let i = 0; i < croData.routes.length; i++) {

      const r = croData.routes[i];

      await this.page.getByRole('button', { name: '+ Add New' }).nth(1).click();

      await this.page.getByRole('textbox', { name: 'From' }).fill(r.from);
      await this.page.getByRole('textbox', { name: 'To' }).fill(r.to);
      await this.page.getByRole('textbox', { name: 'Transhipment Port' }).fill(r.transhipment);
      await this.page.getByRole('textbox', { name: 'Mode' }).fill(r.mode);
      await this.page.getByRole('textbox', { name: 'Vessel Name' }).fill(r.vessel);
      await this.page.getByRole('textbox', { name: 'Voyage No' }).fill(r.voyage);
      await this.page.getByRole('textbox', { name: 'ETD' }).fill(r.etd);
      await this.page.getByRole('textbox', { name: 'ETA' }).fill(r.eta);

      await this.page.getByRole('button', { name: 'Add' }).click();
    }
  }

  async uploadDocument(filePath: string) {
    await this.page.getByLabel('Document Type')
      .selectOption(croData.document.type);

    await this.page.setInputFiles('input[type="file"]', filePath);

    await this.page.getByRole('button', { name: '+ Add Document' }).click();
  }

  async submit() {
    await this.page.getByRole('button', { name: 'Create' }).click();
  }
}
