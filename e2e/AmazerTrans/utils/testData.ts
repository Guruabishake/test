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
export const ENQUIRY_COUNT = env.enquiryCount;
export const QUOTATION_COUNT = env.quotationCount;

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
  shipmentMode: 'Air' | 'Sea' | 'Road' | 'Rail';
  shipmentDirection: 'Export' | 'Import' | 'CROSS TRADE';
  businessType: 'Generated' | 'Nominated';
  destinationClearanceBy: 'AMAZERTRANS' | 'Vendor' | 'Customer';
  destinationClearanceLocation: string;
  /** Confirmed live: required for Sea (at least) - "Shipment Type is required." - unlike Air, where it's optional. */
  shipmentType?: 'FCL' | 'LCL' | 'Bulk';
  cargo: CargoItemData;
}

export interface EnquiryConfig {
  services: {
    freightForwarding: boolean;
    customsBroker: boolean;
    transportManagementSystem: boolean;
  };
  shipmentDirection: 'Export' | 'Import' | 'CROSS TRADE';
  shipmentMode: 'Air' | 'Sea' | 'Road' | 'Rail';
  upload: {
    enabled: boolean;
    filePath: string;
    documentType: string;
  };
}

const SUPPORTED_SERVICE_TOKENS = ['ALL', 'FREIGHT_FORWARDING', 'CUSTOMS_BROKER', 'TRANSPORT_MANAGEMENT_SYSTEM'] as const;

/**
 * Parses the user-friendly `ENQUIRY_SERVICE_CONFIG` value into the three independent service
 * flags. Accepts "ALL", any single token, or a comma-separated combination (e.g.
 * "FREIGHT_FORWARDING,CUSTOMS_BROKER"). Fails fast with a clear, actionable message on an
 * unsupported value - never lets an invalid config reach the Page Object as an unclear locator
 * error later.
 */
function parseEnquiryServiceConfig(rawValue: string): EnquiryConfig['services'] {
  const tokens = rawValue
    .split(',')
    .map((t) => t.trim().toUpperCase())
    .filter((t) => t.length > 0);

  const invalid = tokens.filter((t) => !(SUPPORTED_SERVICE_TOKENS as readonly string[]).includes(t));
  if (invalid.length > 0 || tokens.length === 0) {
    throw new Error(
      `Invalid ENQUIRY_SERVICE_CONFIG value:\n"${rawValue}"\n\n` +
        `Supported values:\n` +
        `ALL\n` +
        `FREIGHT_FORWARDING\n` +
        `CUSTOMS_BROKER\n` +
        `TRANSPORT_MANAGEMENT_SYSTEM\n` +
        `(or a comma-separated combination, e.g. "FREIGHT_FORWARDING,CUSTOMS_BROKER")`
    );
  }

  const all = tokens.includes('ALL');
  return {
    freightForwarding: all || tokens.includes('FREIGHT_FORWARDING'),
    customsBroker: all || tokens.includes('CUSTOMS_BROKER'),
    transportManagementSystem: all || tokens.includes('TRANSPORT_MANAGEMENT_SYSTEM'),
  };
}

/**
 * Central, environment-driven Enquiry configuration - the single place a tester changes Service
 * selection, Shipment Direction/Mode, and upload behavior, with no Page Object or spec code
 * change required. Edit these in `.env`:
 *
 *   ENQUIRY_SERVICE_CONFIG   "ALL" | "FREIGHT_FORWARDING" | "CUSTOMS_BROKER" |
 *                            "TRANSPORT_MANAGEMENT_SYSTEM" | a comma-separated combination
 *   SHIPMENT_DIRECTION       "Export" | "Import" | "CROSS TRADE"
 *   SHIPMENT_MODE            "Air" | "Sea" | "Road" | "Rail"
 *   ENQUIRY_UPLOAD_ENABLED   "true" | "false"
 *   ENQUIRY_UPLOAD_FILE      path to the file to upload (defaults to the existing sample asset)
 *   ENQUIRY_DOCUMENT_TYPE    the Document Type to select for the upload
 *
 * Defaults reproduce the original Freight-Forwarding/Air/Export/upload-enabled behavior exactly.
 */
export function getEnquiryConfig(): EnquiryConfig {
  return {
    services: parseEnquiryServiceConfig(env.enquiryServiceConfig),
    shipmentDirection: env.shipmentDirection as EnquiryConfig['shipmentDirection'],
    shipmentMode: env.shipmentMode as EnquiryConfig['shipmentMode'],
    upload: {
      enabled: env.enquiryUploadEnabled,
      filePath: env.enquiryUploadFile || ENQUIRY_UPLOAD_FILES.primary,
      documentType: env.enquiryDocumentType,
    },
  };
}

/**
 * Generates a unique Enquiry from an `EnquiryConfig` - the config-driven counterpart to
 * `generateEnquiryData`. Confirmed live: Shipment Type is required for every mode except Air
 * (confirmed for Sea; applied the same way for Road/Rail as the only reasonable generalization,
 * since the field itself is identical and always optional-or-required by mode, never by direction)
 * and left unset for Air, where it's optional. Cargo mirrors the same real Mode-driven shape
 * already confirmed for the plain generators: Air -> Volume In MT, every other mode -> container
 * fields + CBM.
 */
export function generateConfiguredEnquiryData(seed: number, config: EnquiryConfig): EnquiryData {
  const isAir = config.shipmentMode === 'Air';
  return {
    sourceOfEnquiry: 'Mail',
    shipmentMode: config.shipmentMode,
    shipmentDirection: config.shipmentDirection,
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

/**
 * Generates a unique Sea-mode Freight-Forwarding Enquiry whose Cargo is both containerized and
 * DG-classified - confirmed live to be the two real dependent-field scenarios the plain Air/Non DG
 * default above never exercises: Shipment Mode 'Sea' swaps the Cargo popup's "Volume In MT" field
 * for No of Containers/Size Of Container/Type Of Container/CBM, and DG/Non-DG = 'DG' reveals IMO
 * No/IM DG No/IMO Class/UN No/Technical Name (absent entirely for Non DG).
 */
export function generateSeaContainerDgEnquiryData(seed: number): EnquiryData {
  return {
    sourceOfEnquiry: 'Mail',
    shipmentMode: 'Sea',
    shipmentDirection: 'Import',
    businessType: 'Generated',
    destinationClearanceBy: 'AMAZERTRANS',
    destinationClearanceLocation: `Chennai Port Sea ${seed}`,
    // Confirmed live: required for Sea specifically (absent from Air's required set).
    shipmentType: 'FCL',
    cargo: {
      noOfPackages: '3',
      cargoName: `QA Automation Sea Cargo ${seed}`,
      grossWt: '5000',
      netWt: '4800',
      uom: 'MT',
      commodity: 'Chemicals',
      kindOfPackages: 'Drums',
      dgNonDg: 'DG',
      noOfContainers: '1',
      containerSize: '20',
      containerType: 'GP',
      cbm: '28',
      imoNo: `IMO-${seed}`,
      imDgNo: `IMDG-${seed}`,
      imoClass: '3',
      unNo: `UN${1000 + seed}`,
      technicalName: 'Flammable Liquid, N.O.S.',
    },
  };
}

/**
 * Generates a unique Enquiry for the Customs Broker service. Confirmed live: Customs Broker's
 * Product Information tab renders a smaller field set than Freight-Forwarding/Transport
 * Management System (no Service field) - but the Customs Clearance requirement itself (at least
 * one of the Origin or Destination Clearance By/Location pairs) is NOT Freight-Forwarding-specific
 * as first assumed from static inspection - a real Create attempt confirmed it is enforced for
 * Customs Broker too, via the same "Please enter either Origin or Destination Clearance By/
 * Location" messages, so `destinationClearanceBy`/`Location` are filled here exactly as for
 * Freight-Forwarding (`EnquiryPage.fillFreightForwardingProductInfo` is reused for both).
 */
export function generateCustomsBrokerEnquiryData(seed: number): EnquiryData {
  return {
    sourceOfEnquiry: 'Mail',
    // Air (not Sea) deliberately: confirmed live that Sea's Cargo popup silently blocks Save
    // without a visible Container Size/Type dropdown value (their real option lists were not
    // confirmed this phase), so Air is used here to avoid that dependency entirely.
    shipmentMode: 'Air',
    shipmentDirection: 'Import',
    businessType: 'Nominated',
    destinationClearanceBy: 'AMAZERTRANS',
    destinationClearanceLocation: `Chennai Port CB ${seed}`,
    cargo: {
      noOfPackages: '5',
      cargoName: `QA Automation CB Cargo ${seed}`,
      grossWt: '200',
      netWt: '180',
      uom: 'KGS',
      commodity: 'General Cargo',
      kindOfPackages: 'Pallets',
      dgNonDg: 'Non DG',
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
 * Generates one Buy Rate charge row for Quotation Generation's Origin/International/Destination
 * sub-tabs. Confirmed live: selecting `chargeDescription` auto-fills HS Code and Charge Based On
 * (not set here - the app owns those values), and Value In INR is auto-calculated as
 * `Buy Rate x Quantity x Exchange Rate` (verified live by changing Quantity and observing the
 * total recalculate) - Exchange Rate itself is auto-filled once `buyCurrency` is selected and is
 * not set here either. "Base Charge - Direct Expenses (CB,FF,TMS)" is a real, generic Charge
 * Description confirmed to exist for every service, so it's the safe default across scenarios.
 */
export function generateQuotationChargeData(seed: number): QuotationChargeData {
  return {
    chargeDescription: 'Base Charge - Direct Expenses (CB,FF,TMS)',
    quantity: String(2 + (seed % 5)),
    buyRate: String(50 + seed),
    buyCurrency: 'Pound',
  };
}
