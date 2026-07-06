import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PRODUCT_CONTENT_MODULE } from "../../../modules/product-content"
import ProductContentModuleService, {
  UpsertProductContentInput,
} from "../../../modules/product-content/service"

export type UpsertContentInput = UpsertProductContentInput

type CompensationData = {
  contentId: string
  isUpdate: boolean
}

export const upsertContentStep = createStep(
  "upsert-product-content",
  async (input: UpsertContentInput, { container }) => {
    const service: ProductContentModuleService = container.resolve(
      PRODUCT_CONTENT_MODULE
    )

    const { content, created } = await service.upsertContent(input)

    return new StepResponse(
      { content, created },
      { contentId: content.id, isUpdate: !created } as CompensationData
    )
  },
  async (compensationData: CompensationData, { container }) => {
    if (!compensationData) return

    const service: ProductContentModuleService = container.resolve(
      PRODUCT_CONTENT_MODULE
    )

    if (!compensationData.isUpdate && compensationData.contentId) {
      // Delete the newly created content (cascade deletes children)
      await service.deleteProductContents(compensationData.contentId)
    }
  }
)
