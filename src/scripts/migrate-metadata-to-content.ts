import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { PRODUCT_CONTENT_MODULE } from "../modules/product-content"
import ProductContentModuleService, {
  UpsertProductContentInput,
} from "../modules/product-content/service"
import { IProductModuleService } from "@medusajs/framework/types"

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

    // Map legacy metadata shape to the canonical upsert input
    const input: UpsertProductContentInput = {
      product_id: product.id,
      badge: meta.badge || null,
      sale_label: meta.sale_label || null,
      discount_label: meta.discount_label || null,
      sale_ends_at: meta.sale_ends_at || null,
      original_price: meta.original_price || null,
      trust_badges: Array.isArray(meta.trust_badges)
        ? meta.trust_badges.map((label: string) => ({ label }))
        : undefined,
      stats: Array.isArray(meta.stats) ? meta.stats : undefined,
      features: Array.isArray(meta.features) ? meta.features : undefined,
      course_modules: Array.isArray(meta.modules) ? meta.modules : undefined,
      audience: Array.isArray(meta.audience)
        ? meta.audience.map((text: string) => ({ text }))
        : undefined,
      testimonials: Array.isArray(meta.testimonials) ? meta.testimonials : undefined,
      faqs: Array.isArray(meta.faqs)
        ? meta.faqs.map((f: any) => ({ question: f.q, answer: f.a }))
        : undefined,
    }

    const { content } = await contentService.upsertContent(input)

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
