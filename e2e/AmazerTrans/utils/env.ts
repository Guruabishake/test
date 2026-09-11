import * as dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.example to .env and fill it in.`
    );
  }
  return value;
}

export const env = {
  baseUrl: process.env.AMAZERTRANS_URL || 'https://staging-fc.cargowayz.net/login/AMAZERTRANS',
  username: required('AMAZERTRANS_USERNAME'),
  password: required('AMAZERTRANS_PASSWORD'),
  branch: process.env.AMAZERTRANS_BRANCH || 'Bengaluru Tech Hub',
  customerCount: Number(process.env.CUSTOMER_COUNT) || 1,
  vendorCount: Number(process.env.VENDOR_COUNT) || 1,
  quotationOriginCount: Number(process.env.QUOTATION_ORIGIN_COUNT) || 5,
  quotationInternationalCount: Number(process.env.QUOTATION_INTERNATIONAL_COUNT) || 5,
  quotationDestinationCount: Number(process.env.QUOTATION_DESTINATION_COUNT) || 5,
  quotationUploadEnabled: process.env.QUOTATION_UPLOAD_ENABLED !== 'false',
  // Comma-separated filenames (resolved against e2e/new_folder/assets) or absolute paths.
  // Defaults to the two existing sample assets in testData.ts when unset.
  quotationUploadFiles: process.env.QUOTATION_UPLOAD_FILES || '',
};
