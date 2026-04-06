import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { INVOICE_MODULE } from "../../../modules/invoice"
import type InvoiceModuleService from "../../../modules/invoice/service"

/**
 * GET /admin/invoice-config
 * Retrieve the invoice configuration (singleton).
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const invoiceService: InvoiceModuleService = req.scope.resolve(INVOICE_MODULE)
  const config = await invoiceService.getOrCreateConfig()
  res.json({ invoice_config: config })
}

/**
 * POST /admin/invoice-config
 * Update the invoice configuration.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const invoiceService: InvoiceModuleService = req.scope.resolve(INVOICE_MODULE)
  const input = req.body as Record<string, unknown>

  // Get or create config
  const existing = await invoiceService.getOrCreateConfig()

  // Update with provided fields
  const updated = await invoiceService.updateInvoiceConfigs({
    id: existing.id,
    ...input,
  })

  res.json({ invoice_config: updated })
}
