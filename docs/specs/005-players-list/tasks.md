# 005 Players list: tasks

- **Status:** Approved (2026-11-09)
- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

Tasks are done in order. Every phase ends with green checks and a commit on the `005-players-list` branch, then stops for review.

## Phase 0: Documentation

- [x] **0.1** Commit the spec, plan and tasks of 005

## Phase 1: `GET /v1/players`

- [x] **1.1** `PlayerListItem` read model, `PlayerQueries.listAll()` in `SqlPlayerQueries` and `InMemoryPlayerQueries`
- [x] **1.2** `ListPlayersQuery`, `ListPlayersHandler`, `PlayersListResponse`, `PlayersController.list`
- [x] **1.3** Tests: unit `ListPlayersHandler`; e2e AC1, AC2
- [x] **1.4** `make test`, `make test-e2e` and `make lint` pass. Commit phase 1.

## Phase 2: Players screen

- [x] **2.1** `listPlayers()` in `api/players.ts`, `PlayersView` at `/players`, "Players" link in the header
- [x] **2.2** Verify in the browser: AC3, AC4
- [x] **2.3** `make frontend-lint` passes. Commit phase 2.

## Phase 3: README

- [ ] **3.1** README: `GET /v1/players` in the API table, the players screen in the frontend section. Commit phase 3.

## Finish

- [ ] **F.1** Check off 005 in the roadmap, set spec, plan and tasks to done
- [ ] **F.2** Code review of the branch by the `cto` subagent; fix the findings the project owner accepts
- [ ] **F.3** After approval of the project owner: push the branch and open a pull request
