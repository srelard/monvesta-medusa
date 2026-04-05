import { model } from "@medusajs/framework/utils"
import { ProductContent } from "./product-content"

export const ProductAudiencePoint = model.define("product_audience_point", {
  id: model.id().primaryKey(),
  text: model.text().translatable(),
  sort_order: model.number().default(0),
  content: model.belongsTo(() => ProductContent, {
    mappedBy: "audience",
  }),
})

export default ProductAudiencePoint
