import { MedusaService } from "@medusajs/framework/utils"
import { ProductContent } from "./models/product-content"
import { ProductTrustBadge } from "./models/trust-badge"
import { ProductStat } from "./models/stat"
import { ProductFeature } from "./models/feature"
import { ProductCourseModule } from "./models/course-module"
import { ProductAudiencePoint } from "./models/audience-point"
import { ProductTestimonial } from "./models/testimonial"
import { ProductFaq } from "./models/faq"

class ProductContentModuleService extends MedusaService({
  ProductContent,
  ProductTrustBadge,
  ProductStat,
  ProductFeature,
  ProductCourseModule,
  ProductAudiencePoint,
  ProductTestimonial,
  ProductFaq,
}) {}

export default ProductContentModuleService
