# 006 Season sync

- **Status:** Done (2026-11-09)
- **Roadmap:** [006](../../product/roadmap.md#006-season-sync)

## Why

Predictions (007) need the races of a season and the drivers a player can pick. Both come from the official F1 data, available through the public [Jolpica F1 API](https://api.jolpi.ca/ergast/f1/). Loading them is the first integration with an external system, behind a port, so the rest of the app never knows where the data comes from.

## User stories

1. As the **project owner**, I want to load or update the calendar and the drivers of a season with one command.
2. As a **player**, I want to see the calendar of the season.
3. As a **player**, I want to see a race with its session times and the drivers of the current grid.

## Business rules

### Sync

- **R1** A season is synced with the command `make sync-season year=2026`. There is no endpoint for it, so no player can start it.
- **R2** Syncing again is safe: existing races and drivers are updated, nothing is duplicated.
- **R3** When the F1 data source cannot be reached or returns data the app cannot read, the command fails with a clear message and no data is changed.
- **R4** The command prints what it did, e.g. `2026: 23 races (23 new, 0 updated), 22 drivers`.

### Races

- **R5** A race is identified by its season and round. It has a name, a circuit, a locality and a country.
- **R6** A race has the start times of qualifying, of sprint qualifying (only on sprint weekends) and of the race, in UTC. The deadline (010) will be derived from them.

### Drivers

- **R7** The drivers of a season are the **current grid**: the drivers who started the latest race of the season that has results, each with the team they drove for in it. Before the first race of a season, they are the season's drivers that have a code and a number, without a team.
- **R8** A driver has a code (e.g. `VER`), a number, a first and a last name, and a team (id and name) when known. A driver without a code in the source gets the first three letters of the last name in upper case.
- **R9** After a sync, the drivers of the season are exactly the current grid. Drivers who left it are no longer drivers of the season.

## API contract

All endpoints require a token (004). Times are in UTC, in ISO 8601 format.

### `GET /v1/races?season=2026`

Response `200 OK`, races ordered by round:

```json
{
  "races": [
    {
      "id": "0199a1b2-7c3d-7e4f-8a5b-6c7d8e9f0a1b",
      "season": 2026,
      "round": 2,
      "name": "Chinese Grand Prix",
      "circuit": "Shanghai International Circuit",
      "locality": "Shanghai",
      "country": "China",
      "sprintQualifyingAt": "2026-03-13T07:30:00.000Z",
      "qualifyingAt": "2026-03-14T07:00:00.000Z",
      "raceAt": "2026-03-15T07:00:00.000Z"
    }
  ]
}
```

`sprintQualifyingAt` is `null` on weekends without a sprint.

| Status | When                                            | `error`                                  |
|--------|-------------------------------------------------|------------------------------------------|
| 400    | `season` is missing or not a year (e.g. `abc`)  | `season must be a year`                  |

A season that was never synced returns an empty list.

### `GET /v1/races/{raceId}`

Response `200 OK` with one race in the format above.

| Status | When                          | `error`                     |
|--------|-------------------------------|-----------------------------|
| 400    | `raceId` is not a UUID        | `raceId must be a UUID`     |
| 404    | No race with this id          | `Race "…" not found`        |

### `GET /v1/drivers?season=2026`

Response `200 OK`, drivers ordered by code:

```json
{
  "drivers": [
    {
      "id": "0199a1b2-8d4e-7f50-9b6c-7d8e9f0a1b2c",
      "code": "NOR",
      "number": 1,
      "firstName": "Lando",
      "lastName": "Norris",
      "team": { "id": "mclaren", "name": "McLaren" }
    }
  ]
}
```

`team` is `null` before the first race of a season (R7). The `400` for `season` is the same as for races.

## Frontend

- **Races** (`/races`), linked from the header: the calendar of the current year's season, one row per race with round, name, country and race date in local time. Rows of past races are dimmed. Each row opens the race. When the season has no races yet, the screen says so.
- **Race** (`/races/{raceId}`): name, circuit, locality and country, the session times in local time (B5 of 003), and the current grid as driver cards: number, code, first and last name, and a stripe in the team color.
- Team colors are a small table in the frontend from team id to color, without Formula 1 trademarks. An unknown team or no team gets a neutral grey.

## Acceptance criteria

The sync is tested with recorded responses of the data source, never the real API (constitution 8).

### Sync

- **AC1** Given the recorded 2026 calendar, when I sync 2026, then 23 races exist; round 2 (China) has a sprint qualifying time, round 1 (Australia) has none; all times are UTC (R5, R6).
- **AC2** Given 2026 was synced, when the qualifying time of a race changes in the source and I sync again, then the race has the new time and no race is duplicated (R2).
- **AC3** Given the recorded results of the latest race, when I sync, then the season has its 22 starters with their teams; a starter without a code gets one from the last name (R7, R8).
- **AC4** Given the season has no race results yet, when I sync, then the season has the drivers with a code and a number, without teams (R7).
- **AC5** Given a driver was on the grid and is not in the latest race, when I sync again, then they are no longer a driver of the season (R9).
- **AC6** Given the data source cannot be reached, when I sync, then the command fails with a message and the data is unchanged (R3).

### API

- **AC7** Given 2026 was synced, `GET /v1/races?season=2026` returns the races ordered by round; `season=abc` returns `400`; a season never synced returns an empty list.
- **AC8** `GET /v1/races/{raceId}` returns the race; an unknown id returns `404`.
- **AC9** `GET /v1/drivers?season=2026` returns the grid ordered by code, with teams.

### Frontend

- **AC10** Given 2026 was synced, when I open "Races", then I see the calendar in round order, past races dimmed.
- **AC11** When I open a race, then I see its session times in local time and the driver cards with team colors.

## Out of scope

- Scheduled or automatic sync
- Cancelled races and race status (results in 008)
- Results, predictions and the deadline (007, 008, 010)
- Driver photos (ideas for later)
- Choosing another season in the frontend
