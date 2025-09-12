import { Migration } from '@mikro-orm/migrations';

export class Migration20250912183336 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "auth_otps" ("id" serial primary key, "email" varchar(128) not null, "code" varchar(8) not null, "expires_at" timestamptz not null, "attempts" int not null default 0, "consumed" boolean not null default false, "created_at" timestamptz not null);`);
    this.addSql(`create index "auth_otps_email_index" on "auth_otps" ("email");`);

    this.addSql(`alter table "users" add column "role" text check ("role" in ('super_admin', 'admin', 'user')) not null default 'user';`);
    this.addSql(`alter table "users" alter column "gender" type text using ("gender"::text);`);
    this.addSql(`alter table "users" alter column "dob" type timestamptz using ("dob"::timestamptz);`);
    this.addSql(`alter table "users" alter column "nationality" type varchar(255) using ("nationality"::varchar(255));`);
    this.addSql(`alter table "users" alter column "religion" type varchar(255) using ("religion"::varchar(255));`);
    this.addSql(`alter table "users" alter column "avatar_url" type varchar(255) using ("avatar_url"::varchar(255));`);
    this.addSql(`alter table "users" alter column "password_hash" type varchar(255) using ("password_hash"::varchar(255));`);
    this.addSql(`alter table "users" alter column "created_at" drop default;`);
    this.addSql(`alter table "users" alter column "created_at" type timestamptz using ("created_at"::timestamptz);`);
    this.addSql(`alter table "users" alter column "updated_at" drop default;`);
    this.addSql(`alter table "users" alter column "updated_at" type timestamptz using ("updated_at"::timestamptz);`);
    this.addSql(`alter table "users" add constraint "users_gender_check" check("gender" in ('male', 'female', 'other'));`);
    this.addSql(`alter table "users" drop constraint "users_email_key";`);
    this.addSql(`alter table "users" add constraint "users_email_unique" unique ("email");`);
    this.addSql(`alter table "users" drop constraint "users_phone_key";`);
    this.addSql(`alter table "users" add constraint "users_phone_unique" unique ("phone");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "auth_otps" cascade;`);

    this.addSql(`alter table "users" drop constraint if exists "users_gender_check";`);

    this.addSql(`alter table "users" drop column "role";`);

    this.addSql(`alter table "users" alter column "gender" type varchar(255) using ("gender"::varchar(255));`);
    this.addSql(`alter table "users" alter column "dob" type date using ("dob"::date);`);
    this.addSql(`alter table "users" alter column "nationality" type varchar using ("nationality"::varchar);`);
    this.addSql(`alter table "users" alter column "religion" type varchar using ("religion"::varchar);`);
    this.addSql(`alter table "users" alter column "avatar_url" type varchar using ("avatar_url"::varchar);`);
    this.addSql(`alter table "users" alter column "password_hash" type varchar using ("password_hash"::varchar);`);
    this.addSql(`alter table "users" alter column "created_at" type timestamp(6) using ("created_at"::timestamp(6));`);
    this.addSql(`alter table "users" alter column "created_at" set default CURRENT_TIMESTAMP;`);
    this.addSql(`alter table "users" alter column "updated_at" type timestamp(6) using ("updated_at"::timestamp(6));`);
    this.addSql(`alter table "users" alter column "updated_at" set default CURRENT_TIMESTAMP;`);
    this.addSql(`alter table "users" drop constraint "users_email_unique";`);
    this.addSql(`alter table "users" add constraint "users_email_key" unique ("email");`);
    this.addSql(`alter table "users" drop constraint "users_phone_unique";`);
    this.addSql(`alter table "users" add constraint "users_phone_key" unique ("phone");`);
  }

}
