import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { INVOICE_MODULE } from "../../../modules/invoice"
import type InvoiceModuleService from "../../../modules/invoice/service"
import { InvoiceStatus } from "../../../modules/invoice/models/invoice"

type CreateInvoiceInput = {
  order: any
  config: any
}

export const createInvoiceStep = createStep(
  "create-invoice",
  async ({ order, config }: CreateInvoiceInput, { container }) => {
    console.log(`[Invoice] Step: create-invoice for order ${order?.id}`)
    const invoiceService: InvoiceModuleService = container.resolve(INVOICE_MODULE)

    const prefix = config.invoice_prefix || "RE"
    const { year, display_id, invoice_number } = await invoiceService.getNextInvoiceNumber(prefix)

    // Build customer address from shipping/billing address
    const addr = order.shipping_address || order.billing_address || {}
    const customerAddress = [
      addr.address_1,
      addr.address_2,
      `${addr.postal_code || ""} ${addr.city || ""}`.trim(),
      addr.country_code?.toUpperCase(),
    ]
      .filter(Boolean)
      .join("\n")

    const customerName = [addr.first_name, addr.last_name].filter(Boolean).join(" ") ||
      order.email

    // Extract VAT ID from order metadata
    const customerVatId = order.metadata?.vat_id || null

    // Calculate tax rate from order totals
    const subtotal = Number(order.subtotal) || 0
    const taxTotal = Number(order.tax_total) || 0
    const total = Number(order.total) || 0
    const taxRate = subtotal > 0 ? (taxTotal / subtotal) * 100 : config.default_tax_rate || 19

    // Create invoice record
    const invoice = await invoiceService.createInvoices({
      year,
      display_id,
      invoice_number,
      order_id: order.id,
      issued_at: new Date(),
      customer_email: order.email,
      customer_name: customerName,
      customer_address: customerAddress,
      customer_vat_id: customerVatId,
      subtotal,
      tax_total: taxTotal,
      total,
      tax_rate: Math.round(taxRate * 100) / 100,
      currency_code: order.currency_code || "eur",
      status: InvoiceStatus.PENDING,
    })

    // Create invoice items from order items
    if (order.items?.length) {
      await invoiceService.createInvoiceItems(
        order.items.map((item: any) => ({
          title:
            item.variant?.product?.title
              ? `${item.variant.product.title}${item.variant.title && item.variant.title !== "Default" ? ` – ${item.variant.title}` : ""}`
              : item.title || "Artikel",
          quantity: item.quantity || 1,
          unit_price: Number(item.unit_price) || 0,
          total: Number(item.total) || Number(item.unit_price) * (item.quantity || 1),
          tax_amount: Number(item.tax_total) || 0,
          invoice_id: invoice.id,
        }))
      )
    }

    return new StepResponse(invoice, { invoice_id: invoice.id })
  },
  // Compensation: delete the invoice if a later step fails
  async (data, { container }) => {
    if (!data?.invoice_id) return
    const invoiceService: InvoiceModuleService = container.resolve(INVOICE_MODULE)
    await invoiceService.deleteInvoices(data.invoice_id)
  }
)
