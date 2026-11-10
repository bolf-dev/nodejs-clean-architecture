import { Migration } from '@mikro-orm/migrations';

export class Migration20261110074534 extends Migration {

  override name = 'Migration20261110074534';

  override up(): void | Promise<void> {
    this.addSql(`create table "predictions" ("id" uuid not null, "player_id" uuid not null, "race_id" uuid not null, "pole" varchar(3) not null, "p1" varchar(3) not null, "p2" varchar(3) not null, "p3" varchar(3) not null, "submitted_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "predictions" add constraint "predictions_player_race_unique" unique ("player_id", "race_id");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "predictions" cascade;`);
  }

}
