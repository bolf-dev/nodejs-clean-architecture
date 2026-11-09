import { Migration } from '@mikro-orm/migrations';

export class Migration20261106100414 extends Migration {

  override name = 'Migration20261106100414';

  override up(): void | Promise<void> {
    // Players created before spec 004 have no email and password and are removed (R12 of spec 004)
    this.addSql(`delete from "players";`);
    this.addSql(`alter table "players" add "email" varchar(254) not null, add "password_hash" varchar(255) not null;`);
    this.addSql(`alter table "players" add constraint "players_email_unique" unique ("email");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "players" drop constraint "players_email_unique";`);
    this.addSql(`alter table "players" drop column "email", drop column "password_hash";`);
  }

}
