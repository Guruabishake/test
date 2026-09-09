import { test } from '@playwright/test';
import { VendorPage } from '../pages/vendor';
test('Create Vendor - CRM', async ({ page }) => {
  const vendor = new VendorPage(page);
  await vendor.login();
  await vendor.navigateToVendor();
  await vendor.fillBasicDetails();
  await vendor.fillContact();
  await vendor.fillBank();
  await vendor.fillKYC();
  await vendor.uploadDocument();
  await vendor.submit();
});
