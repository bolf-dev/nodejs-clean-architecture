import { Migration } from '@mikro-orm/migrations';

export class Migration20261109160329 extends Migration {

  override name = 'Migration20261109160329';

  override up(): void | Promise<void> {
    this.addSql(`create table "races" ("id" uuid not null, "season" int not null, "round" int not null, "name" varchar(100) not null, "circuit" varchar(100) not null, "locality" varchar(100) not null, "country" varchar(100) not null, "sprint_qualifying_at" timestamptz null, "qualifying_at" timestamptz not null, "race_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`alter table "races" add constraint "races_season_round_unique" unique ("season", "round");`);

    this.addSql(`create table "season_drivers" ("id" uuid not null, "season" int not null, "external_id" varchar(50) not null, "code" varchar(3) not null, "number" int not null, "first_name" varchar(100) not null, "last_name" varchar(100) not null, "team_id" varchar(50) null, "team_name" varchar(100) null, primary key ("id"));`);
    this.addSql(`alter table "season_drivers" add constraint "season_drivers_season_external_id_unique" unique ("season", "external_id");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "races" cascade;`);
    this.addSql(`drop table if exists "season_drivers" cascade;`);
  }

}
