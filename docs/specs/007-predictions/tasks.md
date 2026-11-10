# 007 Predictions: tasks

- **Status:** Approved (2026-11-10), phase 6 added 2026-11-10.
- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

Tasks are done in order. Every phase ends with green checks and a commit on the `007-predictions` branch, then stops for review.

## Phase 0: Documentation

- [x] **0.1** Commit the spec, plan and tasks of 007 with the roadmap link

## Phase 1: `Prediction` aggregate and persistence

- [x] **1.1** Domain: `PredictionPicks`, `Prediction` (`submit`, `change`, `reconstitute`), `prediction.errors.ts`, `PredictionRepository` port
- [x] **1.2** Infrastructure: `PredictionRecord`, `PredictionMapper`, `MikroOrmPredictionRepository` (upsert on player and race), `InMemoryPredictionRepository`
- [x] **1.3** Migration of `predictions`, `PredictionsModule` registered in `AppModule`
- [x] **1.4** Tests: unit `PredictionPicks` (R2, R3), `Prediction` (`change` keeps `submittedAt`)
- [x] **1.5** `make test` and `make lint` pass. Commit phase 1.

## Phase 2: Submit and read my prediction

- [x] **2.1** `RaceCatalog` port with `seasonOf` and `driverCodes`, `QueryBusRaceCatalog`, `FakeRaceCatalog`
- [x] **2.2** `SubmitPredictionCommand` and its handler
- [x] **2.3** `PredictionQueries` port with `findMine`, `SqlPredictionQueries`, in-memory adapter, `GetMyPredictionQuery` and its handler
- [x] **2.4** `RacePredictionsController` with `PUT me` and `GET me`, `SubmitPredictionRequest`, `PredictionResponse`
- [x] **2.5** Season sync of the e2e tests moved to `test/support/season.ts`, used by `test/seasons.e2e-spec.ts`
- [x] **2.6** Tests: unit `SubmitPredictionHandler`; e2e AC1 to AC6
- [x] **2.7** `make test`, `make test-e2e` and `make lint` pass. Commit phase 2.

## Phase 3: A player's predictions

- [x] **3.1** `PlayerDirectory` port, `QueryBusPlayerDirectory`, `FakePlayerDirectory`; `RaceCatalog.listRaces`
- [x] **3.2** `PredictionQueries.listByPlayer`, `ListPlayerPredictionsQuery` and its handler
- [x] **3.3** `SeasonRequest` moved to `shared/presentation/http/`; `PlayerPredictionsController`, `PlayerPredictionsResponse`
- [x] **3.4** Tests: unit `ListPlayerPredictionsHandler`; e2e AC7, AC8
- [x] **3.5** `make test`, `make test-e2e` and `make lint` pass. Commit phase 3.

## Phase 4: Frontend, prediction on the race

- [x] **4.1** `api/predictions.ts` with `submitMyPrediction` and `getMyPrediction`
- [x] **4.2** `PredictionForm`, badge on `DriverCard`, `RaceView` loads and saves the prediction
- [x] **4.3** Verify in the browser: AC9
- [x] **4.4** `make frontend-lint` passes. Commit phase 4.

## Phase 5: Frontend, predictions on the profiles

- [x] **5.1** `listPlayerPredictions` in `api/predictions.ts`, `PredictionsList`, sections on `MyProfileView` and `PlayerProfileView`
- [x] **5.2** Verify in the browser: AC10
- [x] **5.3** `make frontend-lint` passes. Commit phase 5.

## Phase 6: The top 3 of qualifying and the podium design

- [x] **6.1** Commit the amended spec, plan and tasks with the mission and roadmap changes
- [x] **6.2** Domain: `PredictionPicks` with `qualifying` and `race`, `PodiumDriversNotDifferent` per podium
- [x] **6.3** Migration replacing the pick columns, `PredictionRecord`, `PredictionMapper`, SQL queries
- [x] **6.4** Command, read models, `SubmitPredictionRequest` with nested podiums, responses; nested messages in `RequestValidationPipe`
- [x] **6.5** Tests follow the new shape: unit `PredictionPicks` (R2 per podium), handlers; e2e AC1 to AC8
- [x] **6.6** `make test`, `make test-e2e` and `make lint` pass. Commit the backend.
- [ ] **6.7** Frontend: `api/predictions.ts`, `PredictionForm` with two podiums, `PredictionsList` rows
- [ ] **6.8** Verify in the browser: AC9, AC10
- [ ] **6.9** `make frontend-lint` passes. Commit the frontend.

## Phase 7: README

- [ ] **7.1** README: the three endpoints, the `predictions` module, the prediction screens. Commit phase 7.

## Finish

- [ ] **F.1** Check off 007 in the roadmap, set spec, plan and tasks to done
- [ ] **F.2** Code review of the branch by the `cto` subagent; fix the findings the project owner accepts
- [ ] **F.3** After approval of the project owner: push the branch and open a pull request
