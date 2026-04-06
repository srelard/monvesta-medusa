import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { INVOICE_MODULE } from "../../../modules/invoice"
import type InvoiceModuleService from "../../../modules/invoice/service"
import { generateInvoicePdf, type InvoicePdfData } from "../../../modules/invoice/pdf/generate-pdf"

type GeneratePdfInput = {
  invoice_id: string
  config: any
}

export const generatePdfStep = createStep(
  "generate-pdf",
  async ({ invoice_id, config }: GeneratePdfInput, { container }) => {
    const invoiceService: InvoiceModuleService = container.resolve(INVOICE_MODULE)

    // Retrieve invoice with items
    const invoice = await invoiceService.retrieveInvoice(invoice_id, {
      relations: ["items"],
    })

    // Build PDF data
    const pdfData: InvoicePdfData = {
      invoice_number: invoice.invoice_number,
      issued_at: invoice.issued_at,
      company: {
        name: config.company_name,
        address: config.company_address,
        city: config.company_city,
        postal_code: config.company_postal_code,
        country: config.company_country,
        email: config.company_email,
        phone: config.company_phone,
        vat_id: config.company_vat_id,
        registration: config.company_registration,
        managing_director: config.managing_director,
        bank_name: config.bank_name,
        bank_iban: config.bank_iban,
        bank_bic: config.bank_bic,
        logo_url: config.logo_url,
        footer_text: config.footer_text,
      },
      customer: {
        name: invoice.customer_name,
        email: invoice.customer_email,
        address: invoice.customer_address,
        vat_id: invoice.customer_vat_id || undefined,
      },
      items: invoice.items.map((item: any) => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
        tax_amount: item.tax_amount,
      })),
      subtotal: invoice.subtotal,
      tax_total: invoice.tax_total,
      total: invoice.total,
      tax_rate: invoice.tax_rate,
      currency_code: invoice.currency_code,
    }

    const pdfBuffer = await generateInvoicePdf(pdfData)

    return new StepResponse({
      pdf_buffer: pdfBuffer.toString("base64"),
      filename: `rechnung-${invoice.invoice_number}.pdf`,
    })
  }
)
