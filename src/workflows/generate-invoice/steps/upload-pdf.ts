import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { INVOICE_MODULE } from "../../../modules/invoice"
import type InvoiceModuleService from "../../../modules/invoice/service"
import { InvoiceStatus } from "../../../modules/invoice/models/invoice"

type UploadPdfInput = {
  invoice_id: string
  pdf_buffer_base64: string
  filename: string
}

export const uploadPdfStep = createStep(
  "upload-pdf",
  async ({ invoice_id, pdf_buffer_base64, filename }: UploadPdfInput, { container }) => {
    const fileService = container.resolve(Modules.FILE)
    const invoiceService: InvoiceModuleService = container.resolve(INVOICE_MODULE)

    console.log(`[Invoice] Step: upload-pdf for invoice ${invoice_id}, filename: ${filename}`)
    // Upload PDF via File Module (S3/local)
    const [file] = await fileService.createFiles([
      {
        filename,
        mimeType: "application/pdf",
        content: pdf_buffer_base64,
      },
    ])

    // Update invoice record with file URL
    await invoiceService.updateInvoices({
      id: invoice_id,
      file_url: file.url,
      file_key: file.id,
      status: InvoiceStatus.GENERATED,
    })

    return new StepResponse(
      { file_url: file.url, file_key: file.id },
      { file_id: file.id, invoice_id }
    )
  },
  // Compensation: delete uploaded file and reset invoice status
  async (data, { container }) => {
    if (!data) return
    const { file_id, invoice_id } = data

    if (file_id) {
      const fileService = container.resolve(Modules.FILE)
      await fileService.deleteFiles([file_id])
    }

    if (invoice_id) {
      const invoiceService: InvoiceModuleService = container.resolve(INVOICE_MODULE)
      await invoiceService.updateInvoices({
        id: invoice_id,
        file_url: null as any,
        file_key: null as any,
        status: InvoiceStatus.PENDING,
      })
    }
  }
)
