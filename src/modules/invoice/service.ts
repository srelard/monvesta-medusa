import { MedusaService } from "@medusajs/framework/utils"
import { Invoice } from "./models/invoice"
import { InvoiceItem } from "./models/invoice-item"
import { InvoiceConfig } from "./models/invoice-config"
import { DEFAULT_INVOICE_CONFIG } from "./constants"

const MAX_NUMBERING_ATTEMPTS = 5

function isUniqueViolation(error: any): boolean {
  return (
    error?.code === "23505" ||
    error?.name === "UniqueConstraintViolationException" ||
    /unique/i.test(error?.message ?? "")
  )
}

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
   * Create an invoice with the next sequential number.
   *
   * Numbering is read-then-insert, so two concurrent order placements can
   * compute the same display_id. The (year, display_id) unique index rejects
   * the loser; we retry with a fresh number instead of failing the workflow.
   */
  async createInvoiceWithNextNumber(
    prefix: string,
    data: Record<string, unknown>
  ) {
    let lastError: unknown

    for (let attempt = 0; attempt < MAX_NUMBERING_ATTEMPTS; attempt++) {
      const { year, display_id, invoice_number } =
        await this.getNextInvoiceNumber(prefix)

      try {
        return await this.createInvoices({
          ...data,
          year,
          display_id,
          invoice_number,
        })
      } catch (error) {
        if (!isUniqueViolation(error)) throw error
        lastError = error
      }
    }

    throw lastError
  }

  /**
   * Get or create the singleton invoice config with defaults.
   */
  async getOrCreateConfig(): Promise<any> {
    const configs = await this.listInvoiceConfigs({})
    if (configs.length > 0) {
      return configs[0]
    }

    return await this.createInvoiceConfigs({ ...DEFAULT_INVOICE_CONFIG })
  }
}

export default InvoiceModuleService
