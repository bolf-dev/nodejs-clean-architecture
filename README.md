# nodejs-clean-architecture

NestJS 12 / Node.js 24 / PostgreSQL 18 showcase of Clean Architecture, CQRS and ports & adapters, running fully in Docker.

The application is an **F1 Prediction League**: players predict the pole position and the podium of every Grand Prix and are scored after the race. See the [mission](docs/product/mission.md) for the game rules and the [roadmap](docs/product/roadmap.md) for what is done and what comes next.

## Getting started

Requirements: Docker with Docker Compose, `make`. Node.js on the host is **not** needed, every command runs in a container.

```shell
make init   # builds the image, installs dependencies, starts the app with PostgreSQL, applies migrations
```

Open the frontend at http://localhost:5173 to register and log in, or call the API directly:

```shell
# Register
curl -i -X POST http://localhost:3000/v1/players \
  -H 'content-type: application/json' \
  -d '{"email": "johndoe@example.com", "nickname": "JohnDoe", "password": "correct-horse"}'

# Log in, then send the access token to every other endpoint
TOKEN=$(curl -s -X POST http://localhost:3000/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email": "johndoe@example.com", "password": "correct-horse"}' | sed 's/.*"accessToken":"\([^"]*\)".*/\1/')
curl -i http://localhost:3000/v1/players/me -H "Authorization: Bearer $TOKEN"
```

The backend runs in watch mode and the frontend in the Vite dev server, so changes in `src/` and `frontend/src/` are picked up automatically.

## API

| Method  | Path                       | Token | Description                                         | Success                          |
|---------|----------------------------|-------|-----------------------------------------------------|----------------------------------|
| `POST`  | `/v1/players`              | no    | Register `{ "email", "nickname", "password" }`      | `201` `{ "id" }`, `Location` header |
| `POST`  | `/v1/auth/login`           | no    | Log in `{ "email", "password" }`                    | `200` `{ "accessToken", "expiresAt" }` |
| `GET`   | `/v1/players`              | yes   | All players, ordered by nickname                    | `200` `{ "players": [{ "id", "nickname" }] }` |
| `GET`   | `/v1/players/me`           | yes   | The logged-in player, with the email                | `200` `{ "id", "email", "nickname", "createdAt", "updatedAt" }` |
| `PATCH` | `/v1/players/me`           | yes   | Change my nickname `{ "nickname": … }`              | `204`                            |
| `GET`   | `/v1/players/{playerId}`   | yes   | Another player's profile, without the email         | `200` `{ "id", "nickname", "createdAt", "updatedAt" }` |

Endpoints with a token need the header `Authorization: Bearer <accessToken>`.

Errors have the body `{ "error": "<message>" }`: `400` invalid input, `401` missing or invalid token or wrong login, `404` unknown player, `409` email or nickname taken, `500` unexpected error. The full contracts are in the specs of [002](docs/specs/002-players/spec.md#api-contract) and [004](docs/specs/004-authentication/spec.md#api-contract).

## Authentication

- Players register with an email, a nickname and a password. The password is stored only as a salted `scrypt` hash (`node:crypto`).
- Logging in returns a JWT access token valid for 7 days, signed with `JWT_SECRET`. There are no refresh tokens and no server-side sessions; logging out only forgets the token in the browser.
- A global guard (`AccessTokenGuard`, registered as `APP_GUARD`) protects every endpoint of every module. Endpoints without a token are marked `@Public()`, and controllers get the logged-in player with `@CurrentPlayerId()`.
- The guard does not touch infrastructure: it asks `AuthenticateQuery` through the `QueryBus`, like a controller. Logging in is a query too, because it changes no state.

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

## Frontend

A Vue 3 + TypeScript single page app in `frontend/`, styled like Formula 1 TV graphics: login (`/login`), registration (`/register`), my profile with changing the nickname (`/`), the list of all players (`/players`) and other players' profiles (`/players/{playerId}`).

- **Dev server:** Vite in the `frontend` compose service on http://localhost:5173 with hot reload
- **API:** calls go to `/v1/…` on the same origin; Vite forwards them to the backend, so no CORS setup is needed
- **No extra libraries:** `fetch` for HTTP, plain CSS with design tokens in `frontend/src/assets/styles/`
- **Rules stay in the backend:** the frontend shows the API's error messages and only blocks empty fields
- **Session:** the access token is kept in `localStorage` and sent as a Bearer token; a router guard shows logged-out visitors only login and registration, and a `401` opens the login screen again

## Commands

| Command                       | Description                                         |
|-------------------------------|-----------------------------------------------------|
| `make up`                     | Start the API, the frontend and the DB              |
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
| `make frontend-logs`          | Follow frontend logs                                |
| `make frontend-npm c="…"`     | Run any npm command in the frontend container       |
| `make frontend-lint`          | Lint and type check the frontend                    |

## Tests

- **Unit tests** (`make test`): `*.spec.ts` files next to the code. They test the domain and the handlers without NestJS and without a database, using in-memory adapters of the ports.
- **E2E tests** (`make test-e2e`): `*.e2e-spec.ts` files in `test/`. They start the whole app and send real HTTP requests. They run against a separate database `<DB_NAME>_test` in the same PostgreSQL container, which `make test-e2e` creates and migrates when needed. Every test starts with empty tables, the development database is never touched.

## Configuration

Ports and database credentials have defaults in `compose.yaml`. To override them, copy `.env.example` to `.env`.

The app validates its environment variables at startup (`src/config/environment.ts`) and refuses to start when `DATABASE_URL` is missing or invalid, or `JWT_SECRET` is missing or shorter than 32 characters. `compose.yaml` sets a development-only `JWT_SECRET`.

The database schema is changed only through migrations in `src/database/migrations/`.

| Service    | Host port | Notes                                                      |
|------------|-----------|------------------------------------------------------------|
| app        | 3000      | debugger on 9229 (`npm run start:debug`)                   |
| frontend   | 5173      | Vite dev server, `FRONTEND_PORT`                           |
| PostgreSQL | 5432      | user / password / database: `app` / `app` / `app`          |

## Docker images

`.docker/Dockerfile` is a multi-stage build:

- `development`: used by `compose.yaml`, source code and `node_modules` are bind-mounted from the project directory
- `production`: compiled `dist/` with runtime dependencies only, running as the non-root `node` user

The frontend has no Dockerfile: the `frontend` service runs the official `node:24-alpine` image with `frontend/` bind-mounted.
