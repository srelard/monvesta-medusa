import { model } from "@medusajs/framework/utils"
import { ProductContent } from "./product-content"

export const ProductCourseModule = model.define("product_course_module", {
  id: model.id().primaryKey(),
  title: model.text().translatable(),
  duration: model.text().translatable().nullable(),
  lessons: model.text().translatable().nullable(),
  sort_order: model.number().default(0),
  content: model.belongsTo(() => ProductContent, {
    mappedBy: "course_modules",
  }),
})

export default ProductCourseModule
