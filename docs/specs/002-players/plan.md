# 002 Architecture skeleton and players: plan

- **Status:** Approved (revised 2026-10-27)
- **Spec:** [spec.md](spec.md)

This plan describes **how** the [spec](spec.md) is implemented. The work is split into small phases. Every phase creates only what it uses itself, ends with a working app and its own commit, and is reviewed before the next one starts.

| Phase | Result                                                    | Spec items                      |
|-------|-----------------------------------------------------------|---------------------------------|
| 1     | Database, ORM and the first migration (done)              | T1, T2, T3                      |
| 2     | Creating a player: `POST /v1/players`                     | R1–R5, R7, R8, T6               |
| 3     | Tests for creating a player                               | AC1–AC7, AC18, AC19, T4         |
| 4     | Player detail: `GET /v1/players/{playerId}`               | AC8–AC10                        |
| 5     | Changing the nickname: `PATCH /v1/players/{playerId}`     | R6, R9, AC11–AC17               |
| 6     | Layer checks in lint                                      | T5                              |

## CQRS with `@nestjs/cqrs`

The plan follows the [NestJS CQRS recipe](https://docs.nestjs.com/recipes/cqrs):

- `CqrsModule.forRoot()` in `AppModule`
- A **command** is a class with the data of a state-changing action. It extends `Command<T>` when it returns a value.
- A **command handler** is decorated with `@CommandHandler(…)`, implements `ICommandHandler` and is registered as a provider of its module. It is the use case: it runs the steps of the action, the business rules themselves live in the domain.
- A **query** extends `Query<T>`, its **query handler** is decorated with `@QueryHandler(…)`.
- Controllers call `CommandBus.execute()` and `QueryBus.execute()` directly, there is no service in between.
- Events, `AggregateRoot`, `EventPublisher` and sagas are optional in the recipe and are not used in 002, because nothing reacts to a player change yet.

```
Write side                                    Read side
POST, PATCH /v1/players                       GET /v1/players/{playerId}
  → PlayersController                           → PlayersController
  → CommandBus                                  → QueryBus
  → command handler (application)               → query handler (application)
  → Nickname, Player (domain)                   → PlayerQueries port
  → PlayerRepository port                       → SqlPlayerQueries (infrastructure)
  → MikroOrmPlayerRepository (infrastructure)   → SELECT, no domain objects
  → players table                               → players table
```

---

## Phase 1: Database, ORM and the first migration (done)

Environment validation (`src/config/environment.ts`), MikroORM configuration (`src/database/mikro-orm.config.ts`), persistence model `PlayerRecord`, migration with the `players` table (`id`, `nickname`, `created_at`, `updated_at`) and the unique index on `lower(nickname)`, `make migration`, `make migrate`, `make migrate-down`.

---

## Phase 2: Creating a player

**Goal:** `POST /v1/players` works. The files are created in the order a request travels through the app. The endpoint works only after the whole path (2.1 to 2.5) exists.

### 2.1 Controller

- `players/presentation/http/players.controller.ts`: `PlayersController.create` for `POST /v1/players`. Returns `201` with `{ id }` and the header `Location: /v1/players/{id}`.
- `players/presentation/http/create-player.request.ts`: `nickname` with `@IsString()`, so a missing value or a number gives `nickname must be a string` (AC7). Length and characters are business rules of the domain, not of the DTO.
- `shared/presentation/http/validation.pipe.ts`: global `ValidationPipe` (`whitelist`, `transform`) whose error contains the first constraint message, registered as `APP_PIPE` in `AppModule`
- `players/players.module.ts`: registers the controller, imported in `AppModule`
- Packages: `class-validator`, `class-transformer`

### 2.2 Command

- `players/application/commands/create-player/create-player.command.ts`: `CreatePlayerCommand extends Command<{ id: string }>` with the raw `nickname`
- `CqrsModule.forRoot()` in `AppModule`
- Package: `@nestjs/cqrs`

### 2.3 Command handler

- `players/application/commands/create-player/create-player.handler.ts`, registered in `PlayersModule`:
  1. `Nickname.create(command.nickname)`, may throw `InvalidNickname` → 400
  2. `playerRepository.existsWithNickname(nickname)` → `NicknameAlreadyTaken` → 409 (AC5)
  3. `Player.create({ id: randomUUID(), nickname, now: new Date() })`
  4. `playerRepository.save(player)`
  5. returns `{ id }`
- The id and the time are created by the handler with Node.js built-ins (`randomUUID()` from `node:crypto`, `new Date()`) and passed to the domain.

### 2.4 Domain

- `players/domain/nickname.value-object.ts`: `Nickname.create(raw)` trims whitespace (R1), checks the length 3 to 20 (R2) and the characters `^[A-Za-z0-9_-]+$` (R3), throws `InvalidNickname` with the messages from the spec. `value` returns the nickname as entered after trimming (R5). Immutable, private constructor.
- `players/domain/player.aggregate.ts`: `Player.create({ id, nickname, now })` sets `createdAt` and `updatedAt` to `now` (R7, R8). Read-only properties, no setters.
- `players/domain/player.errors.ts`: `InvalidNickname`, `NicknameAlreadyTaken`
- `shared/domain/errors.ts`: error categories `ValidationError` (400) and `ConflictError` (409). Plain TypeScript, the domain knows nothing about HTTP.

### 2.5 Repository

- `players/domain/player.repository.port.ts`:

```ts
export abstract class PlayerRepository {
  abstract existsWithNickname(nickname: Nickname): Promise<boolean>; // case-insensitive
  abstract save(player: Player): Promise<void>;
}
```

- `players/infrastructure/persistence/player.mapper.ts`: `Player` → `PlayerRecord`
- `players/infrastructure/persistence/mikro-orm-player.repository.ts`: `existsWithNickname` compares with `lower(nickname)`, `save` inserts the record. A unique violation on the nickname index (two requests at the same time, AC6) becomes `NicknameAlreadyTaken`.
- `PlayersModule` binds `PlayerRepository` to `MikroOrmPlayerRepository` and registers `PlayerRecord` with `MikroOrmModule.forFeature()`.

### 2.6 Errors on the way back

- `shared/presentation/http/error-response.filter.ts`, registered as `APP_FILTER` in `AppModule`:
  - `ValidationError` → 400, `ConflictError` → 409
  - NestJS `HttpException` (validation pipe, unknown routes) → its own status (AC18)
  - anything else → 500 with `Internal server error`, the error is logged with its stack (AC19)
  - body always `{ "error": "<message>" }`

### 2.7 Cleanup (T6)

`src/app.controller.ts`, `src/app.service.ts`, `src/app.controller.spec.ts` and `test/app.e2e-spec.ts` are removed.

### Done when

Manual check with `curl`: `Bolf` → `201` with an id and `Location`; `ab` → `400`; `bolf` again → `409`; `{}` → `400` with `nickname must be a string`; unknown route → `404` with `{ "error": … }`. The row is in the `players` table. `make lint` passes.

---

## Phase 3: Tests for creating a player

**Goal:** the rules and acceptance criteria of creating a player are covered by automated tests.

### Unit tests (no NestJS, no database)

- `nickname.value-object.spec.ts`: R1, R2, R3 with the boundaries from AC2 to AC4, error messages
- `player.aggregate.spec.ts`: `create` sets `createdAt` and `updatedAt` to the given time
- `create-player.handler.spec.ts`: returns the id, saves the player, rejects a taken nickname in any letter case. Uses `InMemoryPlayerRepository` (`players/infrastructure/in-memory/in-memory-player.repository.ts`), the in-memory adapter of the `PlayerRepository` port.

### Functional tests (real PostgreSQL)

- `make test-e2e` creates the `${DB_NAME}_test` database when it does not exist, migrates it, and runs the e2e tests with `DATABASE_URL` pointing to it (T4). An init script in `docker-entrypoint-initdb.d` is not used, because it runs only on an empty volume.
- `vitest.config.e2e.ts` runs e2e test files one after another, because they share the database.
- `test/support/test-app.ts`: builds the app from `AppModule`, optionally with overridden providers
- `test/support/database.ts`: clears all tables except the migrations table before each test
- `test/players.e2e-spec.ts`: AC1 to AC7 (AC1 reads the stored row from the database, `GET` comes in phase 4), AC6 with two concurrent requests, AC18, AC19 with `PlayerRepository` overridden by an adapter that throws

### Done when

`make test`, `make test-e2e` (twice in a row) and `make lint` pass.

---

## Phase 4: Player detail

**Goal:** `GET /v1/players/{playerId}` through the read side. The domain is not involved.

In the order of the request:

1. **Controller:** `PlayersController.get` with `ParseUUIDPipe` and the message `playerId must be a UUID` (AC10); `players/presentation/http/player.response.ts` with times as ISO 8601 strings
2. **Query:** `players/application/queries/get-player/get-player.query.ts`: `GetPlayerQuery extends Query<PlayerReadModel>`
3. **Query handler:** `get-player.handler.ts` with `@QueryHandler`, `null` → `PlayerNotFound` → 404 (AC9)
4. **Read model and port:** `players/application/player.read-model.ts` (`id`, `nickname`, `createdAt`, `updatedAt`), `players/application/ports/player-queries.port.ts` (`findById`), `PlayerNotFound` and the `NotFoundError` category (404) in the filter
5. **SQL adapter:** `players/infrastructure/persistence/sql-player-queries.ts`: one `select` through the entity manager's connection, without `PlayerRecord` and without the aggregate

Tests: `get-player.handler.spec.ts` with `InMemoryPlayerQueries`, e2e AC8 to AC10, AC1 switches to `GET` on the `Location` header.

---

## Phase 5: Changing the nickname

**Goal:** `PATCH /v1/players/{playerId}`: load the aggregate, call a domain method, save it.

In the order of the request:

1. **Controller:** `PlayersController.changeNickname` with `ParseUUIDPipe`, `change-nickname.request.ts` (`nickname` with `@IsString()`), returns `204`
2. **Command:** `ChangeNicknameCommand` with `playerId` and `nickname`
3. **Command handler:** `findById` → `PlayerNotFound`; `Nickname.create`; `existsWithNickname(nickname, player.id)` → `NicknameAlreadyTaken`; `player.changeNickname(nickname, new Date())`; `save(player)`
4. **Domain:** `Player.changeNickname(nickname, now)`: exactly the same nickname changes nothing (R9), otherwise sets the nickname and `updatedAt` (R6, R8). `Nickname.isSameAs()` for the exact comparison. `Player.reconstitute()` to rebuild a stored player.
5. **Repository:** port gets `findById` and the optional `exceptPlayerId` of `existsWithNickname`, so a player can change only the letter case of their own nickname (R6). The mapper gets the direction `PlayerRecord` → `Player`, `save` updates an existing player.

Tests: unit tests of `changeNickname` and the handler, e2e AC11 to AC17. AC11 and AC15 check `updatedAt` against the time before and after the request.

---

## Phase 6: Layer checks in lint

**Goal:** breaking a dependency rule of the constitution fails `make lint` (T5).

- Dev package `dependency-cruiser`, configuration in `.dependency-cruiser.cjs`, run by `npm run lint` after oxlint

| Rule                              | Forbids                                                                                       |
|-----------------------------------|-----------------------------------------------------------------------------------------------|
| `domain-is-pure`                  | `*/domain/**` importing anything outside the `domain` of its own module and `shared/domain`, including any npm package |
| `application-only-di-and-cqrs`    | `*/application/**` importing `infrastructure`, `presentation`, or npm packages other than `@nestjs/common` and `@nestjs/cqrs` |
| `presentation-not-infrastructure` | `*/presentation/**` importing `*/infrastructure/**`                                           |
| `modules-are-isolated`            | `modules/<a>/**` importing `modules/<b>/**`                                                   |
| `shared-not-modules`              | `shared/**` importing `modules/**`                                                            |
| `no-circular`                     | circular imports                                                                              |

Module files (`*.module.ts`), `app.module.ts`, `main.ts`, `config/` and `database/` are the composition root and may import every layer.

Done when `make lint` passes, and a temporary import of `@nestjs/common` in `nickname.value-object.ts` makes it fail with `domain-is-pure`.

---

## Dependencies

| Package                                | Type    | Phase | Reason                          |
|----------------------------------------|---------|-------|---------------------------------|
| `class-validator`, `class-transformer` | runtime | 2     | request DTO validation          |
| `@nestjs/cqrs`                         | runtime | 2     | command and query buses         |
| `dependency-cruiser`                   | dev     | 6     | layer checks                    |

Phase 1 dependencies are already recorded in the [tech-stack dependency log](../../product/tech-stack.md#dependency-log).

## Constitution check

| Article                 | How this plan follows it                                                                     |
|-------------------------|----------------------------------------------------------------------------------------------|
| 1 Workflow              | every phase creates only what it uses                                                        |
| 2 Modules               | `players` module in `src/modules/players`, shared code in `src/shared`                       |
| 3 Layers                | domain without imports, application only with `@nestjs/common`, `@nestjs/cqrs` and Node.js built-ins, checked in phase 6 |
| 4 Ports and adapters    | `PlayerRepository` in the domain, `PlayerQueries` in the application, abstract classes with in-memory adapters for tests |
| 5 CQRS                  | `@nestjs/cqrs` commands and queries, one handler each, the query never loads the aggregate   |
| 6 Domain model          | `Player` always valid, no setters, id and time passed in by the handler, separate persistence model and mapper |
| 7 API conventions       | `/v1`, request shape in DTOs, business rules in `Nickname` and `Player`, one filter maps all errors |
| 8 Testing               | unit tests for every rule, e2e tests for every endpoint against PostgreSQL                   |
| 9 Tooling               | all commands through `make` in containers, dependencies recorded in tech-stack               |
