import {
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { z } from "zod"

/**
 * Request-body validation for the custom admin routes.
 * Unknown keys are stripped (zod default), so arbitrary fields can't be
 * injected into module updates.
 */

const upsertProductContentSchema = z.object({
  badge: z.string().nullish(),
  sale_label: z.string().nullish(),
  discount_label: z.string().nullish(),
  sale_ends_at: z.string().nullish(),
  original_price: z.union([z.number(), z.string()]).nullish(),
  video_url: z.string().nullish(),
  video_thumbnail: z.string().nullish(),
  trust_badges: z.array(z.object({ label: z.string() })).optional(),
  stats: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  features: z
    .array(z.object({ title: z.string(), description: z.string() }))
    .optional(),
  course_modules: z
    .array(
      z.object({
        title: z.string(),
        duration: z.string().nullish(),
        lessons: z.string().nullish(),
      })
    )
    .optional(),
  audience: z.array(z.object({ text: z.string() })).optional(),
  testimonials: z
    .array(
      z.object({
        name: z.string(),
        text: z.string(),
        rating: z.number().min(1).max(5).optional(),
      })
    )
    .optional(),
  faqs: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .optional(),
})

const invoiceConfigSchema = z
  .object({
    company_name: z.string(),
    company_address: z.string(),
    company_city: z.string(),
    company_postal_code: z.string(),
    company_country: z.string(),
    company_email: z.string(),
    company_phone: z.string().nullish(),
    company_vat_id: z.string(),
    company_registration: z.string().nullish(),
    managing_director: z.string(),
    bank_name: z.string(),
    bank_iban: z.string(),
    bank_bic: z.string(),
    logo_url: z.string().nullish(),
    invoice_prefix: z.string(),
    default_tax_rate: z.number(),
    footer_text: z.string().nullish(),
  })
  .partial()

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/products/:id/content",
      method: "POST",
      middlewares: [validateAndTransformBody(upsertProductContentSchema)],
    },
    {
      matcher: "/admin/invoice-config",
      method: "POST",
      middlewares: [validateAndTransformBody(invoiceConfigSchema)],
    },
  ],
})
