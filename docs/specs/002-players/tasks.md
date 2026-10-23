# 002 Architecture skeleton and players: tasks

- **Status:** Approved (2026-10-23), in progress
- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

Tasks are done in order, one at a time. Every phase ends with green checks and a commit on the `002-players` branch, then stops for review before the next phase starts.

Every command runs through `make`, never on the host.

## Phase 0: Documentation

- [x] **0.1** Commit the constitution, product documents (`mission`, `tech-stack`, `roadmap`), `CLAUDE.md` and the spec, plan and tasks of 002

## Phase 1: Database, ORM and the first migration

- [ ] **1.1** Install `@nestjs/config`, `@mikro-orm/core`, `@mikro-orm/postgresql`, `@mikro-orm/nestjs`, `@mikro-orm/migrations` and, as dev dependencies, `@mikro-orm/cli` and `tsx`. Record them in the tech-stack dependency log.
- [ ] **1.2** Add `src/config/environment.ts` with the `validate` function (`DATABASE_URL` required, `PORT` default `3000`, `NODE_ENV` default `development`) and register `ConfigModule` as global in `AppModule`.
  - Verify: the app started without `DATABASE_URL` stops with a message naming the variable (T3)
- [ ] **1.3** Add `src/database/mikro-orm.config.ts`: PostgreSQL driver, `DATABASE_URL`, explicit list of persistence models, `Migrator` extension, migrations folder `src/database/migrations`
- [ ] **1.4** Register `MikroOrmModule.forRootAsync()` in `AppModule` with this config
  - Verify: `make up`, the app log shows a successful database connection
- [ ] **1.5** Add `PlayerRecord` in `src/modules/players/infrastructure/persistence/player.record.ts` with `defineEntity`: table `players`, columns `id` (`uuid`, primary key), `nickname` (`varchar(20)`), `created_at`, `updated_at` (`timestamptz`), unique expression index `players_nickname_lower_unique` on `lower(nickname)`
- [ ] **1.6** Point the MikroORM CLI to the config and add `make migration`, `make migrate`, `make migrate-down`. Change `make init` to `install`, `up`, `migrate`.
- [ ] **1.7** Generate the first migration with `make migration` and review its SQL: table, columns, types, index
  - If the expression index is not generated correctly, switch to the fallback from the plan (`nickname_normalized` column) before continuing
- [ ] **1.8** Apply it with `make migrate`
  - Verify: `make psql` and `\d players` show the table and the index; `make migration` again reports no changes
- [ ] **1.9** Update the README: new `make` targets
- [ ] **1.10** Run the whole phase from scratch: `docker compose down -v` (removes the development database, which holds no data yet), `make init`, `make test`, `make lint`
- [ ] **1.11** Commit phase 1

## Phase 2: Domain

- [ ] **2.1** Add `shared/domain/domain-event.ts` and `shared/domain/aggregate-root.ts` with `pullDomainEvents()`, with a unit test
- [ ] **2.2** Add the error categories in `shared/domain/errors.ts`: `ValidationError`, `NotFoundError`, `ConflictError`, `BusinessRuleViolation`
- [ ] **2.3** Add the `Nickname` value object and `InvalidNickname` in `modules/players/domain/`, with a unit test:
  - R1 trimming
  - R2 length with the boundaries `ab` / `abc` and 20 / 21 characters
  - R3 characters: `bolf!`, `bo lf`, `bölf` rejected; `bolf_97`, `bolf-dev` accepted
  - error messages exactly as in the spec
  - `isSameAs` and `matchesIgnoringCase`
- [ ] **2.4** Add the `Player` aggregate and `PlayerCreated` event, with a unit test:
  - `create` sets `createdAt` and `updatedAt` to the given time and records `PlayerCreated`
  - `reconstitute` records no events
- [ ] **2.5** `make test` and `make lint` pass. Commit phase 2.

## Phase 3: Endpoint to create a player

- [ ] **3.1** Install `@nestjs/cqrs`, `class-validator`, `class-transformer`, `uuid`. Record them in the dependency log.
- [ ] **3.2** Add the `Clock` and `IdGenerator` ports in `shared/application/`, adapters `SystemClock`, `FixedClock`, `UuidV7IdGenerator`, `FixedIdGenerator` in `shared/infrastructure/`, and the global `SharedInfrastructureModule`. Unit test: `UuidV7IdGenerator` returns a valid version 7 UUID.
- [ ] **3.3** Add the `PlayerRepository` port (`existsWithNickname`, `save`) and the `NicknameAlreadyTaken` error
- [ ] **3.4** Add `PlayerMapper` with a unit test: `Player` → record → `Player` keeps all values
- [ ] **3.5** Add `MikroOrmPlayerRepository`: case-insensitive `existsWithNickname`, `save` as an upsert by id, unique violation on the nickname index → `NicknameAlreadyTaken`
- [ ] **3.6** Add `InMemoryPlayerRepository` with the same case-insensitive uniqueness
- [ ] **3.7** Add `CreatePlayerCommand` and `CreatePlayerHandler`, with a unit test using the in-memory repository, `FixedClock`, `FixedIdGenerator` and a recording event bus:
  - returns the id
  - saves the player with the clock time
  - publishes `PlayerCreated`
  - rejects a taken nickname in any letter case
- [ ] **3.8** Add `ErrorResponseFilter` and the validation pipe in `shared/presentation/http/`. Register them as `APP_FILTER` and `APP_PIPE`, and `CqrsModule` in `AppModule`.
- [ ] **3.9** Add `CreatePlayerRequest` and `PlayersController.create` (`201`, `{ id }`, `Location` header). Add `PlayersModule` binding the ports to the adapters and import it in `AppModule`.
- [ ] **3.10** Remove `src/app.controller.ts`, `src/app.service.ts`, `src/app.controller.spec.ts` and `test/app.e2e-spec.ts` (T6)
- [ ] **3.11** Manual check with `curl`:
  - `Bolf` → `201` with an id and `Location`
  - `ab` → `400`
  - `bolf` again → `409`
  - `{}` → `400` with `nickname must be a string`
  - unknown route → `404` with `{ "error": … }`
- [ ] **3.12** `make test` and `make lint` pass. Commit phase 3.

## Phase 4: Functional tests for creating a player

- [ ] **4.1** Change `make test-e2e`: create the `${DB_NAME}_test` database when it does not exist, migrate it, run the e2e tests with `DATABASE_URL` pointing to it
- [ ] **4.2** Run e2e test files one after another in `vitest.config.e2e.ts`
- [ ] **4.3** Add `test/support/test-app.ts` (app from `AppModule`, optional provider overrides) and `test/support/database.ts` (clears all tables except the migrations table)
- [ ] **4.4** E2E tests in `test/players.e2e-spec.ts` for AC1 to AC5 and AC7. AC1 reads the stored row from the database.
- [ ] **4.5** E2E test for AC6: two concurrent requests with the same nickname, one `201` and one `409`
- [ ] **4.6** E2E tests for AC18 (unknown route) and AC19 (`PlayerRepository` overridden with an adapter that throws, `500` without internal details)
- [ ] **4.7** Update the README: how tests use the test database
- [ ] **4.8** `make test-e2e` passes twice in a row, `make test` and `make lint` pass. Commit phase 4.

## Phase 5: Player detail (read side)

- [ ] **5.1** Add `PlayerReadModel`, the `PlayerQueries` port and the `PlayerNotFound` error in `modules/players/application/`
- [ ] **5.2** Add `SqlPlayerQueries` (plain SQL, no `PlayerRecord`, no aggregate) and `InMemoryPlayerQueries`
- [ ] **5.3** Add `GetPlayerQuery` and `GetPlayerHandler`, with a unit test: returns the read model, throws `PlayerNotFound`
- [ ] **5.4** Add `PlayerResponse` and `PlayersController.get` with `ParseUUIDPipe` and the message `playerId must be a UUID`. Bind `PlayerQueries` in `PlayersModule`.
- [ ] **5.5** E2E tests for AC8, AC9, AC10. AC1 switches from reading the database to `GET` on the `Location` header.
- [ ] **5.6** `make test`, `make test-e2e` and `make lint` pass. Commit phase 5.

## Phase 6: Changing the nickname

- [ ] **6.1** Add the `NicknameChanged` event and `Player.changeNickname(nickname, now)`, with unit tests:
  - a new nickname changes `nickname` and `updatedAt` and records `NicknameChanged`
  - the same nickname changes nothing and records no event (R9)
- [ ] **6.2** Extend the `PlayerRepository` port with `findById` and `existsWithNickname(nickname, exceptPlayerId?)`. Update both adapters.
- [ ] **6.3** Add `ChangeNicknameCommand` and `ChangeNicknameHandler`, with a unit test:
  - success
  - letter case change of the own nickname
  - nickname taken by another player
  - unknown player
- [ ] **6.4** Add `ChangeNicknameRequest` and `PlayersController.changeNickname` (`204`)
- [ ] **6.5** E2E tests for AC11 to AC17. AC11 and AC15 override `Clock` with `FixedClock` to compare `updatedAt` exactly.
- [ ] **6.6** `make test`, `make test-e2e` and `make lint` pass. Commit phase 6.

## Phase 7: Layer checks in lint

- [ ] **7.1** Install `dependency-cruiser` as a dev dependency. Record it in the dependency log.
- [ ] **7.2** Add `.dependency-cruiser.cjs` with the rules from the plan: `domain-is-pure`, `application-only-di-and-cqrs`, `presentation-not-infrastructure`, `modules-are-isolated`, `shared-not-modules`, `no-circular`
- [ ] **7.3** Make `npm run lint` run oxlint and then dependency-cruiser
  - Verify: `make lint` passes on the current code
- [ ] **7.4** Negative check: temporarily import `@nestjs/common` in `nickname.value-object.ts`, `make lint` fails with `domain-is-pure`. Remove the import.
- [ ] **7.5** Commit phase 7

## Finish

- [ ] **F.1** Update the README: short architecture overview (modules, layers, CQRS) with links to the constitution and the roadmap
- [ ] **F.2** Check off 002 in the roadmap and set the status of spec, plan and tasks to done
- [ ] **F.3** After approval of the project owner: push the branch and open a pull request
