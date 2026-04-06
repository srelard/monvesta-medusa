import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { INVOICE_MODULE } from "../../../../../modules/invoice"
import type InvoiceModuleService from "../../../../../modules/invoice/service"
import { generateInvoiceWorkflow } from "../../../../../workflows/generate-invoice"

/**
 * GET /admin/orders/:id/invoice
 * Retrieve invoices for an order.
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const invoiceService: InvoiceModuleService = req.scope.resolve(INVOICE_MODULE)

  const invoices = await invoiceService.listInvoices(
    { order_id: id },
    { relations: ["items"], order: { display_id: "DESC" } }
  )

  res.json({ invoices })
}

/**
 * POST /admin/orders/:id/invoice
 * Generate (or regenerate) an invoice for an order.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  try {
    const { result } = await generateInvoiceWorkflow(req.scope).run({
      input: { order_id: id },
    })

    res.json({
      invoice_id: result.invoice_id,
      invoice_number: result.invoice_number,
      file_url: result.file_url,
    })
  } catch (error: any) {
    res.status(500).json({
      message: `Failed to generate invoice: ${error.message}`,
    })
  }
}
