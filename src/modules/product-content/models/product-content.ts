import { model } from "@medusajs/framework/utils"
import { ProductTrustBadge } from "./trust-badge"
import { ProductStat } from "./stat"
import { ProductFeature } from "./feature"
import { ProductCourseModule } from "./course-module"
import { ProductAudiencePoint } from "./audience-point"
import { ProductTestimonial } from "./testimonial"
import { ProductFaq } from "./faq"

export const ProductContent = model.define("product_content", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  badge: model.text().translatable().nullable(),
  sale_label: model.text().translatable().nullable(),
  discount_label: model.text().translatable().nullable(),
  sale_ends_at: model.dateTime().nullable(),
  original_price: model.float().nullable(),
  video_url: model.text().nullable(),
  video_thumbnail: model.text().nullable(),
  trust_badges: model.hasMany(() => ProductTrustBadge, {
    mappedBy: "content",
  }),
  stats: model.hasMany(() => ProductStat, {
    mappedBy: "content",
  }),
  features: model.hasMany(() => ProductFeature, {
    mappedBy: "content",
  }),
  course_modules: model.hasMany(() => ProductCourseModule, {
    mappedBy: "content",
  }),
  audience: model.hasMany(() => ProductAudiencePoint, {
    mappedBy: "content",
  }),
  testimonials: model.hasMany(() => ProductTestimonial, {
    mappedBy: "content",
  }),
  faqs: model.hasMany(() => ProductFaq, {
    mappedBy: "content",
  }),
}).cascades({
  delete: [
    "trust_badges",
    "stats",
    "features",
    "course_modules",
    "audience",
    "testimonials",
    "faqs",
  ],
})

export default ProductContent
