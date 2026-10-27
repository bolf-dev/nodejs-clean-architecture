# 002 Architecture skeleton and players: tasks

- **Status:** Approved (phases 2 to 6 revised 2026-10-27), in progress
- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

Tasks are done in order, one at a time. Every phase creates only what it uses, ends with green checks and a commit on the `002-players` branch, then stops for review before the next phase starts.

Every command runs through `make`, never on the host.

## Phase 0: Documentation

- [x] **0.1** Commit the constitution, product documents (`mission`, `tech-stack`, `roadmap`), `CLAUDE.md` and the spec, plan and tasks of 002

## Phase 1: Database, ORM and the first migration

- [x] **1.1** Install `@nestjs/config`, `@mikro-orm/core`, `@mikro-orm/postgresql`, `@mikro-orm/nestjs`, `@mikro-orm/migrations` and, as dev dependencies, `@mikro-orm/cli` and `tsx`. Record them in the tech-stack dependency log.
- [x] **1.2** Add `src/config/environment.ts` with the `validate` function (`DATABASE_URL` required, `PORT` default `3000`, `NODE_ENV` default `development`) and register `ConfigModule` as global in `AppModule`.
  - Verify: the app started without `DATABASE_URL` stops with a message naming the variable (T3)
- [x] **1.3** Add `src/database/mikro-orm.config.ts`: PostgreSQL driver, `DATABASE_URL`, explicit list of persistence models, `Migrator` extension, migrations folder `src/database/migrations`
- [x] **1.4** Register `MikroOrmModule.forRootAsync()` in `AppModule` with this config
  - Verify: `make up`, the app starts. MikroORM connects lazily, so the connection itself is verified by `make migrate` in 1.8.
- [x] **1.5** Add `PlayerRecord` in `src/modules/players/infrastructure/persistence/player.record.ts` with `defineEntity`: table `players`, columns `id` (`uuid`, primary key), `nickname` (`varchar(20)`), `created_at`, `updated_at` (`timestamptz`), unique expression index `players_nickname_lower_unique` on `lower(nickname)`
- [x] **1.6** Point the MikroORM CLI to the config and add `make migration`, `make migrate`, `make migrate-down`. Change `make init` to `install`, `up`, `migrate`.
- [x] **1.7** Generate the first migration with `make migration` and review its SQL: table, columns, types, index
  - If the expression index is not generated correctly, switch to the fallback from the plan (`nickname_normalized` column) before continuing
- [x] **1.8** Apply it with `make migrate`
  - Verify: `make psql` and `\d players` show the table and the index; `make migration` again reports no changes
- [x] **1.9** Update the README: new `make` targets
- [x] **1.10** Run the whole phase from scratch: `docker compose down -v` (removes the development database, which holds no data yet), `make init`, `make test`, `make lint`
- [x] **1.11** Commit phase 1

## Phase 2: Creating a player

Created in the order a request travels. The endpoint works only after 2.5.

- [x] **2.1 Controller:** install `class-validator` and `class-transformer` (dependency log). Add `CreatePlayerRequest`, `PlayersController.create` (`POST /v1/players`, `201`, `{ id }`, `Location` header), `PlayersModule`, and the global validation pipe (`APP_PIPE`).
- [x] **2.2 Command:** install `@nestjs/cqrs` (dependency log). Add `CreatePlayerCommand`, register `CqrsModule.forRoot()` in `AppModule`, the controller executes the command through `CommandBus`.
- [x] **2.3 Command handler:** add `CreatePlayerHandler` (`@CommandHandler`) and register it in `PlayersModule`. Id from `randomUUID()`, time from `new Date()`.
- [x] **2.4 Domain:** add `Nickname` (R1, R2, R3, R5), `Player.create` (R7, R8), `InvalidNickname`, `NicknameAlreadyTaken`, and the categories `ValidationError` and `ConflictError` in `shared/domain/errors.ts`
- [x] **2.5 Repository:** add the `PlayerRepository` port (`existsWithNickname`, `save`), `PlayerMapper` (`Player` → `PlayerRecord`), `MikroOrmPlayerRepository` (unique violation → `NicknameAlreadyTaken`). Bind the port in `PlayersModule`.
- [x] **2.6 Errors:** add `ErrorResponseFilter` (`APP_FILTER`): categories → 400 / 409, `HttpException` → its status, anything else → 500 with logging, body `{ "error": … }`
- [x] **2.7 Cleanup:** remove the `Hello World` controller, service and their tests (T6)
- [x] **2.8** Manual check with `curl`: `Bolf` → `201` with id and `Location`; `ab` → `400`; `bolf` again → `409`; `{}` → `400` `nickname must be a string`; unknown route → `404` `{ "error": … }`; the row is in `players`
- [x] **2.9** `make lint` passes. Commit phase 2.

## Phase 3: Tests for creating a player

- [x] **3.1** Unit test `nickname.value-object.spec.ts`: R1, R2, R3 with the boundaries from AC2 to AC4 and the error messages
- [x] **3.2** Unit test `player.aggregate.spec.ts`: `create` sets `createdAt` and `updatedAt`
- [x] **3.3** Add `InMemoryPlayerRepository` and unit test `create-player.handler.spec.ts`: returns the id, saves the player, rejects a taken nickname in any letter case
- [x] **3.4** `make test-e2e`: create the test database when missing, migrate it, run e2e tests against it. Run e2e files one after another.
- [x] **3.5** Add `test/support/test-app.ts` and `test/support/database.ts`
- [x] **3.6** E2E tests in `test/players.e2e-spec.ts`: AC1 to AC7, AC6 with concurrent requests, AC18, AC19
- [x] **3.7** Update the README: how tests use the test database
- [x] **3.8** `make test`, `make test-e2e` twice in a row and `make lint` pass. Commit phase 3.

## Phase 4: Player detail

- [x] **4.1 Controller:** `PlayersController.get` with `ParseUUIDPipe` (`playerId must be a UUID`), `PlayerResponse`
- [x] **4.2 Query:** `GetPlayerQuery`, executed through `QueryBus`
- [x] **4.3 Query handler:** `GetPlayerHandler` (`@QueryHandler`), `PlayerNotFound`, `NotFoundError` category mapped to 404 in the filter
- [x] **4.4 Read model and port:** `PlayerReadModel`, `PlayerQueries` port
- [x] **4.5 SQL adapter:** `SqlPlayerQueries`, bound in `PlayersModule`
- [x] **4.6 Tests:** `InMemoryPlayerQueries`, `get-player.handler.spec.ts`, e2e AC8 to AC10, AC1 uses `GET`
- [x] **4.7** `make test`, `make test-e2e` and `make lint` pass. Commit phase 4.

## Phase 5: Changing the nickname

- [ ] **5.1 Controller:** `PlayersController.changeNickname` (`PATCH`, `204`), `ChangeNicknameRequest`
- [ ] **5.2 Command:** `ChangeNicknameCommand`
- [ ] **5.3 Command handler:** `ChangeNicknameHandler`
- [ ] **5.4 Domain:** `Player.changeNickname` (R6, R8, R9), `Player.reconstitute`, `Nickname.isSameAs`
- [ ] **5.5 Repository:** `findById`, `existsWithNickname(nickname, exceptPlayerId?)`, mapper `PlayerRecord` → `Player`, `save` updates existing players. Update `InMemoryPlayerRepository` too.
- [ ] **5.6 Tests:** unit tests of `changeNickname` and the handler, e2e AC11 to AC17
- [ ] **5.7** `make test`, `make test-e2e` and `make lint` pass. Commit phase 5.

## Phase 6: Layer checks in lint

- [ ] **6.1** Install `dependency-cruiser` as a dev dependency (dependency log)
- [ ] **6.2** Add `.dependency-cruiser.cjs` with the rules from the plan, `npm run lint` runs it after oxlint
- [ ] **6.3** `make lint` passes on the current code. Negative check: a temporary import of `@nestjs/common` in `nickname.value-object.ts` fails with `domain-is-pure`, then it is removed.
- [ ] **6.4** Commit phase 6

## Finish

- [ ] **F.1** Update the README: short architecture overview with links to the constitution and the roadmap
- [ ] **F.2** Check off 002 in the roadmap, set spec, plan and tasks to done
- [ ] **F.3** After approval of the project owner: push the branch and open a pull request
