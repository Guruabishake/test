import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { VendorPage } from '../pages/VendorPage';
import {
  loginData,
  VENDOR_COUNT,
  generateVendorData,
  generateCustomerContact,
  generateBankDetails,
  VendorData,
} from '../utils/testData';

async function loginAndOpenVendorManagement(page: import('@playwright/test').Page) {
  const login = new LoginPage(page);
  await login.goto(loginData.url);
  await login.login(loginData.username, loginData.password, loginData.branch);
  await login.verifyLoginSuccess();

  const vendor = new VendorPage(page);
  await vendor.navigateFromSidebar();
  return vendor;
}

function omit<T extends object, K extends keyof T>(data: T, key: K): Omit<T, K> {
  const clone: Partial<T> = { ...data };
  delete clone[key];
  return clone as Omit<T, K>;
}

function omitMany<T extends object, K extends keyof T>(data: T, keys: K[]): Omit<T, K> {
  const clone: Partial<T> = { ...data };
  for (const key of keys) delete clone[key];
  return clone as Omit<T, K>;
}

// AmazerTrans only allows one active session per account (confirmed on the live app via its
// "Duplicate Session Detected" dialog). Run this suite serially:
// `npx playwright test e2e/AmazerTrans --project=chromium --workers=1`.
test.describe.configure({ mode: 'serial' });

test.describe('Vendor Management', () => {
  test('Vendor Management page displays the listing, Create button and table columns', async ({ page }) => {
    const vendor = await loginAndOpenVendorManagement(page);
    await vendor.verifyListingPageElements();
  });

  test('Create Vendor form displays all required fields', async ({ page }) => {
    const vendor = await loginAndOpenVendorManagement(page);
    await vendor.openCreateForm();
    await vendor.verifyCreateFormFields();
  });

  test.describe('Positive: full-form vendor creation', () => {
    test('Creates a vendor with Basic, Contact, Bank, Document and Credit details', async ({ page }) => {
      const vendor = await loginAndOpenVendorManagement(page);
      await vendor.openCreateForm();

      const data = generateVendorData(9001);
      await vendor.fillBasicDetails(data);
      await vendor.fillContactDetails(generateCustomerContact(9501));
      await vendor.fillBankDetails(generateBankDetails(9501));
      await vendor.uploadKycDocument('Aadhar');
      await vendor.fillCreditDetails('45', '75000');

      await vendor.submitAndExpectSuccess();
      await vendor.verifyVendorInListing(data.vendorName);
    });
  });

  test.describe('Negative validations', () => {
    const validBase = (): VendorData => generateVendorData(9600);

    const requiredFieldCases: Array<{
      description: string;
      build: (base: VendorData) => Partial<VendorData>;
      expectedMessage: string;
    }> = [
      {
        description: 'Vendor Name',
        build: (base) => omit(base, 'vendorName'),
        expectedMessage: 'Vendor Name is required.',
      },
      {
        description: 'Vendor Type',
        // Sub Type only renders once Vendor Type is chosen, and State's option list only
        // populates once Country auto-defaults (which itself only happens once Vendor Type is
        // chosen) - all three must be left out together here.
        build: (base) => omitMany(base, ['vendorType', 'subType', 'state']),
        expectedMessage: 'Vendor Type is required.',
      },
      {
        description: 'Address 1',
        build: (base) => omit(base, 'address1'),
        expectedMessage: 'Address 1 is required.',
      },
      {
        description: 'State',
        build: (base) => omit(base, 'state'),
        expectedMessage: 'State is required.',
      },
      {
        description: 'City',
        build: (base) => omit(base, 'city'),
        expectedMessage: 'City is required.',
      },
      {
        description: 'Phone Number',
        build: (base) => omit(base, 'phone'),
        expectedMessage: 'Phone Number is required.',
      },
    ];

    for (const { description, build, expectedMessage } of requiredFieldCases) {
      test(`Leaving "${description}" empty shows: "${expectedMessage}"`, async ({ page }) => {
        const vendor = await loginAndOpenVendorManagement(page);
        await vendor.openCreateForm();
        await vendor.fillBasicDetails(build(validBase()));
        await vendor.submitAndExpectValidationErrors(expectedMessage);
      });
    }

    test('Vendor Type is required when Country is left empty (no auto-default before selection)', async ({
      page,
    }) => {
      // Confirmed on the live app: Customer form defaults Country to "India" up front, but
      // Vendor form only defaults it once Vendor Type is chosen - leaving Vendor Type empty
      // also leaves Country unset and surfaces its own message.
      const vendor = await loginAndOpenVendorManagement(page);
      await vendor.openCreateForm();
      // Sub Type only renders once Vendor Type is chosen, and State's options only populate
      // once Country auto-defaults (which itself needs Vendor Type) - omit all three together.
      await vendor.fillBasicDetails(omitMany(validBase(), ['vendorType', 'subType', 'state']));
      await vendor.submitAndExpectValidationErrors('Vendor Type is required.', 'Country is required.');
    });

    test('Email Address is optional for a Vendor (unlike Customer, where it is required)', async ({ page }) => {
      const vendor = await loginAndOpenVendorManagement(page);
      await vendor.openCreateForm();
      await vendor.fillBasicDetails(omit(generateVendorData(9650), 'email'));
      await vendor.submitAndExpectSuccess();
    });

    test('Phone Number silently rejects non-numeric keystrokes', async ({ page }) => {
      // Confirmed on the live app (same behavior as Customer): the field's input handler filters
      // non-numeric characters as you type, leaving the field empty rather than failing pattern
      // validation on submit.
      const vendor = await loginAndOpenVendorManagement(page);
      await vendor.openCreateForm();
      const phoneInput = page.getByRole('textbox', { name: 'Phone Number' });
      await phoneInput.pressSequentially('abcdefghij');
      await expect(phoneInput).toHaveValue('');
    });

    test('Phone Number enforces a maximum of 10 characters while typing', async ({ page }) => {
      const vendor = await loginAndOpenVendorManagement(page);
      await vendor.openCreateForm();
      const phoneInput = page.getByRole('textbox', { name: 'Phone Number' });
      await phoneInput.pressSequentially('123456789012345');
      await expect(phoneInput).toHaveValue('1234567890');
    });

    test('PAN must be exactly 10 characters (minlength/maxlength boundary)', async ({ page }) => {
      const vendor = await loginAndOpenVendorManagement(page);
      await vendor.openCreateForm();
      const panInput = page.getByRole('textbox', { name: 'PAN' });
      await panInput.pressSequentially('SHORT12');
      const isTooShort = await panInput.evaluate((el: HTMLInputElement) => el.validity.tooShort);
      expect(isTooShort).toBe(true);
    });

    test('Duplicate phone number is rejected with the real backend error', async ({ page }) => {
      const vendor = await loginAndOpenVendorManagement(page);

      const first = generateVendorData(9700);
      await vendor.openCreateForm();
      await vendor.fillBasicDetails(first);
      await vendor.submitAndExpectSuccess();

      const second = { ...generateVendorData(9701), phone: first.phone };
      await vendor.openCreateForm();
      await vendor.fillBasicDetails(second);
      await vendor.submitAndExpectDuplicatePhoneError();
    });
  });

  test.describe('Bulk creation via configurable loop', () => {
    // VENDOR_COUNT comes from VENDOR_COUNT in .env - change it there (5 -> 10 -> 20 -> 50)
    // without touching this loop.
    test(`Creates ${VENDOR_COUNT} unique vendors and verifies each appears in the listing`, async ({ page }) => {
      const vendor = await loginAndOpenVendorManagement(page);

      for (let i = 0; i < VENDOR_COUNT; i++) {
        await test.step(`Create vendor #${i + 1} of ${VENDOR_COUNT}`, async () => {
          const data = generateVendorData(i);
          try {
            await vendor.openCreateForm();
            await vendor.fillBasicDetails(data);
            await vendor.submitAndExpectSuccess();
            await vendor.verifyVendorInListing(data.vendorName);
          } catch (error) {
            throw new Error(
              `Vendor creation failed at iteration ${i + 1}/${VENDOR_COUNT} ` +
                `(vendorName="${data.vendorName}", phone="${data.phone}"): ${(error as Error).message}`
            );
          }
        });
      }
    });
  });
});
