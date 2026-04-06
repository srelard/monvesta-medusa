import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { INVOICE_MODULE } from "../../../../../../modules/invoice"
import type InvoiceModuleService from "../../../../../../modules/invoice/service"

/**
 * DELETE /admin/orders/:id/invoice/:invoiceId
 * Delete an invoice and its uploaded PDF file.
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { invoiceId } = req.params
  const invoiceService: InvoiceModuleService = req.scope.resolve(INVOICE_MODULE)

  try {
    const invoice = await invoiceService.retrieveInvoice(invoiceId)

    // Delete uploaded PDF if exists
    if (invoice.file_key) {
      try {
        const fileService = req.scope.resolve(Modules.FILE)
        await fileService.deleteFiles([invoice.file_key])
      } catch {
        // Ignore file deletion errors
      }
    }

    await invoiceService.deleteInvoices(invoiceId)
    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}
