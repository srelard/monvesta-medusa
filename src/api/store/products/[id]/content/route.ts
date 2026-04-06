import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRODUCT_CONTENT_MODULE } from "../../../../../modules/product-content"
import ProductContentModuleService from "../../../../../modules/product-content/service"

const RELATIONS = [
  "trust_badges", "stats", "features", "course_modules",
  "audience", "testimonials", "faqs",
]

const sortByOrder = (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)

// Simple in-memory cache (reset on server restart)
let contentCache: Map<string, { data: any; timestamp: number }> = new Map()
const CACHE_TTL = 60_000 // 60 seconds

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const start = Date.now()

  // Check cache first
  const cached = contentCache.get(id)
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log(`[Content API] Cache hit for ${id} (${Date.now() - start}ms)`)
    return res.json({ content: cached.data })
  }

  const service: ProductContentModuleService = req.scope.resolve(PRODUCT_CONTENT_MODULE)

  const t1 = Date.now()
  const contents = await service.listProductContents(
    { product_id: id },
    { relations: RELATIONS }
  )
  console.log(`[Content API] DB query: ${Date.now() - t1}ms`)

  if (!contents.length) {
    contentCache.set(id, { data: null, timestamp: Date.now() })
    return res.json({ content: null })
  }

  const content = contents[0]
  for (const rel of RELATIONS) {
    content[rel]?.sort(sortByOrder)
  }

  // Cache the result
  contentCache.set(id, { data: content, timestamp: Date.now() })

  console.log(`[Content API] Total: ${Date.now() - start}ms`)
  res.json({ content })
}
