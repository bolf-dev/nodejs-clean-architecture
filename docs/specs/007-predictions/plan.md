# 007 Predictions: plan

- **Status:** Approved (2026-11-10), phase 6 added 2026-11-10 for the amended spec (the top 3 of qualifying).
- **Spec:** [spec.md](spec.md)

| Phase | Result                                                       | Spec items              |
|-------|--------------------------------------------------------------|-------------------------|
| 1     | `Prediction` aggregate, persistence, migration               | R1, R2, R3, R4, R5      |
| 2     | Submit and read my prediction: `PUT` / `GET …/predictions/me` | R6, AC1–AC6            |
| 3     | A player's predictions: `GET /v1/players/{playerId}/predictions` | R7, R8, AC7, AC8    |
| 4     | Frontend: prediction on the race                              | AC9                     |
| 5     | Frontend: predictions on the profiles                         | AC10                    |
| 6     | The top 3 of qualifying and the podium design (spec amendment) | R1, R2, AC1–AC10       |
| 7     | README                                                        |                         |

## New module `predictions`

`src/modules/predictions/` with the same four layers. It needs races, drivers and players from two other modules, and uses them only through their queries (constitution 2), behind its own ports:

```
PUT /v1/races/{raceId}/predictions/me
  → RacePredictionsController → CommandBus → SubmitPredictionHandler
  → RaceCatalog port → QueryBusRaceCatalog → GetRaceQuery, ListDriversQuery of seasons
  → PredictionPicks, Prediction (domain rules R2, R3, R4)
  → PredictionRepository port → MikroORM → predictions table

GET /v1/players/{playerId}/predictions?season=2026
  → PlayerPredictionsController → QueryBus → ListPlayerPredictionsHandler
  → PlayerDirectory port → QueryBusPlayerDirectory → GetPlayerQuery of players
  → RaceCatalog port → ListRacesQuery of seasons
  → PredictionQueries port → plain SQL on the predictions table only
```

The adapters of `RaceCatalog` and `PlayerDirectory` execute the other modules' queries on the `QueryBus`, like a controller. This is the Symfony equivalent of one bundle dispatching another bundle's message instead of using its repositories. No SQL reads the tables of another module.

## Domain model

**`Prediction` is the aggregate**: one player's prediction for one race. It references the player and the race by id only (constitution 6).

- `PredictionPicks.create({ qualifying: { p1, p2, p3 }, race: { p1, p2, p3 } }, { season, driverCodes })`: value object of the six codes (since phase 6; phases 1 to 5 had pole, P1, P2, P3)
  - the three drivers of each podium are different, otherwise `PodiumDriversNotDifferent` naming qualifying or race (R2)
  - every code is one of the season's driver codes, otherwise `DriverNotInSeason` (R3)
  - both errors are `ValidationError`, so `400`
- `Prediction.submit({ id, playerId, raceId, picks, now })`: `submittedAt` and `updatedAt` are `now`
- `prediction.change(picks, now)`: new picks and `updatedAt`, `submittedAt` is kept (R4)
- `Prediction.reconstitute(…)`
- The codes are stored as they are, so a prediction keeps its drivers when they leave the grid (R5)

The handler passes in `new Date()` and `randomUUID()`, as in 002. The `Clock` port comes with the deadline (010).

## Database

Phase 1 creates the table, phase 6 replaces the four pick columns with six:

| Table         | Columns | Constraints |
|---------------|---------|-------------|
| `predictions` | `id` uuid, `player_id` uuid, `race_id` uuid, `qualifying_p1`, `qualifying_p2`, `qualifying_p3`, `race_p1`, `race_p2`, `race_p3` varchar(3), `submitted_at` timestamptz, `updated_at` timestamptz | unique `(player_id, race_id)` (R4) |

There are no foreign keys to `players` and `races`, because those tables belong to other modules. The ids are checked through their queries.

`MikroOrmPredictionRepository.save` upserts on `(player_id, race_id)` and never overwrites `submitted_at`, so two concurrent first submissions of the same player (e.g. a double click) do not fail on the unique index.

## Phase 1: `Prediction` aggregate and persistence

- Domain: `PredictionPicks`, `Prediction`, `prediction.errors.ts`, `PredictionRepository` port (`findByPlayerAndRace`, `save`)
- Infrastructure: `PredictionRecord` (`defineEntity`), `PredictionMapper`, `MikroOrmPredictionRepository`, `InMemoryPredictionRepository`
- Migration, `PredictionsModule` registered in `AppModule`
- Tests: unit tests of `PredictionPicks` (R2: the same driver twice on the podium is rejected, the pole may be on the podium; R3: a code outside the season is rejected) and of `Prediction` (`change` keeps `submittedAt`)

## Phase 2: Submit and read my prediction

- `RaceCatalog` port (application): `seasonOf(raceId)` → the season or null, `driverCodes(season)`; `QueryBusRaceCatalog` adapter with `GetRaceQuery` (its `RaceNotFound` becomes null) and `ListDriversQuery`; `FakeRaceCatalog`
- `SubmitPredictionCommand(playerId, raceId, pole, p1, p2, p3)` and its handler:
  1. the race's season, or `RaceNotFound` (`404`)
  2. the season's driver codes, `PredictionPicks.create`
  3. load the player's prediction for the race: `change` it, or `Prediction.submit` a new one
  4. save
- `PredictionQueries` port with `findMine(playerId, raceId)`, `SqlPredictionQueries`, in-memory adapter, `PredictionReadModel`
- `GetMyPredictionQuery(playerId, raceId)` and its handler, `PredictionNotFound` (`404`)
- `RacePredictionsController` (`v1/races/:raceId/predictions`): `PUT me` with `SubmitPredictionRequest` (`@IsString()` on the four fields), `204`; `GET me` with `PredictionResponse`; `raceId must be a UUID`
- Tests: unit tests of `SubmitPredictionHandler` (a new prediction; a second submission changes it; unknown race) with the fake catalog and the in-memory repository; e2e AC1 to AC6 in `test/predictions.e2e-spec.ts`
- The season for the e2e tests is synced as in `test/seasons.e2e-spec.ts`; that setup moves to `test/support/season.ts` and both files use it

## Phase 3: A player's predictions

- `PlayerDirectory` port (application): `exists(playerId)`; `QueryBusPlayerDirectory` adapter with `GetPlayerQuery` (its `PlayerNotFound` becomes false); `FakePlayerDirectory`
- `RaceCatalog.listRaces(season)` → id, round and name of the season's races, with `ListRacesQuery`
- `PredictionQueries.listByPlayer(playerId, raceIds)`
- `ListPlayerPredictionsQuery(viewerId, playerId, season)` and its handler:
  1. `PlayerNotFound` (`404`) for an unknown player
  2. another player: an empty list, because no race is finished before 008 (R8)
  3. the player's predictions of the season's races, with round and race name, ordered by round (R7)
- `PlayerPredictionsController` (`v1/players/:playerId/predictions`): `GET` with `?season=`, `PlayerPredictionsResponse`; `playerId must be a UUID`
- `SeasonRequest` moves from `seasons/presentation/http/` to `shared/presentation/http/`, because both modules validate `?season=` and a module never imports another module's presentation
- Tests: unit tests of `ListPlayerPredictionsHandler` (another player → empty; unknown player → `PlayerNotFound`); e2e AC7, AC8

## Phase 4: Frontend, prediction on the race

- `api/predictions.ts`: `submitMyPrediction(raceId, picks)`, `getMyPrediction(raceId)` (null on `404`)
- `components/PredictionForm.vue`: the four slots, the driver cards as buttons, "Save prediction", the slot rules of the spec; it emits the picks, the view saves them
- `DriverCard.vue`: an optional badge with the slot of the driver (e.g. `P1`)
- `RaceView.vue`: loads my prediction with the race and the drivers, shows `PredictionForm` instead of the plain driver grid, saves through the API, shows "Prediction saved" or the API error

**Done when:** AC9 works in the browser.

## Phase 5: Frontend, predictions on the profiles

- `api/predictions.ts`: `listPlayerPredictions(playerId, season)`
- `components/PredictionsList.vue`: one row per race with round, race name and the four codes, each opening the race; an empty text given by the view
- `MyProfileView.vue`: section "My predictions"; `PlayerProfileView.vue`: section "Predictions"

**Done when:** AC10 works in the browser.

## Phase 6: The top 3 of qualifying and the podium design

The spec was amended after phase 5: a prediction has the top 3 of qualifying instead of only the pole position, and the race screen shows two podiums.

- Domain: `PredictionPicks` with `qualifying` and `race`, each `{ p1, p2, p3 }`; `PodiumDriversNotDifferent` with the message of the spec for qualifying or race
- Database: a second migration deletes the predictions saved so far (development data only, 007 is not released) and replaces `pole`, `p1`, `p2`, `p3` with `qualifying_p1` to `qualifying_p3` and `race_p1` to `race_p3`; record and mapper follow
- Application and API: the command, the read models and the responses use `qualifying` and `race`
- `SubmitPredictionRequest`: `qualifying` and `race` are nested `PodiumRequest` objects (`@IsObject()`, `@ValidateNested()`, `@Type()` of `class-transformer`, which the validation pipe already uses)
- `RequestValidationPipe` reports the first broken constraint of a nested object with its path, e.g. `race.p1 must be a string`; today it only reads the top level and would answer `Invalid request`
- Frontend:
  - `PredictionForm` with two podiums, "Qualifying" (P2, POLE, P3) and "Race" (P2, P1, P3), the middle step highest
  - the moving rule per podium; the badges `POLE`, `QUALI P2`, `QUALI P3`, `RACE P1`, `RACE P2`, `RACE P3`
  - `PredictionsList` rows with both podiums
- Tests: the existing tests follow the new shape; `PredictionPicks` and e2e AC3 for a repeated driver in qualifying and in the race, and a driver in both podiums accepted

**Done when:** AC9 and AC10 work in the browser again.

## Phase 7: README

- The three endpoints in the API table, the `predictions` module and how it uses the other modules in the architecture section, the prediction screens in the frontend section

## Dependencies

None.

## Constitution check

| Article | How this plan follows it |
|---------|--------------------------|
| 2 Modules | new module `predictions`; races, drivers and players only through the queries of `seasons` and `players`; `SeasonRequest` moves to `shared` instead of being imported across modules |
| 3 Layers | the domain gets the season's driver codes as plain data and knows nothing about the other modules |
| 4 Ports | `PredictionRepository` (domain), `RaceCatalog`, `PlayerDirectory`, `PredictionQueries` (application), each with a fake or in-memory adapter |
| 5 CQRS | submitting is one command changing one `Prediction`; reading is queries with plain SQL on the module's own table |
| 6 Domain | R2, R3 and R4 live in `PredictionPicks` and `Prediction`; time and ids are passed in |
| 7 API | the request DTO checks only that the four fields are strings; the rules are in the domain |
| 8 Testing | domain and handler unit tests without NestJS, e2e against PostgreSQL, no external API |
