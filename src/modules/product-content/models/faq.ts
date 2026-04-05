import { model } from "@medusajs/framework/utils"
import { ProductContent } from "./product-content"

export const ProductFaq = model.define("product_faq", {
  id: model.id().primaryKey(),
  question: model.text().translatable(),
  answer: model.text().translatable(),
  sort_order: model.number().default(0),
  content: model.belongsTo(() => ProductContent, {
    mappedBy: "faqs",
  }),
})

export default ProductFaq
