import { defineLink } from "@medusajs/framework/utils"
import OrderModule from "@medusajs/medusa/order"
import InvoiceModule from "../modules/invoice"

export default defineLink(
  OrderModule.linkable.order,
  {
    linkable: InvoiceModule.linkable.invoice,
    isList: true,
  }
)
