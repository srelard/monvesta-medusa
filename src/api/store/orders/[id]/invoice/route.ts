import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { INVOICE_MODULE } from "../../../../../modules/invoice"
import type InvoiceModuleService from "../../../../../modules/invoice/service"

/**
 * GET /store/orders/:id/invoice
 * Download the latest invoice PDF for an order (customer-facing).
 * Returns the file URL for redirect/download.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const invoiceService: InvoiceModuleService = req.scope.resolve(INVOICE_MODULE)

  const invoices = await invoiceService.listInvoices(
    { order_id: id, status: "generated" as any },
    { order: { display_id: "DESC" }, take: 1 }
  )

  if (!invoices.length || !invoices[0].file_url) {
    return res.status(404).json({ message: "Keine Rechnung verfügbar." })
  }

  const invoice = invoices[0]
  res.json({
    invoice_number: invoice.invoice_number,
    file_url: invoice.file_url,
    issued_at: invoice.issued_at,
  })
}
