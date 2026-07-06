import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  sendOrderWebhookStep,
  SendOrderWebhookInput,
} from "./steps/send-webhook"

export type { SendOrderWebhookInput }

export const sendOrderWebhookWorkflow = createWorkflow(
  "send-order-webhook",
  (input: SendOrderWebhookInput) => {
    return new WorkflowResponse(sendOrderWebhookStep(input))
  }
)
