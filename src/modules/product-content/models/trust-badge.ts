import { model } from "@medusajs/framework/utils"
import { ProductContent } from "./product-content"

export const ProductTrustBadge = model.define("product_trust_badge", {
  id: model.id().primaryKey(),
  label: model.text().translatable(),
  sort_order: model.number().default(0),
  content: model.belongsTo(() => ProductContent, {
    mappedBy: "trust_badges",
  }),
})

export default ProductTrustBadge
