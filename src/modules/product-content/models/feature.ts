import { model } from "@medusajs/framework/utils"
import { ProductContent } from "./product-content"

export const ProductFeature = model.define("product_feature", {
  id: model.id().primaryKey(),
  title: model.text().translatable(),
  description: model.text().translatable(),
  sort_order: model.number().default(0),
  content: model.belongsTo(() => ProductContent, {
    mappedBy: "features",
  }),
})

export default ProductFeature
