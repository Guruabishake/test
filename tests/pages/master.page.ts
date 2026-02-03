export class MasterPage {
  constructor(private page: Page) {}

  async openDocumentType() {
    await this.page.getByRole('button', { name: 'Document Type' }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async createDocumentType(name: string) {
    await this.page.getByRole('button', { name: '+ Create' }).click();
    await this.page.getByRole('textbox', { name: 'Document Type' }).fill(name);
    await this.page.getByRole('button', { name: 'Create' }).click();
  }
}
