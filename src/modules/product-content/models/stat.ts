import { model } from "@medusajs/framework/utils"
import { ProductContent } from "./product-content"

export const ProductStat = model.define("product_stat", {
  id: model.id().primaryKey(),
  value: model.text().translatable(),
  label: model.text().translatable(),
  sort_order: model.number().default(0),
  content: model.belongsTo(() => ProductContent, {
    mappedBy: "stats",
  }),
})

export default ProductStat
