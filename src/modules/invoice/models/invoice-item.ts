import { model } from "@medusajs/framework/utils"
import { Invoice } from "./invoice"

export const InvoiceItem = model.define("invoice_item", {
  id: model.id().primaryKey(),
  title: model.text(),
  quantity: model.number(),
  unit_price: model.float(),
  total: model.float(),
  tax_amount: model.float(),
  invoice: model.belongsTo(() => Invoice, { mappedBy: "items" }),
})

export default InvoiceItem
