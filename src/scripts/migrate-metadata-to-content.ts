import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { PRODUCT_CONTENT_MODULE } from "../modules/product-content"
import ProductContentModuleService from "../modules/product-content/service"
import { IProductModuleService } from "@medusajs/framework/types"
import { LinkDefinition } from "@medusajs/framework/types"

/**
 * Migrate product metadata to the Product Content Module.
 *
 * Run with: npx medusa exec ./src/scripts/migrate-metadata-to-content.ts
 */
export default async function migrateMetadataToContent({ container }: ExecArgs) {
  const logger = container.resolve("logger") as any
  const productService = container.resolve(Modules.PRODUCT) as IProductModuleService
  const contentService = container.resolve(PRODUCT_CONTENT_MODULE) as ProductContentModuleService
  const link = container.resolve("link") as any

  logger.info("[Migration] Starting metadata → product_content migration...")

  const products = await productService.listProducts({}, {
    select: ["id", "title", "metadata"],
  })

  let migrated = 0
  let skipped = 0

  for (const product of products) {
    const meta = (product as any).metadata as Record<string, any> | null
    if (!meta) {
      logger.info(`[Migration] ${product.title}: no metadata, skipping`)
      skipped++
      continue
    }

    // Check if already migrated
    const existing = await contentService.listProductContents({
      product_id: product.id,
    })

    if (existing.length > 0) {
      logger.info(`[Migration] ${product.title}: already migrated, skipping`)
      skipped++
      continue
    }

    // Create content record
    const content = await contentService.createProductContents({
      product_id: product.id,
      badge: meta.badge || null,
      sale_label: meta.sale_label || null,
      discount_label: meta.discount_label || null,
      sale_ends_at: meta.sale_ends_at ? new Date(meta.sale_ends_at) : null,
      original_price: meta.original_price ? Number(meta.original_price) : null,
      video_url: null,
      video_thumbnail: null,
    })

    // Create children
    if (Array.isArray(meta.trust_badges) && meta.trust_badges.length) {
      await contentService.createProductTrustBadges(
        meta.trust_badges.map((label: string, i: number) => ({
          label,
          sort_order: i,
          content_id: content.id,
        }))
      )
    }

    if (Array.isArray(meta.stats) && meta.stats.length) {
      await contentService.createProductStats(
        meta.stats.map((s: any, i: number) => ({
          value: s.value,
          label: s.label,
          sort_order: i,
          content_id: content.id,
        }))
      )
    }

    if (Array.isArray(meta.features) && meta.features.length) {
      await contentService.createProductFeatures(
        meta.features.map((f: any, i: number) => ({
          title: f.title,
          description: f.description,
          sort_order: i,
          content_id: content.id,
        }))
      )
    }

    if (Array.isArray(meta.modules) && meta.modules.length) {
      await contentService.createProductCourseModules(
        meta.modules.map((m: any, i: number) => ({
          title: m.title,
          duration: m.duration || null,
          lessons: m.lessons || null,
          sort_order: i,
          content_id: content.id,
        }))
      )
    }

    if (Array.isArray(meta.audience) && meta.audience.length) {
      await contentService.createProductAudiencePoints(
        meta.audience.map((text: string, i: number) => ({
          text,
          sort_order: i,
          content_id: content.id,
        }))
      )
    }

    if (Array.isArray(meta.testimonials) && meta.testimonials.length) {
      await contentService.createProductTestimonials(
        meta.testimonials.map((t: any, i: number) => ({
          name: t.name,
          text: t.text,
          rating: t.rating ?? 5,
          sort_order: i,
          content_id: content.id,
        }))
      )
    }

    if (Array.isArray(meta.faqs) && meta.faqs.length) {
      await contentService.createProductFaqs(
        meta.faqs.map((f: any, i: number) => ({
          question: f.q,
          answer: f.a,
          sort_order: i,
          content_id: content.id,
        }))
      )
    }

    // Create remote link between product and content
    await link.create({
      [Modules.PRODUCT]: { product_id: product.id },
      [PRODUCT_CONTENT_MODULE]: { product_content_id: content.id },
    })

    logger.info(`[Migration] ${product.title}: migrated successfully (${content.id})`)
    migrated++
  }

  logger.info(`[Migration] Done! Migrated: ${migrated}, Skipped: ${skipped}`)
}
