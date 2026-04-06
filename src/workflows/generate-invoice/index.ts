import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"
import { createInvoiceStep } from "./steps/create-invoice"
import { generatePdfStep } from "./steps/generate-pdf"
import { uploadPdfStep } from "./steps/upload-pdf"
import { INVOICE_MODULE } from "../../modules/invoice"

type GenerateInvoiceInput = {
  order_id: string
}

export const generateInvoiceWorkflow = createWorkflow(
  "generate-invoice",
  function (input: GenerateInvoiceInput) {
    // Step 1: Fetch order details
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "currency_code",
        "total",
        "subtotal",
        "tax_total",
        "discount_total",
        "shipping_total",
        "items.*",
        "items.variant.*",
        "items.variant.product.*",
        "shipping_address.*",
        "billing_address.*",
        "metadata",
      ],
      filters: { id: input.order_id },
    })

    // Step 2: Fetch invoice config
    const { data: configs } = useQueryGraphStep({
      entity: "invoice_config",
      fields: ["*"],
    }).config({ name: "fetch-invoice-config" })

    // Prepare config (use first config or defaults)
    const config = transform({ configs }, ({ configs }) => {
      if (configs?.length > 0) return configs[0]
      return {
        company_name: "Monvesta GmbH",
        company_address: "Musterstraße 1",
        company_city: "Berlin",
        company_postal_code: "10115",
        company_country: "Deutschland",
        company_email: "info@monvesta.de",
        company_vat_id: "DE123456789",
        managing_director: "Max Mustermann",
        bank_name: "Deutsche Bank",
        bank_iban: "DE89 3704 0044 0532 0130 00",
        bank_bic: "COBADEFFXXX",
        invoice_prefix: "RE",
        default_tax_rate: 19,
        footer_text:
          "Vielen Dank für Ihr Vertrauen. Diese Rechnung wurde elektronisch erstellt und ist ohne Unterschrift gültig.",
      }
    })

    const order = transform({ orders }, ({ orders }) => orders[0])

    // Step 3: Create invoice record + items
    const invoice = createInvoiceStep({ order, config })

    // Step 4: Generate PDF
    const pdfResult = generatePdfStep({
      invoice_id: invoice.id,
      config,
    })

    // Step 5: Upload PDF to file storage
    const uploadInput = transform(
      { invoice, pdfResult },
      ({ invoice, pdfResult }) => ({
        invoice_id: invoice.id,
        pdf_buffer_base64: pdfResult.pdf_buffer,
        filename: pdfResult.filename,
      })
    )
    const fileResult = uploadPdfStep(uploadInput)

    // Step 6: Create remote link between Order and Invoice
    const linkData = transform({ invoice, input }, ({ invoice, input }) => [
      {
        [Modules.ORDER]: { order_id: input.order_id },
        [INVOICE_MODULE]: { invoice_id: invoice.id },
      },
    ])
    createRemoteLinkStep(linkData)

    // Return result
    const result = transform(
      { invoice, fileResult },
      ({ invoice, fileResult }) => ({
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        file_url: fileResult.file_url,
      })
    )

    return new WorkflowResponse(result)
  }
)
