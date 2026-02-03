import { test } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';
import { MasterPage } from '../pages/master.page';
test.setTimeout(300000);
test('Create Document Type', async ({ page }) => {

  const login = new LoginPage(page);
  const dashboard = new DashboardPage(page);
  const master = new MasterPage(page);

  await login.goto();
  await login.login('superadmin@amazertrans.com', 'Welcome@123');

  await dashboard.goToMaster();
  await master.openDocumentType();
  await master.createDocumentType('User Manual Document');
});
