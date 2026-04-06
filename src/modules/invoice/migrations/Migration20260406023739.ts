import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260406023739 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "invoice" drop constraint if exists "invoice_year_display_id_unique";`);
    this.addSql(`alter table if exists "invoice" drop constraint if exists "invoice_invoice_number_unique";`);
    this.addSql(`create table if not exists "invoice" ("id" text not null, "year" integer not null, "display_id" integer not null, "invoice_number" text not null, "order_id" text not null, "issued_at" timestamptz not null, "customer_email" text not null, "customer_name" text not null, "customer_address" text not null, "customer_vat_id" text null, "subtotal" real not null, "tax_total" real not null, "total" real not null, "tax_rate" real not null default 19, "currency_code" text not null default 'eur', "file_url" text null, "file_key" text null, "status" text check ("status" in ('pending', 'generated', 'failed')) not null default 'pending', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "invoice_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_invoice_deleted_at" ON "invoice" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_invoice_invoice_number_unique" ON "invoice" ("invoice_number") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_invoice_order_id" ON "invoice" ("order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_invoice_year_display_id_unique" ON "invoice" ("year", "display_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "invoice_config" ("id" text not null, "company_name" text not null, "company_address" text not null, "company_city" text not null, "company_postal_code" text not null, "company_country" text not null default 'Deutschland', "company_email" text not null, "company_phone" text null, "company_vat_id" text not null, "company_registration" text null, "managing_director" text not null, "bank_name" text not null, "bank_iban" text not null, "bank_bic" text not null, "logo_url" text null, "invoice_prefix" text not null default 'RE', "default_tax_rate" real not null default 19, "footer_text" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "invoice_config_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_invoice_config_deleted_at" ON "invoice_config" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "invoice_item" ("id" text not null, "title" text not null, "quantity" integer not null, "unit_price" real not null, "total" real not null, "tax_amount" real not null, "invoice_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "invoice_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_invoice_item_invoice_id" ON "invoice_item" ("invoice_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_invoice_item_deleted_at" ON "invoice_item" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "invoice_item" add constraint "invoice_item_invoice_id_foreign" foreign key ("invoice_id") references "invoice" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "invoice_item" drop constraint if exists "invoice_item_invoice_id_foreign";`);

    this.addSql(`drop table if exists "invoice" cascade;`);

    this.addSql(`drop table if exists "invoice_config" cascade;`);

    this.addSql(`drop table if exists "invoice_item" cascade;`);
  }

}
