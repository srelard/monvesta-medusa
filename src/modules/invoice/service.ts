import { MedusaService } from "@medusajs/framework/utils"
import { Invoice } from "./models/invoice"
import { InvoiceItem } from "./models/invoice-item"
import { InvoiceConfig } from "./models/invoice-config"

class InvoiceModuleService extends MedusaService({
  Invoice,
  InvoiceItem,
  InvoiceConfig,
}) {
  /**
   * Get the next sequential invoice number for the given year.
   * Format: RE-2026-0001 (prefix from config or default "RE")
   */
  async getNextInvoiceNumber(
    prefix: string = "RE"
  ): Promise<{ year: number; display_id: number; invoice_number: string }> {
    const year = new Date().getFullYear()

    const invoices = await this.listInvoices(
      { year },
      { order: { display_id: "DESC" }, take: 1 }
    )

    const nextId = invoices.length > 0 ? invoices[0].display_id + 1 : 1
    const invoice_number = `${prefix}-${year}-${String(nextId).padStart(4, "0")}`

    return { year, display_id: nextId, invoice_number }
  }

  /**
   * Get or create the singleton invoice config with defaults.
   */
  async getOrCreateConfig(): Promise<any> {
    const configs = await this.listInvoiceConfigs({})
    if (configs.length > 0) {
      return configs[0]
    }

    // Create default config with Lorem Ipsum placeholder data
    return await this.createInvoiceConfigs({
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
    })
  }
}

export default InvoiceModuleService
