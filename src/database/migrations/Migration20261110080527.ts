import { Migration } from '@mikro-orm/migrations';

export class Migration20261110080527 extends Migration {

  override name = 'Migration20261110080527';

  override up(): void | Promise<void> {
    // Predictions with only the pole position (before the amendment of spec 007) are removed; they were development data only
    this.addSql(`delete from "predictions";`);
    this.addSql(`alter table "predictions" drop column "p1", drop column "p2", drop column "p3", drop column "pole";`);
    this.addSql(`alter table "predictions" add "qualifying_p1" varchar(3) not null, add "qualifying_p2" varchar(3) not null, add "qualifying_p3" varchar(3) not null, add "race_p1" varchar(3) not null, add "race_p2" varchar(3) not null, add "race_p3" varchar(3) not null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`delete from "predictions";`);
    this.addSql(`alter table "predictions" drop column "qualifying_p1", drop column "qualifying_p2", drop column "qualifying_p3", drop column "race_p1", drop column "race_p2", drop column "race_p3";`);
    this.addSql(`alter table "predictions" add "p1" varchar(3) not null, add "p2" varchar(3) not null, add "p3" varchar(3) not null, add "pole" varchar(3) not null;`);
  }

}
