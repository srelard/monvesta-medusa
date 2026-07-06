import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { PRODUCT_CONTENT_MODULE } from "../../../../../modules/product-content"
import ProductContentModuleService, {
  UpsertProductContentInput,
} from "../../../../../modules/product-content/service"
import { upsertProductContentWorkflow } from "../../../../../workflows/upsert-product-content"
import { invalidateCachedProductContent } from "../../../../../lib/product-content-cache"

/**
 * GET /admin/products/:id/content
 * Retrieve the marketing content for a product (uncached).
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const service: ProductContentModuleService = req.scope.resolve(
    PRODUCT_CONTENT_MODULE
  )

  const content = await service.getContentByProductId(id)
  res.json({ content })
}

/**
 * POST /admin/products/:id/content
 * Create or replace the marketing content for a product.
 * Runs through the workflow so link creation is compensated on failure.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const input = (req.validatedBody ??
    req.body) as Omit<UpsertProductContentInput, "product_id">

  const { result } = await upsertProductContentWorkflow(req.scope).run({
    input: { ...input, product_id: id },
  })

  // Invalidate store cache for this product
  await invalidateCachedProductContent(req.scope, id)

  res.json({ content: result.content })
}
