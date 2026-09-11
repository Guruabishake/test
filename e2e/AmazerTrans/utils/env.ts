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
  enquiryCount: Number(process.env.ENQUIRY_COUNT) || 1,
  quotationCount: Number(process.env.QUOTATION_COUNT) || 1,
  // User-friendly single value: "ALL", one of FREIGHT_FORWARDING/CUSTOMS_BROKER/
  // TRANSPORT_MANAGEMENT_SYSTEM, or a comma-separated combination of those three, e.g.
  // "FREIGHT_FORWARDING,CUSTOMS_BROKER". Validated (with a clear error on an unsupported value)
  // in testData.ts's getEnquiryConfig(), the single place that turns this into automation
  // behavior. Defaults to "FREIGHT_FORWARDING" to preserve the original behavior when unset.
  enquiryServiceConfig: process.env.ENQUIRY_SERVICE_CONFIG || 'ALL',
  shipmentDirection: process.env.SHIPMENT_DIRECTION || 'Export',
  shipmentMode: process.env.SHIPMENT_MODE || 'Sea',
  enquiryUploadEnabled: process.env.ENQUIRY_UPLOAD_ENABLED !== 'false',
  enquiryUploadFile: process.env.ENQUIRY_UPLOAD_FILE || '',
  enquiryDocumentType: process.env.ENQUIRY_DOCUMENT_TYPE || 'AIRWAY BILL',
};
