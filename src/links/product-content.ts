import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import ProductContentModule from "../modules/product-content"

export default defineLink(
  ProductModule.linkable.product,
  {
    linkable: ProductContentModule.linkable.productContent,
    deleteCascade: true,
  }
)
