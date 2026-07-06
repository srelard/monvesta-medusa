/**
 * Fallback company data used when no invoice_config row exists yet.
 * Single source of truth — used by the module service (getOrCreateConfig)
 * and by the generate-invoice workflow as a defensive fallback.
 */
export const DEFAULT_INVOICE_CONFIG = {
  company_name: "Monvesta GmbH",
  company_address: "Musterstraße 1",
  company_city: "Berlin",
  company_postal_code: "10115",
  company_country: "Deutschland",
  company_email: "info@monvesta.de",
  company_phone: "+49 30 12345678",
  company_vat_id: "DE123456789",
  company_registration: "HRB 12345 B",
  managing_director: "Max Mustermann",
  bank_name: "Deutsche Bank",
  bank_iban: "DE89 3704 0044 0532 0130 00",
  bank_bic: "COBADEFFXXX",
  invoice_prefix: "RE",
  default_tax_rate: 19,
  footer_text:
    "Vielen Dank für Ihr Vertrauen. Diese Rechnung wurde elektronisch erstellt und ist ohne Unterschrift gültig.",
}
