# 005 Players list: plan

- **Status:** Done (2026-11-09)
- **Spec:** [spec.md](spec.md)

| Phase | Result                                   | Spec items     |
|-------|------------------------------------------|----------------|
| 1     | `GET /v1/players`                        | R1–R3, AC1, AC2 |
| 2     | Players screen and header link           | AC3, AC4       |
| 3     | README                                   |                |

The list is a pure read: a query with a read model and plain SQL, the same path as `GetPlayerQuery`. No domain code and no migration.

```
GET /v1/players
  → PlayersController.list
  → QueryBus → ListPlayersHandler
  → PlayerQueries.listAll → SELECT id, nickname … ORDER BY lower(nickname)
```

## Phase 1: `GET /v1/players`

- `players/application/player.read-model.ts`: `PlayerListItem` (`id`, `nickname`)
- `PlayerQueries.listAll()`: `SqlPlayerQueries` with `order by lower(nickname), id` (R2; the id only makes equal nicknames impossible to reorder, they are unique anyway), `InMemoryPlayerQueries` sorts the same way
- `players/application/queries/list-players/`: `ListPlayersQuery`, `ListPlayersHandler`
- `players/presentation/http/players-list.response.ts`: `{ players: [{ id, nickname }] }` (R3)
- `PlayersController.list`: `@Get()`, needs a token like every endpoint
- Tests: unit `ListPlayersHandler`; e2e AC1 and AC2 in `test/players.e2e-spec.ts`

## Phase 2: Players screen

- `api/players.ts`: `listPlayers()` and the `PlayerListItem` type
- `views/PlayersView.vue` at `/players`: loading state, one row per player like the timing tower (position number, nickname), each row a `RouterLink` to `/players/{id}`; the logged-in player's row is marked "You" and links to `/`; errors as B4 of 003
- Router: route `/players`, declared before `/players/:playerId`
- `AppHeader`: "Players" link next to the nickname

**Done when:** AC3 and AC4 work in the browser.

## Phase 3: README

- API table: `GET /v1/players`
- Frontend section: the players screen

## Constitution check

| Article | How this plan follows it |
|---------|--------------------------|
| 1 Workflow | spec, plan, tasks approved first; nothing for later features (no paging) |
| 5 CQRS | a query with a read model port and plain SQL, no aggregate |
| 7 API | the list is wrapped in an object; `401` from the global guard |
| 8 Testing | one unit test of the handler, e2e tests for the endpoint |
