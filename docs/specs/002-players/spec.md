# 002 Architecture skeleton and players

- **Status:** Done (2026-10-30)
- **Roadmap:** [002](../../product/roadmap.md#002-architecture-skeleton-and-players)

## Why

Players are the simplest part of the game: they only need a nickname to take part. That makes them a good first vertical slice through all layers. This feature sets the patterns (module structure, CQRS, persistence, validation, errors, tests) that every later feature follows.

A player has no credentials yet. Creating a player is not a login account, anyone can create one and use its id. Registration with an email and a password follows in roadmap item [008](../../product/roadmap.md#008-authentication).

## User stories

1. As a **visitor**, I want to create a player with a nickname, so that I can submit predictions and appear in the standings.
2. As a **player**, I want to see my player profile, so that I can check my nickname.
3. As a **player**, I want to change my nickname, so that I can fix a typo or pick a better one.

## Business rules

### Nickname

- **R1** Leading and trailing whitespace is removed before any other rule is applied.
- **R2** The nickname is 3 to 20 characters long.
- **R3** The nickname contains only English letters, digits, `-` and `_`.
- **R4** The nickname is unique, case-insensitive: when `Bolf` exists, `bolf` and `BOLF` are rejected.
- **R5** The nickname is stored and shown exactly as entered (after R1), including letter case.
- **R6** A player can change their nickname. The new nickname follows R1 to R5. R4 does not apply to the player's own current nickname, so `Bolf` can change to `BOLF`.

### Player

- **R7** Every player gets a unique identifier and the time of creation (`createdAt`) when created. Neither ever changes.
- **R8** Every player has the time of the last change (`updatedAt`). When the player is created, it equals `createdAt`.
- **R9** When the new nickname is exactly the same as the current one (after R1), nothing changes and `updatedAt` stays the same.

## API contract

Times are in UTC, in ISO 8601 format.

### `POST /v1/players`

Creates a player.

Request:

```json
{ "nickname": "Bolf" }
```

Response `201 Created`, with the header `Location: /v1/players/{id}`:

```json
{ "id": "0199a1b2-7c3d-7e4f-8a5b-6c7d8e9f0a1b" }
```

| Status | When                                                     | Example `error`                                                   |
|--------|----------------------------------------------------------|-------------------------------------------------------------------|
| 400    | `nickname` is missing or is not a string                 | `nickname must be a string`                                       |
| 400    | The nickname breaks R2 or R3                             | `Nickname must be 3 to 20 characters long`                        |
|        |                                                          | `Nickname may contain only letters, digits, "-" and "_"`          |
| 409    | The nickname is taken (R4)                               | `Nickname "bolf" is already taken`                                |

### `GET /v1/players/{playerId}`

Returns a player.

Response `200 OK`:

```json
{
  "id": "0199a1b2-7c3d-7e4f-8a5b-6c7d8e9f0a1b",
  "nickname": "Bolf",
  "createdAt": "2026-10-23T10:15:00.000Z",
  "updatedAt": "2026-10-23T10:15:00.000Z"
}
```

| Status | When                                   | Example `error`                                   |
|--------|----------------------------------------|---------------------------------------------------|
| 400    | `playerId` is not a valid UUID         | `playerId must be a UUID`                         |
| 404    | No player with this id exists          | `Player "0199a1b2-…" not found`                   |

### `PATCH /v1/players/{playerId}`

Changes the nickname of a player.

Request:

```json
{ "nickname": "Ferrari_Fan" }
```

Response `204 No Content` without a body.

| Status | When                                                     | Example `error`                                                   |
|--------|----------------------------------------------------------|-------------------------------------------------------------------|
| 400    | `playerId` is not a valid UUID                           | `playerId must be a UUID`                                         |
| 400    | `nickname` is missing or is not a string                 | `nickname must be a string`                                       |
| 400    | The nickname breaks R2 or R3                             | `Nickname must be 3 to 20 characters long`                        |
| 404    | No player with this id exists                            | `Player "0199a1b2-…" not found`                                   |
| 409    | The nickname is taken by another player (R4, R6)         | `Nickname "ferrari_fan" is already taken`                         |

## Acceptance criteria

### Creating a player

- **AC1** Given no player exists, when I create `Bolf`, then I get `201`, an id and a `Location` header, and `GET` on that location returns the nickname `Bolf`, and `createdAt` and `updatedAt` with the same time.
- **AC2** Given I create `"  Bolf  "`, then the stored nickname is `Bolf` (R1).
- **AC3** Given I create `ab` or a 21-character nickname, then I get `400` (R2). `abc` and a 20-character nickname are accepted.
- **AC4** Given I create `bolf!`, `bo lf` or `bölf`, then I get `400` (R3). `bolf_97` and `bolf-dev` are accepted.
- **AC5** Given `Bolf` exists, when I create `bolf` or `BOLF`, then I get `409` and no second player is created (R4).
- **AC6** Given two requests to create the same nickname arrive at the same time, then exactly one succeeds and the other gets `409` (R4).
- **AC7** Given the request body has no `nickname`, or `nickname` is a number, then I get `400`.

### Player detail

- **AC8** Given a player exists, when I request it by id, then I get `200` with `id`, `nickname`, `createdAt` and `updatedAt`.
- **AC9** Given no player has the id, then I get `404`.
- **AC10** Given the id is not a UUID, e.g. `123`, then I get `400`.

### Changing the nickname

- **AC11** Given player `Bolf` exists, when I change the nickname to `Ferrari_Fan`, then I get `204`, `GET` returns `Ferrari_Fan`, `updatedAt` is the time of the change and `createdAt` is unchanged (R6, R8).
- **AC12** Given player `Bolf` exists, when I change the nickname to `BOLF`, then I get `204` and the nickname is `BOLF` (R6).
- **AC13** Given players `Bolf` and `Ferrari_Fan` exist, when `Bolf` changes the nickname to `ferrari_fan`, then I get `409` and the nickname stays `Bolf` (R4, R6).
- **AC14** Given player `Bolf` exists, when I change the nickname to `ab` or `bolf!`, then I get `400` and the nickname stays `Bolf` (R2, R3).
- **AC15** Given player `Bolf` exists, when I change the nickname to `Bolf`, then I get `204` and `updatedAt` is unchanged (R9).
- **AC16** Given no player has the id, then I get `404`. Given the id is not a UUID, then I get `400`.
- **AC17** Given the request body has no `nickname`, then I get `400`.

### Errors

- **AC18** Every error response has the body `{ "error": "<message>" }`, including unknown routes (`404`).
- **AC19** An unexpected error returns `500` with `{ "error": "Internal server error" }` and no internal details. The details are logged.

## Technical acceptance criteria

This feature also lays the foundation for all later ones:

- **T1** On a fresh clone, `make init` builds the images, installs dependencies, applies database migrations and starts the app.
- **T2** The database schema is created and changed only through committed migrations, with `make` targets to create and apply them.
- **T3** The app refuses to start, with a clear message, when required configuration (e.g. the database URL) is missing.
- **T4** Functional tests run against a separate test database, and every test starts from an empty database.
- **T5** Dropped on 2026-10-30: the dependency rules of the [constitution](../../constitution.md) are kept by review, without an automated check in lint.
- **T6** The example `Hello World` code from the NestJS scaffold is removed.

## Out of scope

- Listing or searching players
- Deleting a player
- History of nickname changes
- Automated checks of layer dependencies in lint
- Authentication: anyone can create, read and change any player, until [008](../../product/roadmap.md#008-authentication)
- Player statistics (roadmap item [007](../../product/roadmap.md#007-standings-and-stats))
