# nodejs-clean-architecture

NestJS 12 / Node.js 24 / PostgreSQL 18 showcase of Clean Architecture, CQRS and ports & adapters, running fully in Docker.

## Getting started

Requirements: Docker with Docker Compose, `make`. Node.js on the host is **not** needed, every command runs in a container.

```shell
make init   # builds the image, installs dependencies, starts the app with PostgreSQL
```

Try it:

```shell
curl http://localhost:3000
```

The app runs in watch mode, changes in `src/` are picked up automatically.

## Commands

| Command                       | Description                                         |
|-------------------------------|-----------------------------------------------------|
| `make up`                     | Start the app on http://localhost:3000 with the DB  |
| `make down`                   | Stop the app                                        |
| `make logs`                   | Follow app logs                                     |
| `make install`                | Install npm dependencies from `package-lock.json`   |
| `make npm c="install <pkg>"`  | Run any npm command in the container                |
| `make test`                   | Run unit tests                                      |
| `make test-e2e`               | Run e2e tests                                       |
| `make lint`                   | Lint the code                                       |
| `make format`                 | Format the code                                     |
| `make shell`                  | Shell inside the app container                      |
| `make psql`                   | `psql` console of the running database              |
| `make prod-build`             | Build the production image                          |

## Configuration

Ports and database credentials have defaults in `compose.yaml`. To override them, copy `.env.example` to `.env`.

| Service    | Host port | Notes                                                      |
|------------|-----------|------------------------------------------------------------|
| app        | 3000      | debugger on 9229 (`npm run start:debug`)                   |
| PostgreSQL | 5432      | user / password / database: `app` / `app` / `app`          |

## Docker images

`.docker/Dockerfile` is a multi-stage build:

- `development`: used by `compose.yaml`, source code and `node_modules` are bind-mounted from the project directory
- `production`: compiled `dist/` with runtime dependencies only, running as the non-root `node` user
