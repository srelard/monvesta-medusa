import { model } from "@medusajs/framework/utils"
import { ProductContent } from "./product-content"

export const ProductTestimonial = model.define("product_testimonial", {
  id: model.id().primaryKey(),
  name: model.text(),
  text: model.text().translatable(),
  rating: model.number().default(5),
  sort_order: model.number().default(0),
  content: model.belongsTo(() => ProductContent, {
    mappedBy: "testimonials",
  }),
})

export default ProductTestimonial
