import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { CustomerPage } from '../pages/CustomerPage';
import { VendorPage } from '../pages/VendorPage';
import { EnquiryPage } from '../pages/EnquiryPage';
import {
  loginData,
  generateCustomerData,
  generateCustomerContact,
  generateBankDetails,
  generateGstDetails,
  generateVendorData,
  generateEnquiryData,
  generateCustomsBrokerEnquiryData,
  generateSeaContainerDgEnquiryData,
  getEnquiryConfig,
  generateConfiguredEnquiryData,
  generateTransportGoodsData,
  generateTransportContainerData,
  EnquiryConfig,
  ENQUIRY_COUNT,
  ENQUIRY_UPLOAD_FILES,
} from '../utils/testData';
import { captureScreenshot } from '../utils/screenshot';

/**
 * Enquiry (CRM -> Sales Management -> Enquiry) is the entry point of the Sales Management
 * pipeline (Enquiry -> Quotation -> Pricing -> Quote Approval -> Confirm Order -> Combined Job ->
 * Contract) and is directly dependent on Customer Management - confirmed live via a real
 * "Customer Id" searchable dropdown wired to actual Customer records, scoped to Approved
 * customers only (a real business rule, confirmed live). Each test creates its own dedicated
 * Customer first (100% reuse of the existing CustomerPage) so Enquiry test data never depends on
 * the shared staging database's pre-existing records.
 *
 * Transport Management System's "Transport" tab is now fully automated too: confirmed live that
 * its Transport-Goods Pickup/Delivery rows are auto-seeded from Cargo (not created via a separate
 * "Add row" button) and must be completed via each row's own Edit icon - see
 * EnquiryPage.fillTransportGoodsRows for the confirmed mechanism.
 */
test.describe.configure({ mode: 'serial' });

/**
 * Creates and approves a dedicated Customer for one Enquiry test, using the SAME complete
 * Basic+Contact+Bank+KYC+Document+Credit flow already proven in customer.spec.ts's own full-form
 * Create test - not just Basic details - so the Customer backing every Enquiry test is genuinely
 * complete, not a minimal stub. Confirmed live: Enquiry's "Customer Id" search only returns
 * Approved customers (a real, intentional business rule - a Pending customer never appears there,
 * no matter how specific the search text is) - so every Enquiry test needs an Approved customer.
 */
async function loginAndCreateApprovedCustomer(page: import('@playwright/test').Page, seed: number) {
  const login = new LoginPage(page);
  await login.goto(loginData.url);
  await login.login(loginData.username, loginData.password, loginData.branch);
  await login.verifyLoginSuccess();

  const customer = new CustomerPage(page);
  await customer.navigateFromSidebar();
  const customerData = generateCustomerData(seed);
  await customer.openCreateForm();
  await customer.fillBasicDetails(customerData);
  await customer.fillContactDetails(generateCustomerContact(seed));
  await customer.fillBankDetails(generateBankDetails(seed));
  await customer.fillKycDetails(generateGstDetails(seed));
  await customer.uploadKycDocument('Aadhar');
  await customer.fillCreditDetails('30', '50000');
  await customer.submitAndExpectSuccess();
  await customer.approveCustomerByName(customerData.customerName);
  await customer.expectApprovalStatus(customerData.customerName, 'Approved');

  return customerData;
}

/**
 * Creates and approves a dedicated Vendor with complete Basic+Contact+Bank+Document+Credit data,
 * reusing 100% of the existing VendorPage (mirrors `loginAndCreateApprovedCustomer`). Used where
 * an Enquiry-derived flow needs a real, freshly-created Approved Vendor (e.g. Quotation
 * Generation's "FF Vendor" selection) instead of an arbitrary pre-existing record.
 */
async function loginAndCreateApprovedVendor(page: import('@playwright/test').Page, seed: number) {
  const login = new LoginPage(page);
  await login.goto(loginData.url);
  await login.login(loginData.username, loginData.password, loginData.branch);
  await login.verifyLoginSuccess();

  const vendor = new VendorPage(page);
  await vendor.navigateFromSidebar();
  const vendorData = generateVendorData(seed);
  await vendor.openCreateForm();
  await vendor.fillBasicDetails(vendorData);
  await vendor.fillContactDetails(generateCustomerContact(seed));
  await vendor.fillBankDetails(generateBankDetails(seed));
  await vendor.uploadKycDocument('Aadhar');
  await vendor.fillCreditDetails('45', '75000');
  await vendor.submitAndExpectSuccess();
  await vendor.approveVendorByName(vendorData.vendorName);
  await vendor.expectApprovalStatus(vendorData.vendorName, 'Approved');

  return vendorData;
}

/** Creates one complete Freight-Forwarding Enquiry (Customer + Product Info + Cargo) for a dedicated seed. Returns the data needed to identify/verify it afterward. */
async function createFreightForwardingEnquiry(
  page: import('@playwright/test').Page,
  enquiry: EnquiryPage,
  seed: number
) {
  const customerData = await loginAndCreateApprovedCustomer(page, seed);
  const enquiryData = generateEnquiryData(seed);

  await enquiry.navigateFromSidebar();
  await enquiry.openCreateForm();
  await enquiry.selectServices(['Freight-Forwarding']);
  await enquiry.fillCustomerInformation(customerData.customerName, enquiryData.sourceOfEnquiry);
  await enquiry.fillFreightForwardingProductInfo(enquiryData);
  await enquiry.addCargoItem(enquiryData.cargo);
  await enquiry.submitAndExpectSuccess();

  return { customerData, enquiryData };
}

test.describe('Enquiry - Create', () => {
  test(`Configurable creation loop: creates ENQUIRY_COUNT (${ENQUIRY_COUNT}) unique Freight-Forwarding Enquiries in a single session`, async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto(loginData.url);
    await login.login(loginData.username, loginData.password, loginData.branch);
    await login.verifyLoginSuccess();

    const customer = new CustomerPage(page);
    const enquiry = new EnquiryPage(page);
    const createdCustomerNames: string[] = [];

    try {
      for (let i = 0; i < ENQUIRY_COUNT; i++) {
        const seed = 9700 + i;
        const customerData = generateCustomerData(seed);
        const enquiryData = generateEnquiryData(seed);

        await customer.navigateFromSidebar();
        await customer.openCreateForm();
        await customer.fillBasicDetails(customerData);
        await customer.submitAndExpectSuccess();
        await customer.approveCustomerByName(customerData.customerName);

        await enquiry.navigateFromSidebar();
        await enquiry.openCreateForm();
        await enquiry.selectServices(['Freight-Forwarding']);
        await enquiry.fillCustomerInformation(customerData.customerName, enquiryData.sourceOfEnquiry);
        await enquiry.fillFreightForwardingProductInfo(enquiryData);
        await enquiry.addCargoItem(enquiryData.cargo);
        await enquiry.submitAndExpectSuccess();
        await enquiry.verifyEnquiryInListing(customerData.customerName, enquiryData.shipmentMode, 'Enquiry Created');
        createdCustomerNames.push(customerData.customerName);
      }
      await captureScreenshot(page, 'enquiry', 'create-loop-success', `count-${ENQUIRY_COUNT}`);
    } catch (error) {
      await captureScreenshot(page, 'enquiry', 'create-loop-failure', `count-${ENQUIRY_COUNT}`);
      throw new Error(`Enquiry creation loop failed after creating [${createdCustomerNames.join(', ')}]: ${(error as Error).message}`);
    }
  });

  test('Create: a complete Freight-Forwarding Enquiry with an uploaded document succeeds and appears in the listing', async ({ page }) => {
    const customerData = await loginAndCreateApprovedCustomer(page, 9710);
    const enquiryData = generateEnquiryData(9710);
    const enquiry = new EnquiryPage(page);

    try {
      await enquiry.navigateFromSidebar();
      await enquiry.verifyListingPageElements();
      await enquiry.openCreateForm();

      await enquiry.selectServices(['Freight-Forwarding']);
      await enquiry.fillCustomerInformation(customerData.customerName, enquiryData.sourceOfEnquiry);
      await enquiry.fillFreightForwardingProductInfo(enquiryData);
      await enquiry.addCargoItem(enquiryData.cargo);
      await enquiry.uploadDocument('AIRWAY BILL', ENQUIRY_UPLOAD_FILES.primary);
      await enquiry.submitAndExpectSuccess();

      await enquiry.verifyEnquiryInListing(customerData.customerName, enquiryData.shipmentMode, 'Enquiry Created');
      await captureScreenshot(page, 'enquiry', 'create-success', customerData.customerName);
    } catch (error) {
      await captureScreenshot(page, 'enquiry', 'create-failure', customerData.customerName);
      throw new Error(`Enquiry creation failed for customer "${customerData.customerName}": ${(error as Error).message}`);
    }
  });

  test('Create: a complete Customs Broker Enquiry succeeds with its own distinct Product Information field set', async ({ page }) => {
    const customerData = await loginAndCreateApprovedCustomer(page, 9720);
    const cbData = generateCustomsBrokerEnquiryData(9720);
    const enquiry = new EnquiryPage(page);

    try {
      await enquiry.navigateFromSidebar();
      await enquiry.openCreateForm();
      await enquiry.selectServices(['Customs Broker']);
      await enquiry.fillCustomerInformation(customerData.customerName, cbData.sourceOfEnquiry);
      await enquiry.fillFreightForwardingProductInfo(cbData);
      await enquiry.addCargoItem(cbData.cargo);
      await enquiry.submitAndExpectSuccess();

      await enquiry.verifyEnquiryInListing(customerData.customerName, cbData.shipmentMode, 'Enquiry Created');
      await captureScreenshot(page, 'enquiry', 'create-success-customs-broker', customerData.customerName);
    } catch (error) {
      await captureScreenshot(page, 'enquiry', 'create-failure-customs-broker', customerData.customerName);
      throw new Error(`Customs Broker Enquiry creation failed for customer "${customerData.customerName}": ${(error as Error).message}`);
    }
  });

  test('Create: a Sea-mode Enquiry with containerized, DG-classified Cargo succeeds (the mode/DG-dependent Cargo fields)', async ({ page }) => {
    const customerData = await loginAndCreateApprovedCustomer(page, 9722);
    const seaData = generateSeaContainerDgEnquiryData(9722);
    const enquiry = new EnquiryPage(page);

    try {
      await enquiry.navigateFromSidebar();
      await enquiry.openCreateForm();
      await enquiry.selectServices(['Freight-Forwarding']);
      await enquiry.fillCustomerInformation(customerData.customerName, seaData.sourceOfEnquiry);
      await enquiry.fillFreightForwardingProductInfo(seaData);
      await enquiry.addCargoItem(seaData.cargo);
      await enquiry.submitAndExpectSuccess();

      await enquiry.verifyEnquiryInListing(customerData.customerName, seaData.shipmentMode, 'Enquiry Created');
      await captureScreenshot(page, 'enquiry', 'create-success-sea-container-dg', customerData.customerName);
    } catch (error) {
      await captureScreenshot(page, 'enquiry', 'create-failure-sea-container-dg', customerData.customerName);
      throw new Error(`Sea-mode containerized/DG Enquiry creation failed for customer "${customerData.customerName}": ${(error as Error).message}`);
    }
  });
});

/**
 * Configuration-driven Enquiry creation: the SAME test logic below adapts to whichever Service
 * combination / Shipment Direction / Shipment Mode / Upload setting `EnquiryConfig` describes -
 * nothing here is hardcoded per combination. The framework supports all 7 real service
 * combinations (each independently togglable) and every Direction x Mode pair, but - per the
 * phase's own instruction - does not execute all of them every run; the two tests below prove the
 * env-driven default and one deliberately different combination both work end to end.
 */
/**
 * Runs ONE complete configured Enquiry Create scenario: navigates to the Enquiry List (the
 * required control point for every new Enquiry - never started from View/Edit), selects exactly
 * the configured services together in that single Enquiry (`ALL` is expanded into real UI service
 * names before this point - `EnquiryPage.selectServices`/`fillVisibleServiceFields` never receive
 * the literal string "ALL"), fills Product Information and Mode-appropriate Cargo, fills Transport
 * rows only when TMS is enabled, uploads only when configured, saves, and verifies. This is the
 * single building block reused by every configuration-driven test below - including the
 * multi-scenario test that runs several of these against the SAME Customer in the SAME session -
 * so the flow itself is defined exactly once (no per-test duplication).
 */
async function createConfiguredEnquiry(
  enquiry: EnquiryPage,
  customerData: { customerName: string },
  config: EnquiryConfig,
  seed: number,
  scenarioLabel: string
) {
  const data = generateConfiguredEnquiryData(seed, config);
  const enabledServices = Object.entries(config.services)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name);

  console.log(
    `Scenario: ${scenarioLabel}\n` +
      `Services:\n${enabledServices.map((s) => `- ${s}`).join('\n') || '- (none)'}\n` +
      `Customer: ${customerData.customerName}\n` +
      `Mode: ${config.shipmentMode}\n` +
      `Direction: ${config.shipmentDirection}\n` +
      `Upload: ${config.upload.enabled ? 'Enabled' : 'Disabled'}`
  );

  try {
    await enquiry.navigateFromSidebar();
    await enquiry.openCreateForm();
    await enquiry.fillCustomerInformation(customerData.customerName, data.sourceOfEnquiry);
    await enquiry.fillVisibleServiceFields(config, data);
    // Confirmed live: Cargo's own field set (Volume In MT vs container fields) is driven by
    // Shipment Mode alone, never by which service(s) are selected - generateConfiguredEnquiryData
    // already branches on config.shipmentMode, so Sea/Air never share cargo data by accident.
    await enquiry.addCargoItem(data.cargo);
    // Confirmed live: the Transport-Goods Pickup/Delivery rows only exist once Cargo is added
    // (they are auto-seeded from it), so this must run after addCargoItem, not inside
    // fillVisibleServiceFields.
    if (config.services.transportManagementSystem) {
      const transportGoodsData = generateTransportGoodsData(seed);
      await enquiry.fillTransportGoodsRows(transportGoodsData.pickup, transportGoodsData.delivery);
      // Confirmed live: Container Pickup/Delivery are additionally checked by default (on top
      // of the Goods rows above) whenever Shipment Mode is Sea/Road/Rail - never Air.
      if (config.shipmentMode !== 'Air') {
        const transportContainerData = generateTransportContainerData(seed);
        await enquiry.fillTransportContainerRows(transportContainerData.pickup, transportContainerData.delivery);
      }
    }
    if (config.upload.enabled) {
      await enquiry.uploadDocument(config.upload.documentType, config.upload.filePath);
    }
    await enquiry.submitAndExpectSuccess();

    await enquiry.verifyEnquiryInListing(customerData.customerName, data.shipmentMode, 'Enquiry Created');
    await captureScreenshot(enquiry.page, 'enquiry', 'configured-create-success', `${scenarioLabel}-${customerData.customerName}`);
  } catch (error) {
    await captureScreenshot(enquiry.page, 'enquiry', 'configured-create-failure', `${scenarioLabel}-${customerData.customerName}`);
    const visibleValidationError = await enquiry.page
      .getByText(/required|must be/i)
      .first()
      .innerText()
      .catch(() => '(none visible)');
    throw new Error(
      `Scenario: ${scenarioLabel}\n` +
        `Services: ${enabledServices.join(', ') || '(none)'}\n` +
        `Customer: ${customerData.customerName}\n` +
        `Shipment Direction: ${config.shipmentDirection}\n` +
        `Shipment Mode: ${config.shipmentMode}\n` +
        `Business Type: ${data.businessType}\n` +
        `Shipment Type: ${data.shipmentType ?? '(not applicable for Air)'}\n` +
        `Upload: ${config.upload.enabled ? 'Enabled' : 'Disabled'}\n` +
        `Current Page: ${enquiry.page.url()}\n` +
        `Validation Error: ${visibleValidationError}\n` +
        `Underlying error: ${(error as Error).message}`
    );
  }
}

test.describe('Enquiry - Configuration-Driven', () => {
  test('Configured (.env defaults): the configured Service/Shipment Direction/Mode/Upload combination creates successfully', async ({ page }) => {
    // Validated before any browser work - an invalid ENQUIRY_SERVICE_CONFIG fails immediately
    // with a clear message rather than after creating a Customer or hitting an unclear locator error.
    const config = getEnquiryConfig();
    const customerData = await loginAndCreateApprovedCustomer(page, 9750);
    const enquiry = new EnquiryPage(page);

    await createConfiguredEnquiry(enquiry, customerData, config, 9750, '.env defaults');
  });

  test('Configured (Customs Broker + Sea + Import, upload disabled): a different configuration drives different fields with no code change', async ({ page }) => {
    const customerData = await loginAndCreateApprovedCustomer(page, 9751);
    const config: EnquiryConfig = {
      services: { freightForwarding: false, customsBroker: true, transportManagementSystem: false },
      shipmentDirection: 'Import',
      shipmentMode: 'Sea',
      upload: { enabled: false, filePath: ENQUIRY_UPLOAD_FILES.primary, documentType: 'AIRWAY BILL' },
    };
    const enquiry = new EnquiryPage(page);

    await createConfiguredEnquiry(enquiry, customerData, config, 9751, 'Customs Broker + Sea + Import');
  });
});

test.describe('Enquiry - Multi-Scenario (Same Customer, Same Session)', () => {
  test('ALL services x Sea/Export, then ALL services x Air/Import - one login, one Customer, one session, each Enquiry started from the Enquiry List', async ({ page }) => {
    // Confirmed requirement: Customer is created exactly ONCE and reused by every scenario below -
    // never re-created per scenario, never a fresh login/logout between them.
    const customerData = await loginAndCreateApprovedCustomer(page, 9752);
    const enquiry = new EnquiryPage(page);

    const allServices: EnquiryConfig['services'] = {
      freightForwarding: true,
      customsBroker: true,
      transportManagementSystem: true,
    };

    const scenarios: Array<{ label: string; config: EnquiryConfig }> = [
      {
        label: 'ALL services / Export / Sea',
        config: {
          services: allServices,
          shipmentDirection: 'Export',
          shipmentMode: 'Sea',
          upload: { enabled: true, filePath: ENQUIRY_UPLOAD_FILES.primary, documentType: 'AIRWAY BILL' },
        },
      },
      {
        label: 'ALL services / Import / Air',
        config: {
          services: allServices,
          shipmentDirection: 'Import',
          shipmentMode: 'Air',
          upload: { enabled: true, filePath: ENQUIRY_UPLOAD_FILES.primary, documentType: 'AIRWAY BILL' },
        },
      },
    ];

    for (let i = 0; i < scenarios.length; i++) {
      const { label, config } = scenarios[i];
      // Each scenario is its own Enquiry: Sea data is never reused for Air and vice versa, since
      // generateConfiguredEnquiryData branches on config.shipmentMode per call.
      await createConfiguredEnquiry(enquiry, customerData, config, 9760 + i, label);
      // Explicit control-point check: every completed Enquiry must return to the Enquiry List
      // before the next scenario starts (createConfiguredEnquiry's submitAndExpectSuccess already
      // lands there, but this asserts it rather than assuming it).
      await expect(enquiry.pageHeading).toBeVisible();
    }
  });
});

test.describe('Enquiry - Validation', () => {
  test('Negative: submitting a completely empty form shows every baseline required-field message', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto(loginData.url);
    await login.login(loginData.username, loginData.password, loginData.branch);
    await login.verifyLoginSuccess();

    const enquiry = new EnquiryPage(page);
    await enquiry.navigateFromSidebar();
    await enquiry.openCreateForm();

    await enquiry.submitAndExpectValidationErrors(
      'At least one service must be selected.',
      'Customer ID is required.',
      'Source of Enquiry is required.'
    );
  });

  test('Negative: selecting Freight-Forwarding without its Product Information fields shows the service-specific required messages', async ({ page }) => {
    const customerData = await loginAndCreateApprovedCustomer(page, 9601);
    const enquiryData = generateEnquiryData(9601);
    const enquiry = new EnquiryPage(page);

    await enquiry.navigateFromSidebar();
    await enquiry.openCreateForm();
    await enquiry.selectServices(['Freight-Forwarding']);
    await enquiry.fillCustomerInformation(customerData.customerName, enquiryData.sourceOfEnquiry);

    await enquiry.submitAndExpectValidationErrors(
      'Shipment Mode is required.',
      'Shipment Direction is required.',
      'Business Type is required.',
      'This field is required for Freight Forwarding.'
    );
  });

  test('Negative: completing Customer and Product Information without adding a Cargo item is rejected', async ({ page }) => {
    const customerData = await loginAndCreateApprovedCustomer(page, 9602);
    const enquiryData = generateEnquiryData(9602);
    const enquiry = new EnquiryPage(page);

    await enquiry.navigateFromSidebar();
    await enquiry.openCreateForm();
    await enquiry.selectServices(['Freight-Forwarding']);
    await enquiry.fillCustomerInformation(customerData.customerName, enquiryData.sourceOfEnquiry);
    await enquiry.fillFreightForwardingProductInfo(enquiryData);

    await enquiry.submitAndExpectValidationErrors('At least one cargo item must be added.');
  });

  test('Cancel: discards the in-progress Create form and returns to the listing without creating an Enquiry', async ({ page }) => {
    const customerData = await loginAndCreateApprovedCustomer(page, 9603);
    const enquiry = new EnquiryPage(page);

    await enquiry.navigateFromSidebar();
    await enquiry.openCreateForm();
    await enquiry.selectServices(['Freight-Forwarding']);
    await enquiry.fillCustomerInformation(customerData.customerName, 'Mail');

    await enquiry.cancelCreateForm();
    await expect(enquiry.getRowByCustomerName(customerData.customerName)).toHaveCount(0);
  });

  test('Negative: selecting Customs Broker without its Product Information fields shows its own required messages', async ({ page }) => {
    const customerData = await loginAndCreateApprovedCustomer(page, 9721);
    const enquiry = new EnquiryPage(page);

    await enquiry.navigateFromSidebar();
    await enquiry.openCreateForm();
    await enquiry.selectServices(['Customs Broker']);
    await enquiry.fillCustomerInformation(customerData.customerName, 'Mail');

    await enquiry.submitAndExpectValidationErrors(
      'Shipment Mode is required.',
      'Shipment Direction is required.',
      'Business Type is required.'
    );
  });

  test('File Upload: the app accepts any file extension - a .txt file uploads successfully (no client-side restriction exists)', async ({ page }) => {
    const customerData = await loginAndCreateApprovedCustomer(page, 9723);
    const enquiry = new EnquiryPage(page);
    await enquiry.navigateFromSidebar();
    await enquiry.openCreateForm();
    await enquiry.selectServices(['Freight-Forwarding']);
    await enquiry.fillCustomerInformation(customerData.customerName, 'Mail');

    // Confirmed live: uploading a plain .txt file succeeds with the real "Document uploaded
    // successfully!" toast and a listed row - there is no file-extension validation to test here,
    // so this documents the real (permissive) behavior rather than inventing a rejection case.
    await enquiry.uploadDocument('AIRWAY BILL', ENQUIRY_UPLOAD_FILES.unsupported);
  });
});

test.describe('Enquiry - Filter & Pagination', () => {
  test('Filter: exact Customer Name filter returns only that record, Reset restores the unfiltered listing', async ({ page }) => {
    const enquiry = new EnquiryPage(page);
    const { customerData } = await createFreightForwardingEnquiry(page, enquiry, 9770);

    await enquiry.navigateFromSidebar();
    await enquiry.openFilterPanel();
    await enquiry.applyFilter({ customerName: customerData.customerName });
    await enquiry.expectFilteredResultCount(1);
    await expect(enquiry.getRowByCustomerName(customerData.customerName)).toBeVisible();

    await enquiry.resetFilter();
  });

  test('Filter: a non-existing Customer Name shows the real no-results message', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto(loginData.url);
    await login.login(loginData.username, loginData.password, loginData.branch);
    await login.verifyLoginSuccess();

    const enquiry = new EnquiryPage(page);
    await enquiry.navigateFromSidebar();
    await enquiry.openFilterPanel();
    await enquiry.applyFilter({ customerName: 'No Such Customer QA XYZ999' });
    await expect(page.getByText('No data matches your filter criteria.', { exact: true })).toBeVisible();
  });

  test('Pagination: Next/Previous navigate between real pages of records', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto(loginData.url);
    await login.login(loginData.username, loginData.password, loginData.branch);
    await login.verifyLoginSuccess();

    const enquiry = new EnquiryPage(page);
    await enquiry.navigateFromSidebar();
    const lastPage = await enquiry.getLastPageNumber();
    expect(lastPage).toBeGreaterThan(1);

    await enquiry.goToNextPage();
    await enquiry.expectCurrentPage(2);
    await enquiry.goToPreviousPage();
    await enquiry.expectCurrentPage(1);
  });
});

test.describe('Enquiry - Edit & Update', () => {
  test('Update: modifies Source of Enquiry, the change is reflected on View afterward', async ({ page }) => {
    const enquiry = new EnquiryPage(page);
    const { customerData, enquiryData } = await createFreightForwardingEnquiry(page, enquiry, 9730);
    const updatedSource = 'Website';

    try {
      await enquiry.navigateFromSidebar();
      await enquiry.editEnquiryByCustomerName(customerData.customerName);
      await enquiry.verifyUpdateFormPrefilled(customerData.customerName, enquiryData);
      await enquiry.fillUpdateSourceOfEnquiry(updatedSource);
      await enquiry.submitUpdateAndExpectSuccess();
      await captureScreenshot(page, 'enquiry', 'update-success', customerData.customerName);

      await enquiry.viewEnquiryByCustomerName(customerData.customerName);
      await enquiry.verifyViewFormFields(customerData.customerName, updatedSource);
      await enquiry.returnToListingFromView();
    } catch (error) {
      await captureScreenshot(page, 'enquiry', 'update-failure', customerData.customerName);
      throw new Error(`Enquiry update failed for customer "${customerData.customerName}": ${(error as Error).message}`);
    }
  });

  test('Update Cancel: an edited Source of Enquiry is discarded and the original value remains', async ({ page }) => {
    const enquiry = new EnquiryPage(page);
    const { customerData, enquiryData } = await createFreightForwardingEnquiry(page, enquiry, 9731);

    await enquiry.navigateFromSidebar();
    await enquiry.editEnquiryByCustomerName(customerData.customerName);
    await enquiry.fillUpdateSourceOfEnquiry('ShouldNotPersist');
    await enquiry.cancelUpdateForm();

    await enquiry.viewEnquiryByCustomerName(customerData.customerName);
    await enquiry.verifyViewFormFields(customerData.customerName, enquiryData.sourceOfEnquiry);
    await enquiry.returnToListingFromView();
  });

  test('Update Negative: clearing Source of Enquiry on Update shows the same required-field message as Create', async ({ page }) => {
    const enquiry = new EnquiryPage(page);
    const { customerData } = await createFreightForwardingEnquiry(page, enquiry, 9732);

    await enquiry.navigateFromSidebar();
    await enquiry.editEnquiryByCustomerName(customerData.customerName);
    await enquiry.fillUpdateSourceOfEnquiry('');
    await enquiry.submitUpdateAndExpectValidationErrors('Source of Enquiry is required.');
  });
});

test.describe('Enquiry - View', () => {
  test('View: displays the record\'s real data read-only, then Back returns to the listing', async ({ page }) => {
    const enquiry = new EnquiryPage(page);
    const { customerData, enquiryData } = await createFreightForwardingEnquiry(page, enquiry, 9740);

    try {
      await enquiry.navigateFromSidebar();
      await enquiry.viewEnquiryByCustomerName(customerData.customerName);
      await enquiry.verifyViewFormFields(customerData.customerName, enquiryData.sourceOfEnquiry);
      await captureScreenshot(page, 'enquiry', 'view', customerData.customerName);

      await enquiry.returnToListingFromView();
      await expect(enquiry.getRowByCustomerName(customerData.customerName)).toBeVisible();
    } catch (error) {
      await captureScreenshot(page, 'enquiry', 'view-failure', customerData.customerName);
      throw new Error(`Enquiry view failed for customer "${customerData.customerName}": ${(error as Error).message}`);
    }
  });
});

test.describe('Enquiry - Initiate Quote', () => {
  test('Initiate Quote: accepting the native confirmation navigates to Quotation Generation and immediately sets the Enquiry to Quote Initiated', async ({ page }) => {
    const enquiry = new EnquiryPage(page);
    const { customerData } = await createFreightForwardingEnquiry(page, enquiry, 9750);

    try {
      await enquiry.navigateFromSidebar();
      await enquiry.initiateQuote(customerData.customerName, true);
      await captureScreenshot(page, 'enquiry', 'initiate-quote-success', customerData.customerName);

      // Confirmed live: the status flip and a real Quote No. both exist immediately after
      // confirming - before any data is entered on the Quotation Generation page itself - so this
      // is a real, already-committed state change, not merely a pending draft.
      await enquiry.navigateFromSidebar();
      await enquiry.expectEnquiryStatus(customerData.customerName, 'Quote Initiated');
      await enquiry.expectEditDisabled(customerData.customerName);
    } catch (error) {
      await captureScreenshot(page, 'enquiry', 'initiate-quote-failure', customerData.customerName);
      throw new Error(`Initiate Quote failed for customer "${customerData.customerName}": ${(error as Error).message}`);
    }
  });

  test('Initiate Quote Cancel: dismissing the native confirmation leaves the Enquiry unchanged', async ({ page }) => {
    const enquiry = new EnquiryPage(page);
    const { customerData } = await createFreightForwardingEnquiry(page, enquiry, 9751);

    await enquiry.navigateFromSidebar();
    await enquiry.initiateQuote(customerData.customerName, false);
    await enquiry.expectEnquiryStatus(customerData.customerName, 'Enquiry Created');
  });
});

test.describe('Enquiry - Complete Lifecycle', () => {
  test('Freight-Forwarding: Create -> Edit -> Update -> View -> Initiate Quote, single browser session throughout', async ({ page }) => {
    const customerData = await loginAndCreateApprovedCustomer(page, 9760);
    const enquiryData = generateEnquiryData(9760);
    const enquiry = new EnquiryPage(page);

    try {
      await enquiry.navigateFromSidebar();
      await enquiry.openCreateForm();
      await enquiry.selectServices(['Freight-Forwarding']);
      await enquiry.fillCustomerInformation(customerData.customerName, enquiryData.sourceOfEnquiry);
      await enquiry.fillFreightForwardingProductInfo(enquiryData);
      await enquiry.addCargoItem(enquiryData.cargo);
      await enquiry.uploadDocument('AIRWAY BILL', ENQUIRY_UPLOAD_FILES.primary);
      await enquiry.submitAndExpectSuccess();
      await enquiry.verifyEnquiryInListing(customerData.customerName, enquiryData.shipmentMode, 'Enquiry Created');

      await enquiry.editEnquiryByCustomerName(customerData.customerName);
      await enquiry.verifyUpdateFormPrefilled(customerData.customerName, enquiryData);
      await enquiry.fillUpdateSourceOfEnquiry('Website');
      // A second Upload File call on the same Document Type: confirmed live there is no dedicated
      // single-slot "replace" affordance - it adds a second row rather than replacing the first.
      await enquiry.uploadDocument('AIRWAY BILL', ENQUIRY_UPLOAD_FILES.replacement);
      await enquiry.submitUpdateAndExpectSuccess();

      await enquiry.viewEnquiryByCustomerName(customerData.customerName);
      await enquiry.verifyViewFormFields(customerData.customerName, 'Website');
      await enquiry.returnToListingFromView();

      // Confirmed live: accepting navigates to the separate Quotation Generation module rather
      // than flipping status in place - completing a quotation there is out of scope for Enquiry
      // Management (see the phase report), so the lifecycle ends at the confirmed navigation.
      await enquiry.initiateQuote(customerData.customerName, true);
      await captureScreenshot(page, 'enquiry', 'lifecycle-success', customerData.customerName);
    } catch (error) {
      await captureScreenshot(page, 'enquiry', 'lifecycle-failure', customerData.customerName);
      throw new Error(`Freight-Forwarding complete lifecycle failed for customer "${customerData.customerName}": ${(error as Error).message}`);
    }
  });
});
  