# Roadmap

Each item becomes a spec in `docs/specs/NNN-feature-name/` (see [constitution](../constitution.md)). The game rules referenced below are described in [mission.md](mission.md).

## 001 Project setup

- [x] NestJS, PostgreSQL, Docker, Makefile

Done before spec-driven development was adopted, so it has no spec.

## 002 Architecture skeleton and players

Spec: [specs/002-players](../specs/002-players/spec.md)

- [x] Spec, plan, tasks
- [x] Implementation

The first vertical slice through all layers, which sets the patterns for everything after it.

- Module structure with layers, shared kernel, CQRS buses, ORM, migrations, test database, validation, error handling
- `POST /v1/players`: create a player with a nickname, without credentials until [008](#008-authentication). Nickname 3 to 20 characters (letters, digits, `-`, `_`), unique case-insensitive.
- `GET /v1/players/{playerId}`: player detail
- `PATCH /v1/players/{playerId}`: change the nickname
- Data: `players` (`id`, `nickname`, `created_at`, `updated_at`)

## 003 Frontend for players

Spec: [specs/003-frontend](../specs/003-frontend/spec.md)

- [x] Spec, plan, tasks
- [x] Implementation

A web frontend for the players endpoints of 002, in the style of Formula 1 TV graphics.

- Vue 3 in `frontend/`, running in Docker next to the backend
- Screens to create a player, see a player and change the nickname

## 004 Authentication

Spec: [specs/004-authentication](../specs/004-authentication/spec.md)

- [x] Spec, plan, tasks
- [x] Implementation

Players register with an email and a password and log in. Endpoints acting on behalf of a player take the player from the access token instead of the URL.

- Player creation from 002 is extended with an email and a password
- `POST /v1/auth/login`: email and password in, access token (JWT) out
- `GET /v1/players/me`: the logged-in player
- Changing the nickname uses the logged-in player: `PATCH /v1/players/me`. Later features act for the logged-in player from the start.
- Ports `PasswordHasher` (scrypt adapter) and `TokenService` (JWT adapter). Checking the token is a NestJS guard in presentation.
- Data: credentials (player, unique email, password hash)
- Frontend: the create player screen becomes registration, plus login and logout; the header shows the logged-in player

## 005 Players list

Spec: [specs/005-players-list](../specs/005-players-list/spec.md)

- [x] Spec, plan, tasks
- [x] Implementation

All players of the league, so a player can find others and open their profile.

- `GET /v1/players`: all players with id and nickname, ordered by nickname
- Frontend: players page linked from the header, each player opens their profile

## 006 Season sync

Spec: [specs/006-season-sync](../specs/006-season-sync/spec.md)

- [x] Spec, plan, tasks
- [ ] Implementation

Loading the calendar and drivers from the Jolpica F1 API through the `F1DataProvider` port.

- `make sync-season year=2026`: load or update races and drivers of a season. Running it again updates changed session times.
- `GET /v1/races?season=2026`: calendar
- `GET /v1/races/{raceId}`: race detail
- `GET /v1/drivers?season=2026`: the current grid of the season, with the team of each driver
- Jolpica: `/{season}.json` (calendar with `Qualifying` and `SprintQualifying` times), `/{season}/last/results.json` (the grid with teams), `/{season}/drivers.json` (drivers before the first race)
- Frontend: calendar of the season, race detail with driver cards in team colors (a color table in the frontend)

## 007 Predictions

- [ ] Spec, plan, tasks
- [ ] Implementation

Submitting predictions with the validation rules. Without a deadline yet: a prediction can be changed until the race result is imported.

- `PUT /v1/races/{raceId}/predictions/me`: submit or replace the logged-in player's prediction `{ "pole": "NOR", "p1": "VER", "p2": "NOR", "p3": "LEC" }`
- `GET /v1/races/{raceId}/predictions/me`: the logged-in player's prediction
- `GET /v1/players/{playerId}/predictions`: a player's predictions in a season; other players' predictions only for finished races
- Data: `predictions` (player, race, pole, P1, P2, P3, submitted and updated time)
- Frontend: a grid of driver cards (number, code, name, team color) to pick the pole and the podium P1, P2, P3; my predictions, and the predictions of other players on their profiles

## 008 Results and scoring

- [ ] Spec, plan, tasks
- [ ] Implementation

Importing official results and scoring all predictions of a race.

- `POST /v1/races/{raceId}/results/import`: import the result, mark the race `FINISHED`, score its predictions (domain event `RaceFinished`). Running it again recalculates all scores of the race.
- Scoring: 5 points for the pole, 10 for every podium driver in the exact position, at most 35
- `GET /v1/races/{raceId}/predictions`: all predictions of a race with their scores, only for a finished race
- Prediction responses include the score and its breakdown
- Data: `race_results` (pole, P1, P2, P3, imported time), `prediction_scores` (points, breakdown, calculated time)
- Jolpica: `/{season}/{round}/qualifying.json` (pole), `/{season}/{round}/results.json` (podium)
- Frontend: race result with all predictions and their points, points on the player's predictions; the top 3 of finished races in the calendar

## 009 Leaderboard

- [ ] Spec, plan, tasks
- [ ] Implementation

Read models for the season ranking and player statistics.

- `GET /v1/standings?season=2026`: season standings with tie-breaking
- `GET /v1/players/{playerId}` extended with season stats: points, exact positions, perfect podiums, best race
- Frontend: leaderboard page, stats on the player profile

## 010 Deadline

- [ ] Spec, plan, tasks
- [ ] Implementation

Predictions are locked at the deadline of the race, as described in the mission.

- The deadline is derived from the session times of the race and compared with the time from the `Clock` port, not stored
- Submitting or changing a prediction after the deadline is rejected
- All predictions of a race become public at the deadline instead of with the result
- Race responses show the deadline and whether predictions are open
- Frontend: the deadline and a countdown on the race, a locked prediction after the deadline

## 011 Quality

- [ ] Spec, plan, tasks
- [ ] Implementation

- GitHub Actions CI: lint, unit and functional tests, production image build
- OpenAPI documentation

## Ideas for later

- Private leagues with invite codes
- Roles, so that only an administrator can sync seasons and import results
- Scheduled sync of calendar and results
- Sprint race predictions
- Driver photos on the driver cards
