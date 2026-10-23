# 002 Architecture skeleton and players: plan

- **Status:** Approved (2026-10-23)
- **Spec:** [spec.md](spec.md)

This plan describes **how** the [spec](spec.md) is implemented. The work is split into seven small phases. Every phase ends with a working app, green tests and its own commit, and is reviewed before the next one starts.

| Phase | Result                                      | Spec items        |
|-------|---------------------------------------------|-------------------|
| 1     | Database, ORM and the first migration       | T1, T2, T3        |
| 2     | Domain: `Nickname` and `Player`             | R1–R5, R7, R8     |
| 3     | Endpoint to create a player                 | AC1–AC7, AC18, AC19, T6 |
| 4     | Functional tests for creating a player      | AC1–AC7, AC18, AC19, T4 |
| 5     | Player detail (read side)                   | AC8–AC10          |
| 6     | Changing the nickname                       | R6, R9, AC11–AC17 |
| 7     | Layer checks in lint                        | T5                |

## Overview

```
HTTP request
  → PlayersController (presentation)          checks the request shape with DTOs
  → CommandBus / QueryBus (@nestjs/cqrs)
  → command and query handlers (application)
  → ports: PlayerRepository, PlayerQueries, IdGenerator, Clock
  → adapters: MikroORM repository, SQL queries, UUID v7, system clock (infrastructure)
  → PostgreSQL
```

- **Write side:** command handlers work with the `Player` aggregate and save it through `PlayerRepository`.
- **Read side:** the query handler reads a flat `PlayerReadModel` through `PlayerQueries` with plain SQL and never touches the aggregate.

## Target folder structure

What `src/` and `test/` look like after phase 7. Each phase below lists the files it adds.

```
src/
  main.ts
  app.module.ts                                   root composition: config, database, CQRS, global pipe and filter, modules
  config/
    environment.ts                                environment variables and their validation
  database/
    mikro-orm.config.ts                           shared by the app and the MikroORM CLI
    migrations/

  shared/
    domain/
      aggregate-root.ts                           records domain events
      domain-event.ts
      errors.ts                                   error categories
    application/
      clock.port.ts
      id-generator.port.ts
    infrastructure/
      system-clock.ts
      fixed-clock.ts
      uuid-v7-id-generator.ts
      fixed-id-generator.ts
      shared-infrastructure.module.ts
    presentation/
      http/
        error-response.filter.ts
        validation.pipe.ts

  modules/
    players/
      players.module.ts                           binds the module's ports to adapters
      domain/
        nickname.value-object.ts
        player.aggregate.ts
        player.errors.ts
        player.repository.port.ts
        events/
          player-created.event.ts
          nickname-changed.event.ts
      application/
        commands/
          create-player/
            create-player.command.ts
            create-player.handler.ts
          change-nickname/
            change-nickname.command.ts
            change-nickname.handler.ts
        queries/
          get-player/
            get-player.query.ts
            get-player.handler.ts
        ports/
          player-queries.port.ts
        player.read-model.ts
        player.errors.ts
      infrastructure/
        persistence/
          player.record.ts
          player.mapper.ts
          mikro-orm-player.repository.ts
          sql-player-queries.ts
        in-memory/
          in-memory-player.repository.ts
          in-memory-player-queries.ts
      presentation/
        http/
          players.controller.ts
          create-player.request.ts
          change-nickname.request.ts
          player.response.ts

test/
  players.e2e-spec.ts
  support/
    test-app.ts
    database.ts

.dependency-cruiser.cjs
```

Naming: files in kebab-case with a role suffix (`.aggregate.ts`, `.value-object.ts`, `.port.ts`, `.handler.ts`, `.request.ts`, `.response.ts`). Ports are named after their role (`PlayerRepository`), adapters after their technology (`MikroOrmPlayerRepository`).

---

## Phase 1: Database, ORM and the first migration

**Goal:** the app connects to PostgreSQL through MikroORM, and the `players` table is created by a committed migration.

### Packages

- Runtime: `@nestjs/config`, `@mikro-orm/core`, `@mikro-orm/postgresql`, `@mikro-orm/nestjs`, `@mikro-orm/migrations`
- Dev: `@mikro-orm/cli`, `tsx` (loader the CLI uses to read the TypeScript config)

### Configuration (T3)

- `src/config/environment.ts`: a `validate` function for `@nestjs/config`
- Variables: `DATABASE_URL` (required), `PORT` (default `3000`), `NODE_ENV` (default `development`)
- A missing or invalid variable stops the app at startup with a message naming the variable

### MikroORM

- `src/database/mikro-orm.config.ts` reads `DATABASE_URL`, lists the persistence models explicitly, enables the `Migrator` extension and sets the migrations folder. The app and the CLI use the same file.
- `AppModule` registers `MikroOrmModule.forRootAsync()` with this config.
- `src/modules/players/infrastructure/persistence/player.record.ts`: the persistence model, defined with MikroORM's `defineEntity`. It lives in infrastructure. The domain `Player` from phase 2 has no ORM code.

### Table `players`

| Column       | Type          | Notes                                      |
|--------------|---------------|--------------------------------------------|
| `id`         | `uuid`        | primary key, UUID v7 from the application  |
| `nickname`   | `varchar(20)` | as entered (R5)                            |
| `created_at` | `timestamptz` |                                            |
| `updated_at` | `timestamptz` |                                            |

Unique index `players_nickname_lower_unique` on `lower(nickname)` enforces R4 in the database, also for concurrent requests (AC6). It is declared in the mapping as an expression index, so the schema diff matches the migrations.

### Makefile

| Target              | What it does                                                         |
|---------------------|----------------------------------------------------------------------|
| `make migration`    | creates a new migration from the difference between mapping and database |
| `make migrate`      | applies pending migrations                                           |
| `make migrate-down` | reverts the last migration                                           |
| `make init`         | now `install`, `up`, `migrate` (T1)                                  |

### Done when

- `make init` on an empty database volume ends with the `players` table and the migrations table in the database (`make psql`, `\d players`)
- The app starts and still responds. Without `DATABASE_URL` it refuses to start with a clear message.
- `make migration` right after `make migrate` reports no changes

---

## Phase 2: Domain

**Goal:** the business rules of a player in plain TypeScript, covered by unit tests. No NestJS, no database.

### Shared kernel

- `shared/domain/aggregate-root.ts`: base class that records domain events, `pullDomainEvents()` returns and clears them
- `shared/domain/domain-event.ts`: base class with `occurredAt`
- `shared/domain/errors.ts`: error categories, each mapped to a status code in phase 3

| Category                | Status | Used by                 |
|-------------------------|--------|-------------------------|
| `ValidationError`       | 400    | `InvalidNickname`       |
| `NotFoundError`         | 404    | `PlayerNotFound`        |
| `ConflictError`         | 409    | `NicknameAlreadyTaken`  |
| `BusinessRuleViolation` | 422    | not used yet            |

### `Nickname` value object

- `Nickname.create(raw: string)`: trims whitespace (R1), checks the length 3 to 20 (R2), then the characters `^[A-Za-z0-9_-]+$` (R3). Throws `InvalidNickname` with the messages from the spec.
- `value`: the nickname as entered after trimming (R5)
- `isSameAs(other)`: exact comparison, used for R9
- `matchesIgnoringCase(other)`: case-insensitive comparison, used for R4 and R6
- Immutable, private constructor

### `Player` aggregate

- Properties: `id`, `nickname` (`Nickname`), `createdAt`, `updatedAt`. No setters.
- `Player.create({ id, nickname, now })`: `createdAt` and `updatedAt` are both `now` (R7, R8). Records `PlayerCreated`. Id and time are passed in by the application.
- `Player.reconstitute(props)`: rebuilds a stored player for the mapper, records no events
- `changeNickname` is added in phase 6

### Files

`shared/domain/*`, `modules/players/domain/nickname.value-object.ts`, `player.aggregate.ts`, `player.errors.ts`, `events/player-created.event.ts`, and unit tests next to them.

### Done when

- `make test` passes with tests for R1, R2, R3 including the boundaries from AC2 to AC4, both comparisons of `Nickname`, and `Player.create` / `reconstitute`

---

## Phase 3: Endpoint to create a player

**Goal:** `POST /v1/players` works through all layers.

### Packages

- Runtime: `@nestjs/cqrs`, `class-validator`, `class-transformer`, `uuid`

### Ports and adapters

- `shared/application/clock.port.ts`: `abstract class Clock { now(): Date }`. Adapters `SystemClock` and `FixedClock` (tests).
- `shared/application/id-generator.port.ts`: `abstract class IdGenerator { generate(): string }`. Adapters `UuidV7IdGenerator` (`v7()` from `uuid`, Node.js has no built-in UUID v7) and `FixedIdGenerator` (tests).
- `shared/infrastructure/shared-infrastructure.module.ts`: global module binding `Clock` and `IdGenerator`
- `players/domain/player.repository.port.ts`:

```ts
export abstract class PlayerRepository {
  abstract existsWithNickname(nickname: Nickname): Promise<boolean>; // case-insensitive
  abstract save(player: Player): Promise<void>;                     // insert or update
}
```

- `MikroOrmPlayerRepository`: `save` converts the player with `PlayerMapper` and upserts the record by id. A unique violation on the nickname index becomes `NicknameAlreadyTaken`.
- `InMemoryPlayerRepository`: for handler unit tests, applies the same case-insensitive uniqueness

### `CreatePlayerHandler`

1. `Nickname.create(command.nickname)`, may throw `InvalidNickname` → 400
2. `existsWithNickname` → `NicknameAlreadyTaken` → 409 (AC5)
3. `Player.create({ id: idGenerator.generate(), nickname, now: clock.now() })`
4. `save(player)`. When two requests pass step 2 at the same time, the unique index rejects the second one, which also ends as `NicknameAlreadyTaken` (AC6).
5. `eventBus.publishAll(player.pullDomainEvents())`. `PlayerCreated` has no subscriber yet, publishing is set up for later features.
6. Returns `{ id }`

### Presentation

- `PlayersController.create`: body `CreatePlayerRequest`, executes `CreatePlayerCommand`, returns `201` with `{ id }` and `Location: /v1/players/{id}`
- `CreatePlayerRequest`: `nickname` with `@IsString()`. A missing value or a number gives `nickname must be a string` (AC7). Length and characters are business rules in `Nickname`, not in the DTO.
- Global `ValidationPipe` (`whitelist`, `transform`) whose error returns the first constraint message
- Global `ErrorResponseFilter`:
  - error categories from phase 2 → their status code
  - NestJS `HttpException` (validation pipe, unknown routes) → its own status (AC18)
  - anything else → `500` with `Internal server error`, the error and stack are logged (AC19)
  - body always `{ "error": "<message>" }`
- The pipe and the filter are registered as `APP_PIPE` and `APP_FILTER` in `AppModule`, so e2e tests behave exactly like the running app.

### Cleanup (T6)

`src/app.controller.ts`, `src/app.service.ts`, `src/app.controller.spec.ts` and `test/app.e2e-spec.ts` are removed.

### Tests

`create-player.handler.spec.ts` with `InMemoryPlayerRepository`, `FixedClock`, `FixedIdGenerator` and a recording event bus: returns the id, saves the player with the clock time, publishes `PlayerCreated`, rejects a taken nickname in any letter case.

### Done when

- `make test` passes
- Manual check with `curl`: `201` with an id and `Location`, `400` for `ab`, `409` for a taken nickname, `404` with `{ "error": … }` for an unknown route

---

## Phase 4: Functional tests for creating a player

**Goal:** the acceptance criteria of creating a player are verified against a real database.

### Test database (T4)

- `make test-e2e` creates the database `${DB_NAME}_test` through `psql` in the `db` container when it does not exist, applies migrations to it and runs the e2e tests with `DATABASE_URL` pointing to it
- An init script in `docker-entrypoint-initdb.d` is not used, because it only runs on an empty volume and the development volume already exists
- E2E tests need the `db` service, so this target does not use `--no-deps`
- `vitest.config.e2e.ts`: test files run one after another, because they share the database

### Support

- `test/support/test-app.ts`: builds the Nest app from `AppModule`, optionally with overridden providers
- `test/support/database.ts`: clears all tables except the migrations table before each test

### Tests in `test/players.e2e-spec.ts`

- AC1 to AC7, one test each. AC1 checks the `Location` header and the id format, and reads the row through the database, because `GET` comes only in phase 5.
- AC6: two `POST` requests with the same nickname at the same time with `Promise.all`, expecting one `201` and one `409`
- AC18: unknown route returns `404` with `{ "error": … }`
- AC19: `PlayerRepository` overridden with an adapter that throws, expecting `500` and no internal details

### Done when

- `make test-e2e` passes and can be run repeatedly

---

## Phase 5: Player detail (read side)

**Goal:** `GET /v1/players/{playerId}` through the read side of CQRS.

### Read side

- `players/application/player.read-model.ts`: `{ id, nickname, createdAt, updatedAt }`
- `players/application/ports/player-queries.port.ts`:

```ts
export abstract class PlayerQueries {
  abstract findById(id: string): Promise<PlayerReadModel | null>;
}
```

- `SqlPlayerQueries`: one `select id, nickname, created_at, updated_at from players where id = ?` through the entity manager's connection. It does not use `PlayerRecord` or the `Player` aggregate.
- `InMemoryPlayerQueries`: for handler unit tests
- `GetPlayerHandler`: `null` → `PlayerNotFound` → 404

### Presentation

- `PlayersController.get`: `ParseUUIDPipe` with the message `playerId must be a UUID` (AC10), executes `GetPlayerQuery`, maps the read model to `PlayerResponse` with times as ISO 8601 strings
- AC1 in the e2e tests switches from reading the database to `GET` on the `Location` header

### Tests

- `get-player.handler.spec.ts`: returns the read model, throws `PlayerNotFound`
- E2E: AC8, AC9, AC10

### Done when

- `make test` and `make test-e2e` pass

---

## Phase 6: Changing the nickname

**Goal:** `PATCH /v1/players/{playerId}`, the full write cycle of DDD: load the aggregate, call a domain method, save it, publish the event.

### Domain

- `Player.changeNickname(nickname, now)`:
  - same nickname exactly (`isSameAs`) → nothing changes, no event (R9)
  - otherwise sets the nickname, `updatedAt = now`, records `NicknameChanged` with the old and new nickname (R6, R8)
- `events/nickname-changed.event.ts`

### Repository

`PlayerRepository` gets two changes, only what this phase needs:

```ts
abstract findById(id: string): Promise<Player | null>;
abstract existsWithNickname(nickname: Nickname, exceptPlayerId?: string): Promise<boolean>;
```

`exceptPlayerId` lets a player change only the letter case of their own nickname (R6).

### `ChangeNicknameHandler`

1. `findById` → `PlayerNotFound` → 404
2. `Nickname.create(command.nickname)` → `InvalidNickname` → 400
3. `existsWithNickname(nickname, player.id)` → `NicknameAlreadyTaken` → 409
4. `player.changeNickname(nickname, clock.now())`
5. `save(player)`, unique violation from a concurrent change also ends as `NicknameAlreadyTaken`
6. `eventBus.publishAll(player.pullDomainEvents())`
7. Returns nothing

### Presentation

- `PlayersController.changeNickname`: `ParseUUIDPipe`, body `ChangeNicknameRequest` (`nickname` with `@IsString()`), executes `ChangeNicknameCommand`, returns `204`

### Tests

- `player.aggregate.spec.ts`: `changeNickname` changes the nickname and `updatedAt` and records the event; the same nickname changes nothing
- `change-nickname.handler.spec.ts`: success, case change of own nickname, taken nickname, unknown player
- E2E: AC11 to AC17. AC11 and AC15 use `FixedClock` overrides, so `updatedAt` can be compared exactly.

### Done when

- `make test` and `make test-e2e` pass

---

## Phase 7: Layer checks in lint

**Goal:** breaking a dependency rule of the constitution fails `make lint` (T5).

### Packages

- Dev: `dependency-cruiser`

### Rules in `.dependency-cruiser.cjs`

| Rule                              | Forbids                                                                                       |
|-----------------------------------|-----------------------------------------------------------------------------------------------|
| `domain-is-pure`                  | `*/domain/**` importing anything outside the `domain` of its own module and `shared/domain`, including any npm package |
| `application-only-di-and-cqrs`    | `*/application/**` importing `infrastructure`, `presentation`, or npm packages other than `@nestjs/common` and `@nestjs/cqrs` |
| `presentation-not-infrastructure` | `*/presentation/**` importing `*/infrastructure/**`                                           |
| `modules-are-isolated`            | `modules/<a>/**` importing `modules/<b>/**`                                                   |
| `shared-not-modules`              | `shared/**` importing `modules/**`                                                            |
| `no-circular`                     | circular imports                                                                              |

Module files (`*.module.ts`), `app.module.ts`, `main.ts`, `config/` and `database/` are the composition root and may import every layer.

`npm run lint` runs oxlint and then dependency-cruiser.

### Done when

- `make lint` passes on the current code
- A temporary import of `@nestjs/common` into `nickname.value-object.ts` makes `make lint` fail with the `domain-is-pure` rule. The import is then removed.

---

## Dependencies

Each one is recorded in the [tech-stack dependency log](../../product/tech-stack.md#dependency-log) in the phase that installs it.

| Package                                                                                     | Type    | Phase | Reason                                     |
|---------------------------------------------------------------------------------------------|---------|-------|--------------------------------------------|
| `@nestjs/config`                                                                            | runtime | 1     | configuration from environment variables   |
| `@mikro-orm/core`, `@mikro-orm/postgresql`, `@mikro-orm/nestjs`, `@mikro-orm/migrations`    | runtime | 1     | ORM and migrations                         |
| `@mikro-orm/cli`, `tsx`                                                                     | dev     | 1     | migration commands with a TypeScript config |
| `@nestjs/cqrs`                                                                              | runtime | 3     | command, query and event buses             |
| `class-validator`, `class-transformer`                                                      | runtime | 3     | request DTO validation                     |
| `uuid`                                                                                      | runtime | 3     | UUID v7                                    |
| `dependency-cruiser`                                                                        | dev     | 7     | layer checks                               |

## Constitution check

| Article                 | How this plan follows it                                                                     |
|-------------------------|----------------------------------------------------------------------------------------------|
| 2 Modules               | `players` module in `src/modules/players`, shared kernel in `src/shared`                     |
| 3 Layers                | domain without imports, application only with `@nestjs/common` and `@nestjs/cqrs`, checked by dependency-cruiser in phase 7 |
| 4 Ports and adapters    | `PlayerRepository` in the domain, `PlayerQueries`, `Clock`, `IdGenerator` in the application, all abstract classes with in-memory or fixed adapters |
| 5 CQRS                  | one handler per command and query, the query never loads the aggregate, commands return only the id or nothing |
| 6 Domain model          | `Player` always valid, no setters, id and time passed in, events published after saving, separate persistence model and mapper |
| 7 API conventions       | `/v1`, request shape in DTOs, business rules in `Nickname` and `Player`, one filter maps all errors |
| 8 Testing               | unit tests for every rule, e2e tests for every endpoint against PostgreSQL, fixed clock      |
| 9 Tooling               | all commands through `make` in containers, dependencies recorded in tech-stack               |

## Risks and things to verify

- **Expression index in the mapping (phase 1):** if MikroORM's schema diff does not handle the `lower(nickname)` index cleanly, the fallback is a `nickname_normalized` column with a plain unique index, filled by the mapper. The behavior from the spec stays the same.
- **MikroORM 7 is new:** the `defineEntity`, `upsert` and migrator APIs are checked against the installed version, not against older documentation.
- **CLI loader (phase 1):** if `tsx` does not work with the MikroORM CLI in the container, another supported loader (`jiti`, `swc`) is used.
