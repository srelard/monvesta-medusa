import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260406034845 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table if exists "invoice_item" add column if not exists "sku" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "invoice_item" drop column if exists "sku";`);
  }
}
