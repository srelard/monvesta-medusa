import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRODUCT_CONTENT_MODULE } from "../../../../../modules/product-content"
import ProductContentModuleService from "../../../../../modules/product-content/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params

  const service: ProductContentModuleService = req.scope.resolve(
    PRODUCT_CONTENT_MODULE
  )

  const contents = await service.listProductContents(
    { product_id: id },
    {
      relations: [
        "trust_badges",
        "stats",
        "features",
        "course_modules",
        "audience",
        "testimonials",
        "faqs",
      ],
    }
  )

  if (!contents.length) {
    return res.json({ content: null })
  }

  const content = contents[0]

  // Sort children by sort_order
  const sortByOrder = (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  content.trust_badges?.sort(sortByOrder)
  content.stats?.sort(sortByOrder)
  content.features?.sort(sortByOrder)
  content.course_modules?.sort(sortByOrder)
  content.audience?.sort(sortByOrder)
  content.testimonials?.sort(sortByOrder)
  content.faqs?.sort(sortByOrder)

  res.json({ content })
}
