import { Migration } from '@mikro-orm/migrations';

export class Migration20261023121629 extends Migration {

  override name = 'Migration20261023121629';

  override up(): void | Promise<void> {
    this.addSql(`create table "players" ("id" uuid not null, "nickname" varchar(20) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create unique index "players_nickname_lower_unique" on "players" (lower("nickname"));`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "players" cascade;`);
  }

}
