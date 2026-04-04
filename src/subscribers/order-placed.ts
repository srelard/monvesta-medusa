import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")

  const webhookUrl = process.env.N8N_ORDER_WEBHOOK_URL

  if (!webhookUrl) {
    logger.warn("N8N_ORDER_WEBHOOK_URL not set — skipping order webhook")
    return
  }

  try {
    // Retrieve full order details via Query
    const { data: [order] } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "created_at",
        "email",
        "currency_code",
        // Totals
        "total",
        "subtotal",
        "tax_total",
        "discount_total",
        "shipping_total",
        "item_total",
        // Items with product info
        "items.*",
        "items.variant.*",
        "items.variant.product.*",
        // Customer
        "customer.id",
        "customer.first_name",
        "customer.last_name",
        "customer.email",
        // Addresses
        "shipping_address.*",
        "billing_address.*",
        // Metadata (customer_type, vat_id etc.)
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
