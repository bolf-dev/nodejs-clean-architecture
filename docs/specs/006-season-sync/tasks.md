# 006 Season sync: tasks

- **Status:** Approved (2026-11-09)
- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

Tasks are done in order. Every phase ends with green checks and a commit on the `006-season-sync` branch, then stops for review.

## Phase 0: Documentation

- [x] **0.1** Commit the spec, plan and tasks of 006 with the roadmap and mission changes

## Phase 1: `Season` aggregate and persistence

- [x] **1.1** Domain: `DriverCode`, `Race`, `SeasonDriver`, `Season` (`create`, `reconstitute`, `syncRace`, `replaceGrid`), `SeasonRepository` port
- [x] **1.2** Infrastructure: `RaceRecord`, `SeasonDriverRecord`, `SeasonMapper`, `MikroOrmSeasonRepository`, `InMemorySeasonRepository`
- [x] **1.3** Migration of `races` and `season_drivers`, `SeasonsModule` registered in `AppModule`
- [x] **1.4** Tests: unit `Season` (a round synced twice is updated; `replaceGrid` keeps ids and removes drivers who left), `DriverCode`
- [x] **1.5** `make test` and `make lint` pass. Commit phase 1.

## Phase 2: `F1DataProvider` port and Jolpica adapter

- [x] **2.1** `F1DataProvider` port and `F1DataUnavailable`
- [x] **2.2** Record the Jolpica responses into `test/fixtures/jolpica/` with `curl`: the 2026 calendar, the latest results, the season's drivers
- [x] **2.3** `JolpicaF1DataProvider` with `fetch`, `FakeF1DataProvider`
- [x] **2.4** Tests: unit `JolpicaF1DataProvider` against the fixtures (AC1, AC3) and a failing `fetch`
- [x] **2.5** `make test` and `make lint` pass. Commit phase 2.

## Phase 3: Sync command and `make sync-season`

- [x] **3.1** `SyncSeasonCommand`, `SyncSeasonHandler`
- [x] **3.2** `src/sync-season.ts`, `make sync-season year=…`
- [x] **3.3** Tests: unit `SyncSeasonHandler`: AC2, AC4, AC5, AC6
- [x] **3.4** Manual check: `make sync-season year=2026` prints the summary; a second run updates and creates nothing
- [x] **3.5** `make test` and `make lint` pass. Commit phase 3.

## Phase 4: Read API

- [x] **4.1** Read models, `SeasonQueries` port, `SqlSeasonQueries`, in-memory adapter
- [x] **4.2** `ListRacesQuery`, `GetRaceQuery` with `RaceNotFound`, `ListDriversQuery` and their handlers
- [x] **4.3** Controller with `GET /v1/races`, `GET /v1/races/:raceId`, `GET /v1/drivers`, the `season` request DTO, response classes
- [x] **4.4** Tests: unit `GetRaceHandler` (not found); e2e AC7, AC8, AC9
- [x] **4.5** `make test`, `make test-e2e` and `make lint` pass. Commit phase 4.

## Phase 5: Frontend

- [ ] **5.1** `api/races.ts`, `utils/team-colors.ts`
- [ ] **5.2** `DriverCard`, `RacesView` at `/races`, `RaceView` at `/races/:raceId`, "Races" link in the header
- [ ] **5.3** Verify in the browser after `make sync-season year=2026`: AC10, AC11
- [ ] **5.4** `make frontend-lint` passes. Commit phase 5.

## Phase 6: README

- [ ] **6.1** README: `make sync-season`, the three endpoints, the `seasons` module and the Jolpica adapter. Commit phase 6.

## Finish

- [ ] **F.1** Check off 006 in the roadmap, set spec, plan and tasks to done
- [ ] **F.2** Code review of the branch by the `cto` subagent; fix the findings the project owner accepts
- [ ] **F.3** After approval of the project owner: push the branch and open a pull request
