import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PRODUCT_CONTENT_MODULE } from "../../../modules/product-content"
import ProductContentModuleService from "../../../modules/product-content/service"

export type UpsertContentInput = {
  product_id: string
  badge?: string | null
  sale_label?: string | null
  discount_label?: string | null
  sale_ends_at?: string | null
  original_price?: number | null
  video_url?: string | null
  video_thumbnail?: string | null
  trust_badges?: { label: string }[]
  stats?: { value: string; label: string }[]
  features?: { title: string; description: string }[]
  course_modules?: { title: string; duration?: string; lessons?: string }[]
  audience?: { text: string }[]
  testimonials?: { name: string; text: string; rating?: number }[]
  faqs?: { question: string; answer: string }[]
}

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

    // Check if content already exists for this product
    const existing = await service.listProductContents({
      product_id: input.product_id,
    })

    const isUpdate = existing.length > 0

    if (isUpdate) {
      const contentId = existing[0].id

      // Delete all existing children
      const prevContent = await service.retrieveProductContent(contentId, {
        relations: [
          "trust_badges", "stats", "features", "course_modules",
          "audience", "testimonials", "faqs",
        ],
      })

      const deleteIds = (items: any[]) => items?.map((c: any) => c.id) || []
      if (deleteIds(prevContent.trust_badges).length) await service.deleteProductTrustBadges(deleteIds(prevContent.trust_badges))
      if (deleteIds(prevContent.stats).length) await service.deleteProductStats(deleteIds(prevContent.stats))
      if (deleteIds(prevContent.features).length) await service.deleteProductFeatures(deleteIds(prevContent.features))
      if (deleteIds(prevContent.course_modules).length) await service.deleteProductCourseModules(deleteIds(prevContent.course_modules))
      if (deleteIds(prevContent.audience).length) await service.deleteProductAudiencePoints(deleteIds(prevContent.audience))
      if (deleteIds(prevContent.testimonials).length) await service.deleteProductTestimonials(deleteIds(prevContent.testimonials))
      if (deleteIds(prevContent.faqs).length) await service.deleteProductFaqs(deleteIds(prevContent.faqs))

      // Update root record
      await service.updateProductContents({
        id: contentId,
        badge: input.badge ?? null,
        sale_label: input.sale_label ?? null,
        discount_label: input.discount_label ?? null,
        sale_ends_at: input.sale_ends_at ? new Date(input.sale_ends_at) : null,
        original_price: input.original_price ?? null,
        video_url: input.video_url ?? null,
        video_thumbnail: input.video_thumbnail ?? null,
      })

      // Create new children
      await createChildren(service, contentId, input)

      const result = await service.retrieveProductContent(contentId, {
        relations: ["trust_badges", "stats", "features", "course_modules", "audience", "testimonials", "faqs"],
      })

      return new StepResponse(
        { content: result, created: false },
        { contentId, isUpdate: true } as CompensationData
      )
    } else {
      // Create new root record
      const content = await service.createProductContents({
        product_id: input.product_id,
        badge: input.badge ?? null,
        sale_label: input.sale_label ?? null,
        discount_label: input.discount_label ?? null,
        sale_ends_at: input.sale_ends_at ? new Date(input.sale_ends_at) : null,
        original_price: input.original_price ?? null,
        video_url: input.video_url ?? null,
        video_thumbnail: input.video_thumbnail ?? null,
      })

      await createChildren(service, content.id, input)

      const result = await service.retrieveProductContent(content.id, {
        relations: ["trust_badges", "stats", "features", "course_modules", "audience", "testimonials", "faqs"],
      })

      return new StepResponse(
        { content: result, created: true },
        { contentId: content.id, isUpdate: false } as CompensationData
      )
    }
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

async function createChildren(
  service: ProductContentModuleService,
  contentId: string,
  input: UpsertContentInput
) {
  if (input.trust_badges?.length) {
    await service.createProductTrustBadges(
      input.trust_badges.map((b, i) => ({
        label: b.label,
        sort_order: i,
        content_id: contentId,
      }))
    )
  }
  if (input.stats?.length) {
    await service.createProductStats(
      input.stats.map((s, i) => ({
        value: s.value,
        label: s.label,
        sort_order: i,
        content_id: contentId,
      }))
    )
  }
  if (input.features?.length) {
    await service.createProductFeatures(
      input.features.map((f, i) => ({
        title: f.title,
        description: f.description,
        sort_order: i,
        content_id: contentId,
      }))
    )
  }
  if (input.course_modules?.length) {
    await service.createProductCourseModules(
      input.course_modules.map((m, i) => ({
        title: m.title,
        duration: m.duration || null,
        lessons: m.lessons || null,
        sort_order: i,
        content_id: contentId,
      }))
    )
  }
  if (input.audience?.length) {
    await service.createProductAudiencePoints(
      input.audience.map((a, i) => ({
        text: a.text,
        sort_order: i,
        content_id: contentId,
      }))
    )
  }
  if (input.testimonials?.length) {
    await service.createProductTestimonials(
      input.testimonials.map((t, i) => ({
        name: t.name,
        text: t.text,
        rating: t.rating ?? 5,
        sort_order: i,
        content_id: contentId,
      }))
    )
  }
  if (input.faqs?.length) {
    await service.createProductFaqs(
      input.faqs.map((f, i) => ({
        question: f.question,
        answer: f.answer,
        sort_order: i,
        content_id: contentId,
      }))
    )
  }
}
