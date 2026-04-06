import { model } from "@medusajs/framework/utils"
import { InvoiceItem } from "./invoice-item"

export enum InvoiceStatus {
  PENDING = "pending",
  GENERATED = "generated",
  FAILED = "failed",
}

export const Invoice = model.define("invoice", {
  id: model.id().primaryKey(),
  year: model.number(),
  display_id: model.number(),
  invoice_number: model.text(),
  order_id: model.text(),
  issued_at: model.dateTime(),
  // Customer
  customer_email: model.text(),
  customer_name: model.text(),
  customer_address: model.text(),
  customer_vat_id: model.text().nullable(),
  // Amounts
  subtotal: model.float(),
  tax_total: model.float(),
  total: model.float(),
  tax_rate: model.float().default(19),
  currency_code: model.text().default("eur"),
  // PDF
  file_url: model.text().nullable(),
  file_key: model.text().nullable(),
  status: model.enum(InvoiceStatus).default(InvoiceStatus.PENDING),
  // Relations
  items: model.hasMany(() => InvoiceItem, { mappedBy: "invoice" }),
}).cascades({
  delete: ["items"],
}).indexes([
  { on: ["invoice_number"], unique: true },
  { on: ["order_id"] },
  { on: ["year", "display_id"], unique: true },
])

export default Invoice
