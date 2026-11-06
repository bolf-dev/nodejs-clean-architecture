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

## 004 Season sync

- [ ] Spec, plan, tasks
- [ ] Implementation

Loading the calendar and drivers from the Jolpica F1 API through the `F1DataProvider` port.

- `POST /v1/seasons/{year}/sync`: load or update races and drivers of a season. Running it again updates changed session times.
- `GET /v1/races?season=2026`: calendar with deadlines and whether predictions are open
- `GET /v1/races/{raceId}`: race detail
- `GET /v1/drivers?season=2026`: drivers eligible in the season
- Data: `races` (season, round, name, circuit, country, session times, status `SCHEDULED` / `FINISHED` / `CANCELLED`), `drivers` (external id, code, number, name, team), `season_drivers`
- Whether a race is open for predictions is derived from its deadline and the `Clock` port, not stored
- Jolpica: `/{season}.json` (calendar with `Qualifying` and `SprintQualifying` times), `/{season}/drivers.json` (drivers without a team)

## 005 Predictions

- [ ] Spec, plan, tasks
- [ ] Implementation

Submitting predictions with the deadline and validation rules.

- `PUT /v1/races/{raceId}/predictions/{playerId}`: submit or replace a prediction `{ "pole": "NOR", "p1": "VER", "p2": "NOR", "p3": "LEC" }`
- `GET /v1/races/{raceId}/predictions/{playerId}`: one player's prediction
- `GET /v1/races/{raceId}/predictions`: all predictions of a race, only after the deadline
- Data: `predictions` (player, race, pole, P1, P2, P3, submitted and updated time)

## 006 Results and scoring

- [ ] Spec, plan, tasks
- [ ] Implementation

Importing official results and scoring all predictions of a race.

- `POST /v1/races/{raceId}/results/import`: import the result, mark the race `FINISHED`, score its predictions (domain event `RaceFinished`). Running it again recalculates all scores of the race.
- Prediction responses include the score and its breakdown
- Driver teams are filled from race results
- Data: `race_results` (pole, P1, P2, P3, imported time), `prediction_scores` (points, breakdown, calculated time)
- Jolpica: `/{season}/{round}/qualifying.json` (pole), `/{season}/{round}/results.json` (podium, constructors)

## 007 Standings and stats

- [ ] Spec, plan, tasks
- [ ] Implementation

Read models for the season ranking and player statistics.

- `GET /v1/standings?season=2026`: season standings with tie-breaking
- `GET /v1/players/{playerId}` extended with season stats: points, exact positions, perfect podiums, best race

## 008 Authentication

- [ ] Spec, plan, tasks
- [ ] Implementation

Players register with an email and a password and log in. Endpoints acting on behalf of a player take the player from the access token instead of the URL. Commands, handlers and the domain stay unchanged, mostly the presentation layer changes.

- Player creation from 002 is extended with an email and a password
- `POST /v1/auth/login`: email and password in, access token (JWT) out
- `GET /v1/players/me`: the logged-in player
- Prediction endpoints use the logged-in player, e.g. `PUT /v1/races/{raceId}/predictions/me`
- Ports `PasswordHasher` (argon2 adapter) and `TokenService` (JWT adapter). Checking the token is a NestJS guard in presentation.
- Data: credentials (player, unique email, password hash)

## 009 Quality

- [ ] Spec, plan, tasks
- [ ] Implementation

- GitHub Actions CI: lint, unit and functional tests, production image build
- OpenAPI documentation

## Ideas for later

- Private leagues with invite codes
- Roles, so that only an administrator can sync seasons and import results
- Scheduled sync of calendar and results
- Sprint race predictions
