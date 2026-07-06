import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { INVOICE_MODULE } from "../../../../../modules/invoice"
import type InvoiceModuleService from "../../../../../modules/invoice/service"

/**
 * GET /store/orders/:id/invoice?email=<order email>
 * Download the latest invoice PDF for an order (customer-facing).
 *
 * The invoice contains personal data, so the requester must prove ownership:
 * either a logged-in customer session matching the order's customer, or the
 * order's email address passed as `?email=` (for guest checkouts).
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params

  const query = req.scope.resolve("query")
  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: ["id", "email", "customer_id"],
    filters: { id },
  })

  if (!order) {
    return res.status(404).json({ message: "Keine Rechnung verfügbar." })
  }

  const authCustomerId = (req as any).auth_context?.actor_id as
    | string
    | undefined
  const providedEmail = (req.query.email as string | undefined)?.trim().toLowerCase()

  const isOwner =
    (!!authCustomerId && order.customer_id === authCustomerId) ||
    (!!providedEmail && order.email?.toLowerCase() === providedEmail)

  if (!isOwner) {
    return res.status(401).json({ message: "Nicht berechtigt." })
  }

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
