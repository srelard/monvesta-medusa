import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260706000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table if exists "invoice" add column if not exists "customer_country_code" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "invoice" drop column if exists "customer_country_code";`);
  }
}
