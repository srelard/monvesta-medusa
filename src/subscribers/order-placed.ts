import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { generateInvoiceWorkflow } from "../workflows/generate-invoice"
import { sendOrderWebhookWorkflow } from "../workflows/send-order-webhook"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  // Step 1: Generate invoice (failure must not block the order webhook)
  let invoiceResult: {
    invoice_id: string
    invoice_number: string
    file_url: string
  } | null = null

  try {
    const { result } = await generateInvoiceWorkflow(container).run({
      input: { order_id: data.id },
    })
    invoiceResult = result
    logger.info(`Invoice ${result.invoice_number} generated for order ${data.id}`)
  } catch (err) {
    logger.error(`Failed to generate invoice for order ${data.id}`, err)
  }

  // Step 2: Send order + invoice data to n8n (retried by the workflow engine)
  try {
    await sendOrderWebhookWorkflow(container).run({
      input: {
        order_id: data.id,
        invoice: invoiceResult
          ? {
              invoice_number: invoiceResult.invoice_number,
              file_url: invoiceResult.file_url,
            }
          : null,
      },
    })
  } catch (err) {
    logger.error(`Failed to send order ${data.id} to n8n webhook`, err)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
