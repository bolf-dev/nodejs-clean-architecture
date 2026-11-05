# nodejs-clean-architecture

NestJS 12 / Node.js 24 / PostgreSQL 18 showcase of Clean Architecture, CQRS and ports & adapters, running fully in Docker.

The application is the backend of an **F1 Prediction League**: players predict the pole position and the podium of every Grand Prix and are scored after the race. See the [mission](docs/product/mission.md) for the game rules and the [roadmap](docs/product/roadmap.md) for what is done and what comes next.

## Getting started

Requirements: Docker with Docker Compose, `make`. Node.js on the host is **not** needed, every command runs in a container.

```shell
make init   # builds the image, installs dependencies, starts the app with PostgreSQL, applies migrations
```

Try it:

```shell
curl -i -X POST http://localhost:3000/v1/players \
  -H 'content-type: application/json' \
  -d '{"nickname": "JohnDoe"}'
```

The app runs in watch mode, changes in `src/` are picked up automatically.

## API

| Method  | Path                       | Description                          | Success                          |
|---------|----------------------------|--------------------------------------|----------------------------------|
| `POST`  | `/v1/players`              | Create a player `{ "nickname": … }`  | `201` `{ "id" }`, `Location` header |
| `GET`   | `/v1/players/{playerId}`   | Player detail                        | `200` `{ "id", "nickname", "createdAt", "updatedAt" }` |
| `PATCH` | `/v1/players/{playerId}`   | Change the nickname `{ "nickname": … }` | `204`                         |

Errors have the body `{ "error": "<message>" }`: `400` invalid input, `404` unknown player, `409` nickname taken, `500` unexpected error. The full contract is in the [spec of 002](docs/specs/002-players/spec.md#api-contract).

## Architecture

The code follows the rules in the [constitution](docs/constitution.md). Each bounded context is a NestJS module in `src/modules/<context>/` with four layers, code shared by all modules lives in `src/shared/`.

| Layer            | Contains                                                              | Depends on                                  |
|------------------|-----------------------------------------------------------------------|---------------------------------------------|
| `domain`         | Aggregates, value objects, domain errors, repository ports            | nothing                                     |
| `application`    | Commands, queries and their handlers (use cases), read models, ports  | `domain`, NestJS DI and `@nestjs/cqrs`      |
| `infrastructure` | Adapters of the ports: MikroORM repository, SQL queries, in-memory    | `application`, `domain`, any library        |
| `presentation`   | HTTP controllers, request and response DTOs                           | `application`, NestJS                       |

Writes and reads take different paths (CQRS, as in the [NestJS CQRS recipe](https://docs.nestjs.com/recipes/cqrs)):

```
Write  POST, PATCH /v1/players                Read  GET /v1/players/{playerId}
  → PlayersController                           → PlayersController
  → CommandBus → command handler                → QueryBus → query handler
  → Nickname, Player (domain rules)             → PlayerQueries port
  → PlayerRepository port                       → SQL straight into a read model
  → MikroORM adapter → players table            → players table
```

The project is built with spec-driven development: every feature has a spec, a plan and tasks in [`docs/specs/`](docs/specs/), approved before any code is written.

## Commands

| Command                       | Description                                         |
|-------------------------------|-----------------------------------------------------|
| `make up`                     | Start the app on http://localhost:3000 with the DB  |
| `make down`                   | Stop the app                                        |
| `make logs`                   | Follow app logs                                     |
| `make install`                | Install npm dependencies from `package-lock.json`   |
| `make npm c="install <pkg>"`  | Run any npm command in the container                |
| `make migration`              | Create a migration from the mapping changes         |
| `make migrate`                | Apply pending migrations                            |
| `make migrate-down`           | Revert the last migration                           |
| `make test`                   | Run unit tests                                      |
| `make test-e2e`               | Run e2e tests against the test database             |
| `make lint`                   | Lint the code                                       |
| `make format`                 | Format the code                                     |
| `make shell`                  | Shell inside the app container                      |
| `make psql`                   | `psql` console of the running database              |
| `make prod-build`             | Build the production image                          |

## Tests

- **Unit tests** (`make test`): `*.spec.ts` files next to the code. They test the domain and the handlers without NestJS and without a database, using in-memory adapters of the ports.
- **E2E tests** (`make test-e2e`): `*.e2e-spec.ts` files in `test/`. They start the whole app and send real HTTP requests. They run against a separate database `<DB_NAME>_test` in the same PostgreSQL container, which `make test-e2e` creates and migrates when needed. Every test starts with empty tables, the development database is never touched.

## Configuration

Ports and database credentials have defaults in `compose.yaml`. To override them, copy `.env.example` to `.env`.

The app validates its environment variables at startup (`src/config/environment.ts`) and refuses to start when `DATABASE_URL` is missing or invalid.

The database schema is changed only through migrations in `src/database/migrations/`.

| Service    | Host port | Notes                                                      |
|------------|-----------|------------------------------------------------------------|
| app        | 3000      | debugger on 9229 (`npm run start:debug`)                   |
| PostgreSQL | 5432      | user / password / database: `app` / `app` / `app`          |

## Docker images

`.docker/Dockerfile` is a multi-stage build:

- `development`: used by `compose.yaml`, source code and `node_modules` are bind-mounted from the project directory
- `production`: compiled `dist/` with runtime dependencies only, running as the non-root `node` user
