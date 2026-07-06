import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"

export type SendOrderWebhookInput = {
  order_id: string
  invoice: { invoice_number: string; file_url: string } | null
}

/**
 * POST the order (+ invoice link) to the n8n webhook that sends the order
 * confirmation email. Throws on failure so the workflow engine retries —
 * a transient n8n outage must not silently swallow a confirmation email.
 */
export const sendOrderWebhookStep = createStep(
  { name: "send-order-webhook", maxRetries: 3, retryInterval: 10 },
  async (input: SendOrderWebhookInput, { container }) => {
    const logger = container.resolve("logger")

    const webhookUrl = process.env.N8N_ORDER_WEBHOOK_URL
    if (!webhookUrl) {
      logger.warn("N8N_ORDER_WEBHOOK_URL not set — skipping order webhook")
      return new StepResponse({ sent: false })
    }

    const query = container.resolve("query")
    const {
      data: [order],
    } = await query.graph({
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
      filters: { id: input.order_id },
    })

    if (!order) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Order ${input.order_id} not found`
      )
    }

    logger.info(`Sending order ${order.id} to n8n webhook...`)

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "order.placed",
        order,
        // Include invoice data so n8n can attach PDF to confirmation email
        invoice: input.invoice
          ? {
              invoice_number: input.invoice.invoice_number,
              file_url: input.invoice.file_url,
            }
          : null,
      }),
    })

    if (!response.ok) {
      // Throw so the step is retried by the workflow engine
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `n8n webhook failed: ${response.status} ${response.statusText}`
      )
    }

    logger.info(`Order ${order.id} sent to n8n successfully`)
    return new StepResponse({ sent: true })
  }
)
