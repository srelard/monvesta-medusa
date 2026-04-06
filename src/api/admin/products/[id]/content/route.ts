import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { PRODUCT_CONTENT_MODULE } from "../../../../../modules/product-content"
import ProductContentModuleService from "../../../../../modules/product-content/service"
import { contentCache } from "../../../../../api/store/products/[id]/content/route"

const RELATIONS = [
  "trust_badges", "stats", "features", "course_modules",
  "audience", "testimonials", "faqs",
]

const sortByOrder = (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)

function sortContent(content: any) {
  for (const rel of RELATIONS) {
    content[rel]?.sort(sortByOrder)
  }
  return content
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const start = Date.now()
  const service: ProductContentModuleService = req.scope.resolve(PRODUCT_CONTENT_MODULE)

  const t1 = Date.now()
  const contents = await service.listProductContents(
    { product_id: id },
    { relations: RELATIONS }
  )
  console.log(`[Admin Content API] DB query: ${Date.now() - t1}ms, total: ${Date.now() - start}ms`)

  if (!contents.length) {
    return res.json({ content: null })
  }

  res.json({ content: sortContent(contents[0]) })
}

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const input = req.body as any
  const service: ProductContentModuleService = req.scope.resolve(PRODUCT_CONTENT_MODULE)

  // Check if content exists
  const existing = await service.listProductContents({ product_id: id })
  const isNew = existing.length === 0

  let contentId: string

  if (isNew) {
    const content = await service.createProductContents({
      product_id: id,
      badge: input.badge ?? null,
      sale_label: input.sale_label ?? null,
      discount_label: input.discount_label ?? null,
      sale_ends_at: input.sale_ends_at ? new Date(input.sale_ends_at) : null,
      original_price: input.original_price ? Number(input.original_price) : null,
      video_url: input.video_url ?? null,
      video_thumbnail: input.video_thumbnail ?? null,
    })
    contentId = content.id

    // Create remote link
    const link = req.scope.resolve("link") as any
    await link.create({
      [Modules.PRODUCT]: { product_id: id },
      [PRODUCT_CONTENT_MODULE]: { product_content_id: contentId },
    })
  } else {
    contentId = existing[0].id

    // Delete existing children in parallel
    const prev = await service.retrieveProductContent(contentId, { relations: RELATIONS })
    await Promise.all([
      prev.trust_badges?.length && service.deleteProductTrustBadges(prev.trust_badges.map((c: any) => c.id)),
      prev.stats?.length && service.deleteProductStats(prev.stats.map((c: any) => c.id)),
      prev.features?.length && service.deleteProductFeatures(prev.features.map((c: any) => c.id)),
      prev.course_modules?.length && service.deleteProductCourseModules(prev.course_modules.map((c: any) => c.id)),
      prev.audience?.length && service.deleteProductAudiencePoints(prev.audience.map((c: any) => c.id)),
      prev.testimonials?.length && service.deleteProductTestimonials(prev.testimonials.map((c: any) => c.id)),
      prev.faqs?.length && service.deleteProductFaqs(prev.faqs.map((c: any) => c.id)),
    ].filter(Boolean))

    // Update root
    await service.updateProductContents({
      id: contentId,
      badge: input.badge ?? null,
      sale_label: input.sale_label ?? null,
      discount_label: input.discount_label ?? null,
      sale_ends_at: input.sale_ends_at ? new Date(input.sale_ends_at) : null,
      original_price: input.original_price ? Number(input.original_price) : null,
      video_url: input.video_url ?? null,
      video_thumbnail: input.video_thumbnail ?? null,
    })
  }

  // Create children in parallel
  await Promise.all([
    input.trust_badges?.length && service.createProductTrustBadges(
      input.trust_badges.map((b: any, i: number) => ({ label: b.label, sort_order: i, content_id: contentId }))
    ),
    input.stats?.length && service.createProductStats(
      input.stats.map((s: any, i: number) => ({ value: s.value, label: s.label, sort_order: i, content_id: contentId }))
    ),
    input.features?.length && service.createProductFeatures(
      input.features.map((f: any, i: number) => ({ title: f.title, description: f.description, sort_order: i, content_id: contentId }))
    ),
    input.course_modules?.length && service.createProductCourseModules(
      input.course_modules.map((m: any, i: number) => ({ title: m.title, duration: m.duration || null, lessons: m.lessons || null, sort_order: i, content_id: contentId }))
    ),
    input.audience?.length && service.createProductAudiencePoints(
      input.audience.map((a: any, i: number) => ({ text: a.text, sort_order: i, content_id: contentId }))
    ),
    input.testimonials?.length && service.createProductTestimonials(
      input.testimonials.map((t: any, i: number) => ({ name: t.name, text: t.text, rating: t.rating ?? 5, sort_order: i, content_id: contentId }))
    ),
    input.faqs?.length && service.createProductFaqs(
      input.faqs.map((f: any, i: number) => ({ question: f.question, answer: f.answer, sort_order: i, content_id: contentId }))
    ),
  ].filter(Boolean))

  // Invalidate store cache for this product
  contentCache.delete(id)

  // Return updated content
  const result = await service.retrieveProductContent(contentId, { relations: RELATIONS })
  res.json({ content: sortContent(result) })
}
