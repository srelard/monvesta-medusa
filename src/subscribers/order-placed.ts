import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { generateInvoiceWorkflow } from "../workflows/generate-invoice"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")

  // Step 1: Generate invoice
  let invoiceResult: { invoice_id: string; invoice_number: string; file_url: string } | null = null
  try {
    const { result } = await generateInvoiceWorkflow(container).run({
      input: { order_id: data.id },
    })
    invoiceResult = result
    logger.info(`Invoice ${result.invoice_number} generated for order ${data.id}`)
  } catch (err) {
    logger.error(`Failed to generate invoice for order ${data.id}`, err)
  }

  // Step 2: Send order + invoice data to n8n webhook
  const webhookUrl = process.env.N8N_ORDER_WEBHOOK_URL
  if (!webhookUrl) {
    logger.warn("N8N_ORDER_WEBHOOK_URL not set — skipping order webhook")
    return
  }

  try {
    const { data: [order] } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "created_at",
        "email",
        "currency_code",
        "total",
        "subtotal",
        "tax_total",
        "discount_total",
        "shipping_total",
        "item_total",
        "items.*",
        "items.variant.*",
        "items.variant.product.*",
        "customer.id",
        "customer.first_name",
        "customer.last_name",
        "customer.email",
        "shipping_address.*",
        "billing_address.*",
        "metadata",
      ],
      filters: {
        id: data.id,
      },
    })

    if (!order) {
      logger.error(`Order ${data.id} not found`)
      return
    }

    logger.info(`Sending order ${order.id} to n8n webhook...`)

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "order.placed",
        order,
        // Include invoice data so n8n can attach PDF to confirmation email
        invoice: invoiceResult
          ? {
              invoice_number: invoiceResult.invoice_number,
              file_url: invoiceResult.file_url,
            }
          : null,
      }),
    })

    if (!response.ok) {
      logger.error(
        `n8n webhook failed: ${response.status} ${response.statusText}`
      )
    } else {
      logger.info(`Order ${order.id} sent to n8n successfully`)
    }
  } catch (err) {
    logger.error("Failed to send order to n8n webhook", err)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
