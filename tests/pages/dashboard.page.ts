import { Page } from '@playwright/test';

export class DashboardPage {
  constructor(private page: Page) {}
async goToMaster() {
  await this.page.getByRole('button', { name: 'Master' }).click();

}
}
