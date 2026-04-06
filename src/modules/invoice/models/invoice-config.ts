import { model } from "@medusajs/framework/utils"

export const InvoiceConfig = model.define("invoice_config", {
  id: model.id().primaryKey(),
  // Company
  company_name: model.text(),
  company_address: model.text(),
  company_city: model.text(),
  company_postal_code: model.text(),
  company_country: model.text().default("Deutschland"),
  company_email: model.text(),
  company_phone: model.text().nullable(),
  company_vat_id: model.text(),
  company_registration: model.text().nullable(),
  managing_director: model.text(),
  // Bank
  bank_name: model.text(),
  bank_iban: model.text(),
  bank_bic: model.text(),
  // Settings
  logo_url: model.text().nullable(),
  invoice_prefix: model.text().default("RE"),
  default_tax_rate: model.float().default(19),
  footer_text: model.text().nullable(),
})

export default InvoiceConfig
