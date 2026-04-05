import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260405232053 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "product_content" ("id" text not null, "product_id" text not null, "badge" text null, "sale_label" text null, "discount_label" text null, "sale_ends_at" timestamptz null, "original_price" real null, "video_url" text null, "video_thumbnail" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_content_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_content_deleted_at" ON "product_content" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_audience_point" ("id" text not null, "text" text not null, "sort_order" integer not null default 0, "content_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_audience_point_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_audience_point_content_id" ON "product_audience_point" ("content_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_audience_point_deleted_at" ON "product_audience_point" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_course_module" ("id" text not null, "title" text not null, "duration" text null, "lessons" text null, "sort_order" integer not null default 0, "content_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_course_module_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_course_module_content_id" ON "product_course_module" ("content_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_course_module_deleted_at" ON "product_course_module" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_faq" ("id" text not null, "question" text not null, "answer" text not null, "sort_order" integer not null default 0, "content_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_faq_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_faq_content_id" ON "product_faq" ("content_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_faq_deleted_at" ON "product_faq" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_feature" ("id" text not null, "title" text not null, "description" text not null, "sort_order" integer not null default 0, "content_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_feature_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_feature_content_id" ON "product_feature" ("content_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_feature_deleted_at" ON "product_feature" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_stat" ("id" text not null, "value" text not null, "label" text not null, "sort_order" integer not null default 0, "content_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_stat_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_stat_content_id" ON "product_stat" ("content_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_stat_deleted_at" ON "product_stat" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_testimonial" ("id" text not null, "name" text not null, "text" text not null, "rating" integer not null default 5, "sort_order" integer not null default 0, "content_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_testimonial_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_testimonial_content_id" ON "product_testimonial" ("content_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_testimonial_deleted_at" ON "product_testimonial" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_trust_badge" ("id" text not null, "label" text not null, "sort_order" integer not null default 0, "content_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_trust_badge_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_trust_badge_content_id" ON "product_trust_badge" ("content_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_trust_badge_deleted_at" ON "product_trust_badge" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "product_audience_point" add constraint "product_audience_point_content_id_foreign" foreign key ("content_id") references "product_content" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "product_course_module" add constraint "product_course_module_content_id_foreign" foreign key ("content_id") references "product_content" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "product_faq" add constraint "product_faq_content_id_foreign" foreign key ("content_id") references "product_content" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "product_feature" add constraint "product_feature_content_id_foreign" foreign key ("content_id") references "product_content" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "product_stat" add constraint "product_stat_content_id_foreign" foreign key ("content_id") references "product_content" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "product_testimonial" add constraint "product_testimonial_content_id_foreign" foreign key ("content_id") references "product_content" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "product_trust_badge" add constraint "product_trust_badge_content_id_foreign" foreign key ("content_id") references "product_content" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product_audience_point" drop constraint if exists "product_audience_point_content_id_foreign";`);

    this.addSql(`alter table if exists "product_course_module" drop constraint if exists "product_course_module_content_id_foreign";`);

    this.addSql(`alter table if exists "product_faq" drop constraint if exists "product_faq_content_id_foreign";`);

    this.addSql(`alter table if exists "product_feature" drop constraint if exists "product_feature_content_id_foreign";`);

    this.addSql(`alter table if exists "product_stat" drop constraint if exists "product_stat_content_id_foreign";`);

    this.addSql(`alter table if exists "product_testimonial" drop constraint if exists "product_testimonial_content_id_foreign";`);

    this.addSql(`alter table if exists "product_trust_badge" drop constraint if exists "product_trust_badge_content_id_foreign";`);

    this.addSql(`drop table if exists "product_content" cascade;`);

    this.addSql(`drop table if exists "product_audience_point" cascade;`);

    this.addSql(`drop table if exists "product_course_module" cascade;`);

    this.addSql(`drop table if exists "product_faq" cascade;`);

    this.addSql(`drop table if exists "product_feature" cascade;`);

    this.addSql(`drop table if exists "product_stat" cascade;`);

    this.addSql(`drop table if exists "product_testimonial" cascade;`);

    this.addSql(`drop table if exists "product_trust_badge" cascade;`);
  }

}
