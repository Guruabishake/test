import { Page } from '@playwright/test';
  import { fillField, selectDropdown1, clickBtn, selectDropdown } from '../../utils/commonActions'; 
import { invoiceData, charges, vendorCharges, parties } from '../../utils/testData';

export class InvoicePage {
  constructor(public page: Page) {}

  async initiateInvoice() {
    await clickBtn(this.page, 'Initiate Draft Invoice');
  }

  async fillInvoiceHeader() {
    await fillField(this.page, 'No of Invoice Copies', invoiceData.copies);
    await fillField(this.page, 'Shipper Invoice No', invoiceData.shipperInvoice);
    await fillField(this.page, 'BL / AWB No', invoiceData.blNo);

    await fillField(this.page, 'Consignee Address 1', invoiceData.consignee.address1);
    await fillField(this.page, 'Consignee Address 2', invoiceData.consignee.address2);
    await fillField(this.page, 'Consignee Address 3', invoiceData.consignee.address3);
  }

  async addCharges() {
    for (const charge of charges) {
      await clickBtn(this.page, '+ Add New', 0);

      await selectDropdown1(this.page, 'Description', charge.desc);
      await selectDropdown1(this.page, 'UOM', charge.uom);

      await fillField(this.page, 'Qty', charge.qty);
      await fillField(this.page, 'Rate', charge.rate);

      await clickBtn(this.page, 'Add');
    }
  }

  async addVendorCharges() {
    for (const charge of vendorCharges) {
      await clickBtn(this.page, '+ Add New', 1);

      await selectDropdown1(this.page, 'Description', charge.desc);
      await selectDropdown1(this.page, 'Vendor Name', charge.vendor);
      await selectDropdown1(this.page, 'UOM', charge.uom);

      await this.page.getByRole('spinbutton', { name: 'Qty' }).fill(charge.qty);
      await this.page.getByRole('spinbutton', { name: 'Rate' }).fill(charge.rate);

      await clickBtn(this.page, 'Add');
    }
  }

  async fillParties() {
    let index = 1;

    for (const party of parties) {
      await this.page.getByRole('textbox', { name: 'Company Name' }).nth(index).fill(party.company);
      await this.page.getByRole('textbox', { name: 'Mobile No' }).nth(index).fill(party.mobile);
      await this.page.locator('#email').nth(index).fill(party.email);

      index++;
    }
  }

  async uploadDocument(filePath: string) {
    await selectDropdown(this.page, 'Document Type', 'doc');
    await this.page.setInputFiles('input[type="file"]', filePath);
    await clickBtn(this.page, '+ Add Document');
  }

  async submit() {
    await clickBtn(this.page, 'Create');
  }
}