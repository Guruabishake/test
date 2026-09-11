import * as path from 'path';
import { env } from './env';

export const loginData = {
  url: env.baseUrl,
  username: env.username,
  password: env.password,
  branch: env.branch,
};

/**
 * How many Customer / Vendor records the bulk-creation loops create.
 * Controlled entirely via CUSTOMER_COUNT / VENDOR_COUNT in .env - change
 * 5 -> 10 -> 20 -> 50 there, no test code changes required.
 */
export const CUSTOMER_COUNT = env.customerCount;
export const VENDOR_COUNT = env.vendorCount;

/**
 * Configurable Enquiry "Upload File" test assets. Change these three paths to point at different
 * files without touching EnquiryPage.ts or enquiry.spec.ts - both only ever read from here.
 * `primary`/`replacement` are real accepted files (confirmed live: the app accepts .png); `unsupported`
 * is a deliberately non-document extension for the negative file-type test.
 */
export const ENQUIRY_UPLOAD_FILES = {
  primary: path.resolve(process.cwd(), 'e2e', 'new_folder', 'assets', 'sample.png'),
  replacement: path.resolve(process.cwd(), 'e2e', 'new_folder', 'assets', 'sample2.png'),
  unsupported: path.resolve(process.cwd(), 'e2e', 'new_folder', 'assets', 'unsupported.txt'),
};

function uniqueDigits(prefixDigit: string, seed: number): string {
  const n = (Date.now() + seed * 97) % 1_000_000_000;
  return prefixDigit + n.toString().padStart(9, '0');
}

function generatePan(seed: number): string {
  // PAN field enforces exactly 10 characters (minlength = maxlength = 10 on the live form) and
  // is unique per customer/vendor ("A customer with this PAN number already exists." - confirmed
  // on the live app). The original 4-digit scheme (1 part in 10,000) collided in practice after
  // enough repeated runs accumulated against this shared, persistent staging database - widened
  // to 7 digits (1 part in 10,000,000) so a real collision is no longer realistically reachable.
  const digits = (Date.now() * 1000 + seed) % 10_000_000;
  return `QA${String(digits).padStart(7, '0')}X`;
}

export interface CustomerData {
  customerName: string;
  customerType: 'Domestic' | 'Foreign';
  subType: 'Regular' | 'SEZ';
  gstApplicable: 'Yes' | 'No';
  address1: string;
  address2?: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  pan: string;
}

export interface CustomerContact {
  firstName: string;
  lastName: string;
  designation: string;
  phone: string;
  email: string;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountType: string;
  ifsc: string;
  branchName: string;
}

export interface GstDetails {
  state: string;
  gstNo: string;
  branchName: string;
  branchAddress: string;
  pincode: string;
}

/** Generates a unique Customer record for bulk/data-driven creation. Iteration index drives uniqueness. */
export function generateCustomerData(seed: number): CustomerData {
  return {
    customerName: `QA Automation Customer ${seed}-${Date.now().toString().slice(-5)}`,
    customerType: 'Domestic',
    subType: 'Regular',
    gstApplicable: 'Yes',
    address1: `${100 + seed} South Street`,
    address2: `Block ${seed}`,
    city: 'Tirunelveli',
    state: 'Tamil Nadu',
    phone: uniqueDigits('9', seed),
    email: `qa.customer.${seed}.${Date.now()}@example.com`,
    pan: generatePan(seed),
  };
}

export function generateCustomerContact(seed: number): CustomerContact {
  return {
    firstName: `Contact${seed}`,
    lastName: 'Automation',
    designation: 'Manager',
    phone: uniqueDigits('7', seed),
    email: `qa.contact.${seed}.${Date.now()}@example.com`,
  };
}

export function generateBankDetails(seed: number): BankDetails {
  return {
    bankName: 'IOB',
    accountNumber: `${9000000000 + seed}`,
    accountType: 'Savings Account',
    ifsc: `IFSC0${String(seed).padStart(4, '0')}`,
    branchName: 'Mumbai',
  };
}

export function generateGstDetails(seed: number): GstDetails {
  return {
    state: 'Tamil Nadu',
    gstNo: `33GSTAUTO${seed}Z`,
    branchName: 'Mumbai',
    branchAddress: 'Mumbai HQ',
    pincode: '600001',
  };
}

export interface VendorData {
  vendorName: string;
  vendorType: 'Domestic' | 'Foreign';
  categoryType: 'Liner' | 'CFS' | 'Transport' | 'Others';
  subType: 'Regular' | 'SEZ';
  address1: string;
  address2?: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  pan: string;
}

/** Generates a unique Vendor record for bulk/data-driven creation. Iteration index drives uniqueness. */
export function generateVendorData(seed: number): VendorData {
  return {
    vendorName: `QA Automation Vendor ${seed}-${Date.now().toString().slice(-5)}`,
    vendorType: 'Domestic',
    categoryType: 'Transport',
    subType: 'Regular',
    address1: `${200 + seed} North Bypass`,
    address2: `Block ${seed}`,
    city: 'Madurai',
    state: 'Tamil Nadu',
    phone: uniqueDigits('8', seed),
    email: `qa.vendor.${seed}.${Date.now()}@example.com`,
    pan: generatePan(seed + 5000),
  };
}

export interface CargoItemData {
  noOfPackages: string;
  cargoName: string;
  grossWt: string;
  netWt: string;
  uom: string;
  commodity: string;
  kindOfPackages: string;
  dgNonDg: 'DG' | 'Non DG';
  /**
   * Confirmed live: the Cargo popup's field set is driven by Shipment Mode, not Direction as
   * first assumed - Air renders a single "Volume In MT" field instead of any container fields;
   * every other mode (Sea/Road/Rail) renders No of Containers/Size Of Container/Type Of
   * Container/CBM instead. Set exactly one side for a given EnquiryData.shipmentMode:
   * `volumeInMt` for Air, the four container fields otherwise.
   */
  volumeInMt?: string;
  noOfContainers?: string;
  containerSize?: '20' | '40' | '45';
  containerType?: 'FR' | 'GP' | 'OT' | 'RF' | 'TK';
  cbm?: string;
  /**
   * Confirmed live: selecting DG on DG/Non-DG reveals 5 additional plain-text fields (IMO No, IM
   * DG No, IMO Class, UN No, Technical Name) - absent entirely for Non DG. Only meaningful when
   * `dgNonDg === 'DG'`.
   */
  imoNo?: string;
  imDgNo?: string;
  imoClass?: string;
  unNo?: string;
  technicalName?: string;
}

export interface EnquiryData {
  sourceOfEnquiry: string;
  shipmentMode: 'Air' | 'Sea';
  shipmentDirection: 'Export' | 'Import' | 'CROSS TRADE';
  businessType: 'Generated' | 'Nominated';
  destinationClearanceBy: 'AMAZERTRANS' | 'Vendor' | 'Customer';
  destinationClearanceLocation: string;
  /** Confirmed live: required for Sea (at least) - "Shipment Type is required." - unlike Air, where it's optional. */
  shipmentType?: 'FCL' | 'LCL' | 'Bulk';
  cargo: CargoItemData;
}

export type EnquiryServiceCombination = 'FF_CB' | 'CB_TMS' | 'FF_TMS' | 'FF_CB_TMS';

export interface EnquiryServiceSelection {
  freightForwarding: boolean;
  customsBroker: boolean;
  transportManagementSystem: boolean;
}

export interface EnquiryScenario {
  name: string;
  combination: EnquiryServiceCombination;
  services: EnquiryServiceSelection;
  shipmentDirection: 'Export' | 'Import' | 'CROSS TRADE';
  shipmentMode: 'Air' | 'Sea';
}

/**
 * The exactly-4 required Service combinations for Enquiry - no single-service Enquiry and no
 * other combination is created anywhere in this spec. Air and Sea are the only Shipment Modes
 * exercised (Road/Rail are out of scope). Each combination also gets its own Shipment
 * Direction/Mode pairing so every scenario exercises genuinely different data, not just a
 * different service list.
 */
export const ENQUIRY_SCENARIOS: EnquiryScenario[] = [
  {
    name: 'FF + CB',
    combination: 'FF_CB',
    services: { freightForwarding: true, customsBroker: true, transportManagementSystem: false },
    shipmentDirection: 'Export',
    shipmentMode: 'Sea',
  },
  {
    name: 'CB + TMS',
    combination: 'CB_TMS',
    services: { freightForwarding: false, customsBroker: true, transportManagementSystem: true },
    shipmentDirection: 'Import',
    shipmentMode: 'Air',
  },
  {
    name: 'FF + TMS',
    combination: 'FF_TMS',
    services: { freightForwarding: true, customsBroker: false, transportManagementSystem: true },
    shipmentDirection: 'Export',
    shipmentMode: 'Air',
  },
  {
    name: 'FF + CB + TMS',
    combination: 'FF_CB_TMS',
    services: { freightForwarding: true, customsBroker: true, transportManagementSystem: true },
    shipmentDirection: 'Import',
    shipmentMode: 'Sea',
  },
];

/**
 * Generates a unique Enquiry for one `EnquiryScenario` - the combination-driven counterpart to
 * `generateEnquiryData`. Confirmed live: Shipment Type is required for every mode except Air, and
 * Cargo's field set is driven by Shipment Mode alone (Air -> Volume In MT, Sea -> container
 * fields + CBM) - the same real rules already confirmed for the plain generator below.
 */
export function generateEnquiryScenarioData(seed: number, scenario: Pick<EnquiryScenario, 'shipmentDirection' | 'shipmentMode'>): EnquiryData {
  const isAir = scenario.shipmentMode === 'Air';
  return {
    sourceOfEnquiry: 'Mail',
    shipmentMode: scenario.shipmentMode,
    shipmentDirection: scenario.shipmentDirection,
    businessType: 'Generated',
    destinationClearanceBy: 'AMAZERTRANS',
    destinationClearanceLocation: `Chennai Port ${seed}`,
    shipmentType: isAir ? undefined : 'FCL',
    cargo: {
      noOfPackages: '10',
      cargoName: `QA Automation Cargo ${seed}`,
      grossWt: '100',
      netWt: '90',
      uom: 'KGS',
      commodity: 'General Cargo',
      kindOfPackages: 'Boxes',
      dgNonDg: 'Non DG',
      ...(isAir
        ? { volumeInMt: '2.5' }
        : { noOfContainers: '1', containerSize: '20' as const, containerType: 'GP' as const, cbm: '10' }),
    },
  };
}

export interface TransportGoodsLegData {
  location: string;
  address: string;
  date: string;
}

/**
 * Generates the Pickup and Delivery leg data for Transport Management System's auto-seeded
 * Transport-Goods rows (see EnquiryPage.fillTransportGoodsRows). `date` is in the native
 * YYYY-MM-DD format the Est Date input requires. Confirmed live: "Transport Goods Pickup" and
 * "Transport Goods Delivery" are checked by default whenever TMS is selected, for every Shipment
 * Mode - so this data is always needed when TMS is enabled, regardless of mode.
 */
export function generateTransportGoodsData(seed: number): { pickup: TransportGoodsLegData; delivery: TransportGoodsLegData } {
  return {
    pickup: {
      location: `Chennai Warehouse ${seed}`,
      address: `Plot ${seed}, Industrial Estate, Chennai`,
      date: '2026-09-20',
    },
    delivery: {
      location: `Mumbai Port ${seed}`,
      address: `Dock ${seed}, Mumbai Port Trust`,
      date: '2026-09-22',
    },
  };
}

export interface TransportContainerPickupData {
  location: string;
  address: string;
  stuffing: 'Factory' | 'CFS' | 'ICD' | 'SEZ';
  stuffingLocation: string;
  date: string;
}

export interface TransportContainerDeliveryData {
  location: string;
  address: string;
  date: string;
}

/**
 * Generates the Pickup and Delivery leg data for Transport Management System's auto-seeded
 * Transport-Container rows (see EnquiryPage.fillTransportContainerRows). Confirmed live:
 * "Transport Container Pickup"/"Transport Container Delivery" are checked by default only for
 * Sea/Road/Rail (never Air) - the same real Shipment-Mode-driven rule already confirmed for
 * Cargo's own container fields, so this is only needed when `shipmentMode !== 'Air'`.
 */
export function generateTransportContainerData(seed: number): { pickup: TransportContainerPickupData; delivery: TransportContainerDeliveryData } {
  return {
    pickup: {
      location: `Chennai Factory ${seed}`,
      address: `Plot ${seed}, SIPCOT, Chennai`,
      stuffing: 'Factory',
      stuffingLocation: `Chennai CFS Yard ${seed}`,
      date: '2026-09-21',
    },
    delivery: {
      location: `Mumbai Port Terminal ${seed}`,
      address: `Berth ${seed}, JNPT, Mumbai`,
      date: '2026-09-23',
    },
  };
}

/**
 * Generates a unique Enquiry (Freight-Forwarding service only - the one scope automated so far;
 * Customs Broker/Transport Management System have their own distinct required-field sets,
 * confirmed live but not yet automated). No uniqueness constraint was found on any of these
 * fields on the live app, so the seed is only used for traceability, not collision avoidance.
 */
export function generateEnquiryData(seed: number): EnquiryData {
  return {
    sourceOfEnquiry: 'Mail',
    shipmentMode: 'Air',
    shipmentDirection: 'Export',
    businessType: 'Generated',
    destinationClearanceBy: 'AMAZERTRANS',
    destinationClearanceLocation: `Chennai Port ${seed}`,
    cargo: {
      noOfPackages: '10',
      cargoName: `QA Automation Cargo ${seed}`,
      grossWt: '100',
      netWt: '90',
      uom: 'KGS',
      commodity: 'General Cargo',
      kindOfPackages: 'Boxes',
      dgNonDg: 'Non DG',
      // Confirmed live: Shipment Mode 'Air' renders "Volume In MT" instead of any container field.
      volumeInMt: '2.5',
    },
  };
}

export interface QuotationChargeData {
  chargeDescription: string;
  quantity: string;
  buyRate: string;
  buyCurrency: string;
}

/**
 * Charge Description options confirmed live (via the real master list rendered in the Add
 * Origin/International/Destination popup) to be tagged "(CB,FF,TMS)" - i.e. valid regardless of
 * which of the 4 required Service combinations (FF+CB, CB+TMS, FF+TMS, FF+CB+TMS) the Quotation's
 * originating Enquiry used. Six distinct entries, one more than the default 5-per-section count,
 * so `generateBuyRateEntries` never has to repeat a Charge Description within one section.
 */
const SAFE_CHARGE_DESCRIPTIONS = [
  'Base Charge - Direct Expenses (CB,FF,TMS)',
  'BL FEE - Direct Expenses (CB,FF,TMS)',
  'Container Freight Security Surcharge - Direct Expenses (CB,FF,TMS)',
  'Customs Clearance & Documentation Fee - Direct Expenses (CB,TMS,FF)',
  'branchwise2 - Direct Expenses (CRM,CB,FF,TMS,WMS,Finance Accounts,Others)',
  'branchwise charge - Direct Expenses (CRM,CB,FF,TMS,Finance Accounts,WMS,Others)',
];

/**
 * Generates `count` distinct Buy Rate charge rows for one Quotation section (Origin/International/
 * Destination). Confirmed live: selecting `chargeDescription` auto-fills HS Code and Charge Based
 * On, and Value In INR = Buy Rate x Quantity x Exchange Rate (Exchange Rate itself auto-filled once
 * `buyCurrency` is chosen) - none of those three are set here, only the fields the popup actually
 * requires input for. Every entry deliberately shares one `buyCurrency` (defaults to the confirmed
 * real option "Pound") so the Summary tab's per-currency aggregation collapses to a single, exactly
 * verifiable total instead of needing to track several currencies/exchange rates at once.
 */
export function generateBuyRateEntries(seed: number, count: number, buyCurrency: string = 'Pound'): QuotationChargeData[] {
  return Array.from({ length: count }, (_, i) => ({
    chargeDescription: SAFE_CHARGE_DESCRIPTIONS[i % SAFE_CHARGE_DESCRIPTIONS.length],
    quantity: String(2 + ((seed + i) % 5)),
    buyRate: String(50 + seed + i * 7),
    buyCurrency,
  }));
}

/**
 * Configurable Quotation "Upload File" assets - QUOTATION_UPLOAD_FILES in .env accepts a
 * comma-separated list of 2-3 filenames (resolved against the existing e2e/new_folder/assets
 * directory, same as ENQUIRY_UPLOAD_FILES) or absolute paths, with no test-code change required.
 * Defaults to the two existing real sample assets when unset.
 */
export const QUOTATION_UPLOAD_ENABLED = env.quotationUploadEnabled;
export const QUOTATION_UPLOAD_FILES: string[] = (
  env.quotationUploadFiles
    ? env.quotationUploadFiles.split(',').map((f) => f.trim()).filter((f) => f.length > 0)
    : ['sample.png', 'sample2.png']
).map((f) => (path.isAbsolute(f) ? f : path.resolve(process.cwd(), 'e2e', 'new_folder', 'assets', f)));

/**
 * How many entries the Quotation test creates per section via the real Add Origin/International/
 * Destination popup - QUOTATION_ORIGIN_COUNT/QUOTATION_INTERNATIONAL_COUNT/QUOTATION_DESTINATION_COUNT
 * in .env, defaulting to 5 each.
 */
export const QUOTATION_ORIGIN_COUNT = env.quotationOriginCount;
export const QUOTATION_INTERNATIONAL_COUNT = env.quotationInternationalCount;
export const QUOTATION_DESTINATION_COUNT = env.quotationDestinationCount;

export interface QuotationData {
  origin: QuotationChargeData[];
  international: QuotationChargeData[];
  destination: QuotationChargeData[];
  uploadFiles: string[];
}

/**
 * Generates the complete Buy Rate data set for one Quotation - Origin/International/Destination
 * entries (counts configurable via .env, default 5 each) plus the configured upload files. Distinct
 * offsets per section (seed/seed+1000/seed+2000) keep Origin, International and Destination from
 * ever generating identical rows for the same base seed.
 */
export function generateQuotationData(seed: number): QuotationData {
  return {
    origin: generateBuyRateEntries(seed, QUOTATION_ORIGIN_COUNT),
    international: generateBuyRateEntries(seed + 1000, QUOTATION_INTERNATIONAL_COUNT),
    destination: generateBuyRateEntries(seed + 2000, QUOTATION_DESTINATION_COUNT),
    uploadFiles: QUOTATION_UPLOAD_FILES,
  };
}
