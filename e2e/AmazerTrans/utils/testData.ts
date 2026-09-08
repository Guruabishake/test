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

function uniqueDigits(prefixDigit: string, seed: number): string {
  const n = (Date.now() + seed * 97) % 1_000_000_000;
  return prefixDigit + n.toString().padStart(9, '0');
}

function generatePan(seed: number): string {
  // PAN field enforces exactly 10 characters (minlength = maxlength = 10 on the live form) and
  // is unique per customer/vendor ("A customer with this PAN number already exists." - confirmed
  // on the live app), so this must stay unique across repeated runs, not just within one run.
  const digits = (Date.now() + seed * 13) % 10000;
  return `QAPAN${String(digits).padStart(4, '0')}X`;
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
