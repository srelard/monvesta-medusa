import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { PRODUCT_CONTENT_MODULE } from "../../../../../modules/product-content"
import ProductContentModuleService from "../../../../../modules/product-content/service"
import { upsertProductContentWorkflow } from "../../../../../workflows/upsert-product-content"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
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

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  const body = req.body as Record<string, unknown>
  const { result } = await upsertProductContentWorkflow(req.scope).run({
    input: {
      product_id: id,
      ...body,
    },
  })

  res.json({ content: result.content })
}
