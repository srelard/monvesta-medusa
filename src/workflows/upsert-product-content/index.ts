import {
  createWorkflow,
  WorkflowResponse,
  when,
} from "@medusajs/framework/workflows-sdk"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"
import { PRODUCT_CONTENT_MODULE } from "../../modules/product-content"
import { upsertContentStep, UpsertContentInput } from "./steps/upsert-content"

export const upsertProductContentWorkflow = createWorkflow(
  "upsert-product-content",
  (input: UpsertContentInput) => {
    const result = upsertContentStep(input)

    // Create remote link only when a new content record was created
    when({ result }, ({ result }) => result.created === true).then(() => {
      createRemoteLinkStep([
        {
          [Modules.PRODUCT]: {
            product_id: input.product_id,
          },
          [PRODUCT_CONTENT_MODULE]: {
            product_content_id: result.content.id,
          },
        },
      ])
    })

    return new WorkflowResponse(result)
  }
)
