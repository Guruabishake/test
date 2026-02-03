import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('https://staging-amazertrans.cargowayz.net/login/AMAZERTRANS');
  }

  async login(username: string, password: string) {
    await this.page.fill('input[type="text"]', username);
    await this.page.selectOption('select', '1'); // company dropdown
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button:has-text("Login")');
  }
}
