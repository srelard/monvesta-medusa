import {
  InjectTransactionManager,
  MedusaContext,
  MedusaService,
} from "@medusajs/framework/utils"
import type { Context } from "@medusajs/framework/types"
import { ProductContent } from "./models/product-content"
import { ProductTrustBadge } from "./models/trust-badge"
import { ProductStat } from "./models/stat"
import { ProductFeature } from "./models/feature"
import { ProductCourseModule } from "./models/course-module"
import { ProductAudiencePoint } from "./models/audience-point"
import { ProductTestimonial } from "./models/testimonial"
import { ProductFaq } from "./models/faq"

export const CONTENT_RELATIONS = [
  "trust_badges",
  "stats",
  "features",
  "course_modules",
  "audience",
  "testimonials",
  "faqs",
] as const

export type UpsertProductContentInput = {
  product_id: string
  badge?: string | null
  sale_label?: string | null
  discount_label?: string | null
  sale_ends_at?: string | Date | null
  original_price?: number | string | null
  video_url?: string | null
  video_thumbnail?: string | null
  trust_badges?: { label: string }[]
  stats?: { value: string; label: string }[]
  features?: { title: string; description: string }[]
  course_modules?: { title: string; duration?: string | null; lessons?: string | null }[]
  audience?: { text: string }[]
  testimonials?: { name: string; text: string; rating?: number }[]
  faqs?: { question: string; answer: string }[]
}

const bySortOrder = (a: { sort_order?: number }, b: { sort_order?: number }) =>
  (a.sort_order ?? 0) - (b.sort_order ?? 0)

/**
 * Sort all child relations of a content record by their persisted sort_order.
 */
export function sortContentRelations<T extends Record<string, any>>(content: T): T {
  for (const rel of CONTENT_RELATIONS) {
    content[rel]?.sort(bySortOrder)
  }
  return content
}

class ProductContentModuleService extends MedusaService({
  ProductContent,
  ProductTrustBadge,
  ProductStat,
  ProductFeature,
  ProductCourseModule,
  ProductAudiencePoint,
  ProductTestimonial,
  ProductFaq,
}) {
  /**
   * Fetch the content record (with all child relations, sorted) for a product,
   * or null when none exists.
   */
  async getContentByProductId(productId: string) {
    const [content] = await this.listProductContents(
      { product_id: productId },
      { relations: [...CONTENT_RELATIONS] }
    )
    return content ? sortContentRelations(content) : null
  }

  /**
   * Create or replace the marketing content for a product.
   *
   * Child collections are replaced wholesale: existing children are deleted
   * and the provided ones recreated with their array index as sort_order.
   * Runs in a single transaction so a mid-flight failure can't lose content.
   */
  @InjectTransactionManager()
  async upsertContent(
    input: UpsertProductContentInput,
    @MedusaContext() sharedContext: Context = {}
  ) {
    const rootData = {
      badge: input.badge ?? null,
      sale_label: input.sale_label ?? null,
      discount_label: input.discount_label ?? null,
      sale_ends_at: input.sale_ends_at ? new Date(input.sale_ends_at) : null,
      original_price: input.original_price ? Number(input.original_price) : null,
      video_url: input.video_url ?? null,
      video_thumbnail: input.video_thumbnail ?? null,
    }

    const [existing] = await this.listProductContents(
      { product_id: input.product_id },
      {},
      sharedContext
    )

    let contentId: string

    if (existing) {
      contentId = existing.id
      await this.deleteChildren(contentId, sharedContext)
      await this.updateProductContents({ id: contentId, ...rootData }, sharedContext)
    } else {
      const content = await this.createProductContents(
        {
          product_id: input.product_id,
          ...rootData,
        },
        sharedContext
      )
      contentId = content.id
    }

    await this.createChildren(contentId, input, sharedContext)

    const content = await this.retrieveProductContent(
      contentId,
      { relations: [...CONTENT_RELATIONS] },
      sharedContext
    )

    return { content: sortContentRelations(content), created: !existing }
  }

  private async deleteChildren(
    contentId: string,
    sharedContext: Context
  ): Promise<void> {
    const prev = await this.retrieveProductContent(
      contentId,
      { relations: [...CONTENT_RELATIONS] },
      sharedContext
    )

    const ids = (items?: { id: string }[]) => items?.map((i) => i.id) ?? []

    const tasks: Promise<unknown>[] = []
    if (ids(prev.trust_badges).length) tasks.push(this.deleteProductTrustBadges(ids(prev.trust_badges), sharedContext))
    if (ids(prev.stats).length) tasks.push(this.deleteProductStats(ids(prev.stats), sharedContext))
    if (ids(prev.features).length) tasks.push(this.deleteProductFeatures(ids(prev.features), sharedContext))
    if (ids(prev.course_modules).length) tasks.push(this.deleteProductCourseModules(ids(prev.course_modules), sharedContext))
    if (ids(prev.audience).length) tasks.push(this.deleteProductAudiencePoints(ids(prev.audience), sharedContext))
    if (ids(prev.testimonials).length) tasks.push(this.deleteProductTestimonials(ids(prev.testimonials), sharedContext))
    if (ids(prev.faqs).length) tasks.push(this.deleteProductFaqs(ids(prev.faqs), sharedContext))
    await Promise.all(tasks)
  }

  private async createChildren(
    contentId: string,
    input: UpsertProductContentInput,
    sharedContext: Context
  ): Promise<void> {
    const tasks: Promise<unknown>[] = []

    if (input.trust_badges?.length) {
      tasks.push(
        this.createProductTrustBadges(
          input.trust_badges.map((b, i) => ({
            label: b.label,
            sort_order: i,
            content_id: contentId,
          })),
          sharedContext
        )
      )
    }
    if (input.stats?.length) {
      tasks.push(
        this.createProductStats(
          input.stats.map((s, i) => ({
            value: s.value,
            label: s.label,
            sort_order: i,
            content_id: contentId,
          })),
          sharedContext
        )
      )
    }
    if (input.features?.length) {
      tasks.push(
        this.createProductFeatures(
          input.features.map((f, i) => ({
            title: f.title,
            description: f.description,
            sort_order: i,
            content_id: contentId,
          })),
          sharedContext
        )
      )
    }
    if (input.course_modules?.length) {
      tasks.push(
        this.createProductCourseModules(
          input.course_modules.map((m, i) => ({
            title: m.title,
            duration: m.duration || null,
            lessons: m.lessons || null,
            sort_order: i,
            content_id: contentId,
          })),
          sharedContext
        )
      )
    }
    if (input.audience?.length) {
      tasks.push(
        this.createProductAudiencePoints(
          input.audience.map((a, i) => ({
            text: a.text,
            sort_order: i,
            content_id: contentId,
          })),
          sharedContext
        )
      )
    }
    if (input.testimonials?.length) {
      tasks.push(
        this.createProductTestimonials(
          input.testimonials.map((t, i) => ({
            name: t.name,
            text: t.text,
            rating: t.rating ?? 5,
            sort_order: i,
            content_id: contentId,
          })),
          sharedContext
        )
      )
    }
    if (input.faqs?.length) {
      tasks.push(
        this.createProductFaqs(
          input.faqs.map((f, i) => ({
            question: f.question,
            answer: f.answer,
            sort_order: i,
            content_id: contentId,
          })),
          sharedContext
        )
      )
    }

    await Promise.all(tasks)
  }
}

export default ProductContentModuleService
