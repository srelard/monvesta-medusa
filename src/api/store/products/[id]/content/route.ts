import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRODUCT_CONTENT_MODULE } from "../../../../../modules/product-content"
import ProductContentModuleService from "../../../../../modules/product-content/service"
import {
  getCachedProductContent,
  setCachedProductContent,
} from "../../../../../lib/product-content-cache"

/**
 * GET /store/products/:id/content
 * Public marketing content for a product detail page.
 * Cached (Redis-backed in production); invalidated on admin save.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params

  const cached = await getCachedProductContent(req.scope, id)
  if (cached) {
    return res.json({ content: cached.content })
  }

  const service: ProductContentModuleService = req.scope.resolve(
    PRODUCT_CONTENT_MODULE
  )

  const content = await service.getContentByProductId(id)

  // Cache misses too (content === null) so unknown products don't hit the DB
  await setCachedProductContent(req.scope, id, content)

  res.json({ content })
}
