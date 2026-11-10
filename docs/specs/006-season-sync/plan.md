# 006 Season sync: plan

- **Status:** Done (2026-11-09)
- **Spec:** [spec.md](spec.md)

| Phase | Result                                                    | Spec items          |
|-------|-----------------------------------------------------------|---------------------|
| 1     | `Season` aggregate, persistence, migration                | R2, R5, R6, R8, R9  |
| 2     | `F1DataProvider` port with the Jolpica adapter            | R3, R7              |
| 3     | Sync command and `make sync-season`                       | R1–R4, AC1–AC6      |
| 4     | Read API: races and drivers                               | AC7–AC9             |
| 5     | Frontend: races, race detail, driver cards                | AC10, AC11          |
| 6     | README                                                    |                     |

## New module `seasons`

`src/modules/seasons/` with the same four layers as `players`. It does not use the players module; its endpoints are protected by the global guard of 004 like every other endpoint.

```
make sync-season year=2026
  → src/sync-season.ts (Nest application context, no HTTP)
  → CommandBus → SyncSeasonHandler
  → F1DataProvider port → JolpicaF1DataProvider (fetch)   all data is fetched first
  → Season aggregate: syncRaces, replaceGrid               domain rules
  → SeasonRepository port → MikroORM, one transaction      nothing is saved on an error (R3)

GET /v1/races, /v1/races/{id}, /v1/drivers
  → SeasonsController → QueryBus → handlers → SeasonQueries port → plain SQL
```

## Domain model

**`Season` is the aggregate**: one season with its races and its grid. A sync changes one season, so it is one command changing one aggregate (constitution 5). Predictions (007) will reference races by id only.

- `Season.create(year)`, `Season.reconstitute(…)`
- `season.syncRace(data, newId)`: adds the race of a round or updates it (R2, R5, R6); returns whether it was new, for the summary (R4)
- `season.replaceGrid(drivers, idFor)`: the season's drivers become exactly these (R9). A driver keeps its id across syncs, matched by the data source's driver id.
- `Race` entity: id, round, name, circuit, locality, country, `sprintQualifyingAt` (optional), `qualifyingAt`, `raceAt`
- `SeasonDriver` entity: id, external id, `DriverCode`, number, first and last name, `team` (id, name) or none
- `DriverCode.from(code, lastName)`: the code, or the first three letters of the last name in upper case (R8)

Ids come from `randomUUID()` in the handler, as in 002.

## Database

One migration:

| Table            | Columns | Constraints |
|------------------|---------|-------------|
| `races`          | `id` uuid, `season` int, `round` int, `name`, `circuit`, `locality`, `country`, `sprint_qualifying_at` timestamptz null, `qualifying_at` timestamptz, `race_at` timestamptz | unique `(season, round)` |
| `season_drivers` | `id` uuid, `season` int, `external_id`, `code` varchar(3), `number` int, `first_name`, `last_name`, `team_id` null, `team_name` null | unique `(season, external_id)` |

There is no separate `drivers` table: nothing needs a driver across seasons yet.

## Phase 1: `Season` aggregate and persistence

- Domain: `Season`, `Race`, `SeasonDriver`, `DriverCode`, `SeasonRepository` port (`findByYear`, `save`)
- Infrastructure: `RaceRecord`, `SeasonDriverRecord` (`defineEntity`), `SeasonMapper`, `MikroOrmSeasonRepository.save` in one transaction: upsert of the races, delete and upsert of the drivers; `InMemorySeasonRepository`
- Migration, `SeasonsModule` registered in `AppModule`
- Tests: unit tests of `Season` (a round synced twice is updated, not duplicated; `replaceGrid` keeps ids and removes drivers who left) and `DriverCode`

## Phase 2: `F1DataProvider` port and Jolpica adapter

- `seasons/application/ports/f1-data-provider.port.ts`:
  - `calendar(year)` → races with round, name, circuit, locality, country and session times
  - `latestRaceStarters(year)` → drivers of the latest race with results, with their team; empty before the first race
  - `seasonDrivers(year)` → all drivers of the season, code and number optional
  - throws `F1DataUnavailable` when the source cannot be reached or the response cannot be read (R3)
- `seasons/infrastructure/jolpica/jolpica-f1-data-provider.ts`: built-in `fetch` to `https://api.jolpi.ca/ergast/f1`, `/{year}.json?limit=100`, `/{year}/last/results.json`, `/{year}/drivers.json?limit=100`; parses the `MRData` responses, times from `date` + `time`
- Recorded responses in `test/fixtures/jolpica/`: the 2026 calendar, the results of the latest race, the season's drivers, recorded once with `curl` and committed
- `seasons/infrastructure/in-memory/fake-f1-data-provider.ts`: returns data set by the test, or fails
- Tests: unit test of the adapter with `fetch` replaced to return the fixtures (AC1: 23 races, sprint qualifying only in round 2 of the first two; AC3: 22 starters with teams, one without a code), and a failing `fetch` → `F1DataUnavailable`

## Phase 3: Sync command and `make sync-season`

- `seasons/application/commands/sync-season/`: `SyncSeasonCommand(year)`, `SyncSeasonHandler`:
  1. fetch the calendar and the starters; when there are no starters, the season's drivers that have a code and a number (R7)
  2. load the season or create it, `syncRace` for every race, `replaceGrid`
  3. save, return the summary `{ races, created, updated, drivers }`
- `src/sync-season.ts`: next to `main.ts`, starts the Nest application context without HTTP, reads the year from the arguments, executes the command, prints the summary (R4), exits with `1` and the message on an error
- `make sync-season year=2026`: `docker compose exec app node dist/sync-season.js $(year)`. It runs the compiled code of the running app (watch mode compiles `src/` to `dist/`), so it needs `make up`. A production image runs `node dist/sync-season.js 2026` the same way.
- Tests: unit tests of `SyncSeasonHandler` with the in-memory repository and the fake provider: AC2 (a changed time is updated), AC4 (no starters → drivers with code and number, no team), AC5 (a driver who left is removed), AC6 (the provider fails → the repository is unchanged)
- Manual check: `make sync-season year=2026` against the real API prints `2026: 23 races (23 new, 0 updated), 22 drivers`; a second run prints `0 new, 23 updated`

## Phase 4: Read API

- `SeasonQueries` port with `listRaces(season)`, `findRace(id)`, `listDrivers(season)`; `SqlSeasonQueries` and an in-memory adapter; read models `RaceReadModel`, `DriverReadModel`
- Queries and handlers: `ListRacesQuery`, `GetRaceQuery` (`RaceNotFound` → 404), `ListDriversQuery`
- `SeasonsController` (or `RacesController` and `DriversController`): `GET /v1/races?season=`, `GET /v1/races/:raceId` (`ParseUUIDPipe`, `raceId must be a UUID`), `GET /v1/drivers?season=`; a `SeasonQuery` request DTO validates `season` as an integer year (`season must be a year`)
- Responses wrapped in `{ races }` and `{ drivers }`
- Tests: unit tests of the handlers that do more than pass data through (`GetRaceHandler`: not found); e2e AC7 to AC9 in `test/seasons.e2e-spec.ts`, the data synced through `SyncSeasonCommand` with the fake provider

## Phase 5: Frontend

- `api/races.ts`: `listRaces(season)`, `getRace(id)`, `listDrivers(season)`
- `utils/team-colors.ts`: team id → color for the 11 teams of 2026, a neutral grey otherwise
- `components/DriverCard.vue`: number, code, first and last name, a stripe in the team color
- `views/RacesView.vue` (`/races`): the current year's calendar, past races dimmed, an empty state
- `views/RaceView.vue` (`/races/:raceId`): race details, session times in local time, the grid as driver cards; not found and errors as in 003
- Router routes, "Races" link in the header

**Done when:** AC10 and AC11 work in the browser after `make sync-season year=2026`.

## Phase 6: README

- `make sync-season` in Getting started and in the commands, the three endpoints in the API table, the `seasons` module and the Jolpica adapter in the architecture section

## Dependencies

None. HTTP uses the built-in `fetch`, as decided in the tech stack.

## Constitution check

| Article | How this plan follows it |
|---------|--------------------------|
| 2 Modules | new module `seasons`, no imports from `players` |
| 3 Layers | the domain knows nothing about Jolpica; the adapter maps its JSON into plain data for the handler |
| 4 Ports | `F1DataProvider` (application) and `SeasonRepository` (domain) are abstract classes with fake and in-memory adapters |
| 5 CQRS | the sync is one command changing one `Season` aggregate; the API is queries with plain SQL |
| 6 Domain | sync rules (no duplicates, the grid replaced, the code fallback) live in `Season` and `DriverCode` |
| 8 Testing | the external API is replaced by recorded fixtures and a fake adapter; no test calls Jolpica |
| 9 Tooling | `make sync-season` is the new recurring command |
