import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { CustomerPage } from '../pages/CustomerPage';
import { captureScreenshot } from '../utils/screenshot';
import {
  loginData,
  CUSTOMER_COUNT,
  generateCustomerData,
  generateCustomerContact,
  generateBankDetails,
  generateGstDetails,
  CustomerData,
} from '../utils/testData';

async function loginAndOpenCustomerManagement(page: import('@playwright/test').Page) {
  const login = new LoginPage(page);
  await login.goto(loginData.url);
  await login.login(loginData.username, loginData.password, loginData.branch);
  await login.verifyLoginSuccess();

  const customer = new CustomerPage(page);
  await customer.navigateFromSidebar();
  return customer;
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

test.describe('Customer Management', () => {
  test('Customer Management page displays the listing, Create button and table columns', async ({ page }) => {
    const customer = await loginAndOpenCustomerManagement(page);
    await customer.verifyListingPageElements();
  });

  test('Create Customer form displays all required fields', async ({ page }) => {
    const customer = await loginAndOpenCustomerManagement(page);
    await customer.openCreateForm();
    await customer.verifyCreateFormFields();
  });

  test.describe('Positive: full-form customer creation', () => {
    test('Creates a customer with Basic, Contact, Bank, KYC, Document and Credit details', async ({ page }) => {
      const customer = await loginAndOpenCustomerManagement(page);
      await customer.openCreateForm();

      const data = generateCustomerData(9001);
      await customer.fillBasicDetails(data);
      await customer.fillContactDetails(generateCustomerContact(9001));
      await customer.fillBankDetails(generateBankDetails(9001));
      await customer.fillKycDetails(generateGstDetails(9001));
      await customer.uploadKycDocument('Aadhar');
      await customer.fillCreditDetails('30', '50000');

      await customer.submitAndExpectSuccess();
      await customer.verifyCustomerInListing(data.customerName);
    });
  });

  test.describe('Edit & Update', () => {
    test('Update Customer screen shows the existing record data and correct field/button states', async ({
      page,
    }) => {
      const customer = await loginAndOpenCustomerManagement(page);
      const data = generateCustomerData(9500);
      await customer.openCreateForm();
      await customer.fillBasicDetails(data);
      await customer.submitAndExpectSuccess();

      await customer.editCustomerByName(data.customerName);
      await customer.verifyUpdateFormFields(data);
    });

    test('Updates Customer Name, Address and City, and the change is reflected in the listing', async ({
      page,
    }) => {
      const customer = await loginAndOpenCustomerManagement(page);
      const original = generateCustomerData(9510);
      await customer.openCreateForm();
      await customer.fillBasicDetails(original);
      await customer.submitAndExpectSuccess();

      // Confirmed on the live app: the Customer Name field silently strips underscores as you
      // type/set it (same real-time-sanitize pattern as Phone Number), so "_Updated" would land
      // as "Updated" with no separator - a space survives instead.
      const updatedName = `${original.customerName} Updated`;
      const updatedCity = 'Madurai Updated City';

      await customer.editCustomerByName(original.customerName);
      try {
        // Only the fields actually being changed are passed - fillBasicDetails leaves every
        // other (already-populated) field untouched.
        await customer.fillBasicDetails({ customerName: updatedName, city: updatedCity });
        await customer.submitUpdateAndExpectSuccess();
        await captureScreenshot(page, 'customer', 'update-success', updatedName);
      } catch (error) {
        await captureScreenshot(page, 'customer', 'update-failure', original.customerName);
        throw new Error(`Customer update failed for "${original.customerName}": ${(error as Error).message}`);
      }

      await customer.verifyCustomerInListing(updatedName);

      // Unchanged values (not shown in the listing table) must still be intact - reopen and check.
      await customer.editCustomerByName(updatedName);
      await expect(page.getByRole('textbox', { name: 'Phone Number' })).toHaveValue(original.phone);
      await expect(page.getByRole('textbox', { name: 'Email Address' })).toHaveValue(original.email);
      await customer.cancelUpdateForm();
    });

    test('Cancel on the Update screen discards changes', async ({ page }) => {
      // Confirmed on the live app: Cancel returns to the listing without calling updateCustomer,
      // and any in-progress edits are discarded rather than saved.
      const customer = await loginAndOpenCustomerManagement(page);
      const data = generateCustomerData(9520);
      await customer.openCreateForm();
      await customer.fillBasicDetails(data);
      await customer.submitAndExpectSuccess();

      await customer.editCustomerByName(data.customerName);
      await customer.fillBasicDetails({ city: 'ShouldNotPersist' });
      await customer.cancelUpdateForm();
      await customer.verifyCustomerInListing(data.customerName);

      await customer.editCustomerByName(data.customerName);
      await expect(page.getByRole('textbox', { name: 'City' })).toHaveValue(data.city);
      await customer.cancelUpdateForm();
    });

    test.describe('Negative validations', () => {
      test('Clearing Customer Name on Update shows the same required-field message as Create', async ({
        page,
      }) => {
        const customer = await loginAndOpenCustomerManagement(page);
        const data = generateCustomerData(9530);
        await customer.openCreateForm();
        await customer.fillBasicDetails(data);
        await customer.submitAndExpectSuccess();

        await customer.editCustomerByName(data.customerName);
        await customer.fillBasicDetails({ customerName: '' });
        await customer.submitUpdateAndExpectValidationErrors('Customer Name is required.');
        await customer.cancelUpdateForm();
      });

      test('Invalid email format on Update is rejected by the browser (native type=email validation)', async ({
        page,
      }) => {
        const customer = await loginAndOpenCustomerManagement(page);
        const data = generateCustomerData(9531);
        await customer.openCreateForm();
        await customer.fillBasicDetails(data);
        await customer.submitAndExpectSuccess();

        await customer.editCustomerByName(data.customerName);
        await customer.fillBasicDetails({ email: 'not-a-valid-email' });
        const emailInput = page.getByRole('textbox', { name: 'Email Address' });
        const isTypeMismatch = await emailInput.evaluate((el: HTMLInputElement) => el.validity.typeMismatch);
        expect(isTypeMismatch).toBe(true);
        await customer.cancelUpdateForm();
      });

      test('Updating Phone Number to another customer\'s value is rejected as a duplicate', async ({ page }) => {
        const customer = await loginAndOpenCustomerManagement(page);
        const customerA = generateCustomerData(9540);
        const customerB = generateCustomerData(9541);

        await customer.openCreateForm();
        await customer.fillBasicDetails(customerA);
        await customer.submitAndExpectSuccess();

        await customer.openCreateForm();
        await customer.fillBasicDetails(customerB);
        await customer.submitAndExpectSuccess();

        await customer.editCustomerByName(customerB.customerName);
        await customer.fillBasicDetails({ phone: customerA.phone });
        await customer.submitUpdateAndExpectDuplicatePhoneError();
        await customer.cancelUpdateForm();
      });
    });
  });

  test.describe('Negative validations', () => {
    const validBase = (): CustomerData => generateCustomerData(9100);

    const requiredFieldCases: Array<{
      description: string;
      build: (base: CustomerData) => Partial<CustomerData>;
      expectedMessage: string;
    }> = [
      {
        description: 'Customer Name',
        build: (base) => omit(base, 'customerName'),
        expectedMessage: 'Customer Name is required.',
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
      {
        description: 'Email Address',
        build: (base) => omit(base, 'email'),
        expectedMessage: 'Email Address is required.',
      },
      {
        description: 'Sub Type (conditional on Domestic Customer Type)',
        // Gst Applicable only renders once Sub Type is chosen, so it must be left out too here.
        build: (base) => omitMany(base, ['subType', 'gstApplicable']),
        expectedMessage: 'Sub Type is required for Domestic customers.',
      },
    ];

    for (const { description, build, expectedMessage } of requiredFieldCases) {
      test(`Leaving "${description}" empty shows: "${expectedMessage}"`, async ({ page }) => {
        const customer = await loginAndOpenCustomerManagement(page);
        await customer.openCreateForm();
        await customer.fillBasicDetails(build(validBase()));
        await customer.submitAndExpectValidationErrors(expectedMessage);
      });
    }

    test('Submitting a completely empty form shows every required-field message together', async ({ page }) => {
      const customer = await loginAndOpenCustomerManagement(page);
      await customer.openCreateForm();
      await customer.submitAndExpectValidationErrors(
        'Customer Name is required.',
        'Address 1 is required.',
        'State is required.',
        'City is required.',
        'Phone Number is required.',
        'Email Address is required.'
      );
    });

    test('Invalid email format is rejected by the browser (native type=email validation)', async ({ page }) => {
      const customer = await loginAndOpenCustomerManagement(page);
      await customer.openCreateForm();
      await customer.fillBasicDetails({ ...validBase(), email: 'not-a-valid-email' });

      const emailInput = page.getByRole('textbox', { name: 'Email Address' });
      const isTypeMismatch = await emailInput.evaluate((el: HTMLInputElement) => el.validity.typeMismatch);
      expect(isTypeMismatch).toBe(true);
    });

    test('Phone Number silently rejects non-numeric keystrokes', async ({ page }) => {
      // Confirmed on the live app: the field's input handler filters non-numeric characters as
      // you type, rather than accepting them and failing pattern validation on submit - typing
      // pure letters leaves the field empty.
      const customer = await loginAndOpenCustomerManagement(page);
      await customer.openCreateForm();
      const phoneInput = page.getByRole('textbox', { name: 'Phone Number' });
      await phoneInput.pressSequentially('abcdefghij');
      await expect(phoneInput).toHaveValue('');
    });

    test('Phone Number enforces a maximum of 10 characters while typing', async ({ page }) => {
      const customer = await loginAndOpenCustomerManagement(page);
      await customer.openCreateForm();
      const phoneInput = page.getByRole('textbox', { name: 'Phone Number' });
      await phoneInput.pressSequentially('123456789012345');
      await expect(phoneInput).toHaveValue('1234567890');
    });

    test('PAN must be exactly 10 characters (minlength/maxlength boundary)', async ({ page }) => {
      const customer = await loginAndOpenCustomerManagement(page);
      await customer.openCreateForm();
      const panInput = page.getByRole('textbox', { name: 'PAN' });
      await panInput.pressSequentially('SHORT12');
      const isTooShort = await panInput.evaluate((el: HTMLInputElement) => el.validity.tooShort);
      expect(isTooShort).toBe(true);
    });

    test('Duplicate phone number is rejected with the real backend error', async ({ page }) => {
      const customer = await loginAndOpenCustomerManagement(page);

      // Create one customer, then immediately try to reuse its exact phone number.
      const first = generateCustomerData(9200);
      await customer.openCreateForm();
      await customer.fillBasicDetails(first);
      await customer.submitAndExpectSuccess();

      const second = { ...generateCustomerData(9201), phone: first.phone };
      await customer.openCreateForm();
      await customer.fillBasicDetails(second);
      await customer.submitAndExpectDuplicatePhoneError();
    });
  });

  test.describe('Bulk creation via configurable loop', () => {
    // CUSTOMER_COUNT comes from CUSTOMER_COUNT in .env - change it there (5 -> 10 -> 20 -> 50)
    // without touching this loop.
    test(`Creates ${CUSTOMER_COUNT} unique customers and verifies each appears in the listing`, async ({ page }) => {
      const customer = await loginAndOpenCustomerManagement(page);

      for (let i = 0; i < CUSTOMER_COUNT; i++) {
        await test.step(`Create customer #${i + 1} of ${CUSTOMER_COUNT}`, async () => {
          const data = generateCustomerData(i);
          try {
            await customer.openCreateForm();
            await customer.fillBasicDetails(data);
            await customer.submitAndExpectSuccess();
            await customer.verifyCustomerInListing(data.customerName);
          } catch (error) {
            throw new Error(
              `Customer creation failed at iteration ${i + 1}/${CUSTOMER_COUNT} ` +
                `(customerName="${data.customerName}", phone="${data.phone}"): ${(error as Error).message}`
            );
          }
        });
      }
    });
  });
});
