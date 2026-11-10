# Mission

## Pitch

**F1 Prediction League** is a web app for a Formula 1 prediction game: a NestJS API with a Vue frontend. Before every Grand Prix, players predict the top 3 of qualifying and the podium of the race. After the race the official results are imported, every prediction is scored and the season standings are updated.

## Why this project exists

It is a portfolio project. It shows how to build a Node.js backend with **Clean Architecture**, **CQRS** and **ports & adapters**, developed with **spec-driven development**.

The game is easy to understand, but it has real business rules (deadlines, validation, scoring) and a real external integration (official F1 data). That gives the architecture a reason to exist instead of wrapping plain CRUD.

## Goals

- Business rules live in a pure TypeScript domain, without framework or ORM code
- Clear split between the write side (commands through domain entities) and the read side (queries returning read models straight from SQL)
- The application layer depends only on ports. Infrastructure provides the adapters: database, external F1 API, clock.
- The whole project runs in Docker and starts with one command
- Every business rule and every endpoint is covered by tests

## Non-goals

- Roles and permissions. Every player has the same rights.
- Private leagues and invitations
- Sprint race predictions, constructors, fastest lap
- Driver photos. Drivers are shown as cards with number, code, name and team color.
- Automatic scheduled synchronization. Data is loaded with `make` commands.

Some of these are listed as ideas for later in the [roadmap](roadmap.md).

## How the game works

### Race weekend

1. The season calendar and drivers are loaded from the official F1 data source.
2. Until the **deadline**, every player can submit a prediction for the race: the top 3 of qualifying (P1 is the pole position) and the podium of the race, picked from a grid of the season's drivers. Submitting again replaces the previous prediction.
3. The deadline is the start of the first competitive session of the weekend: sprint qualifying on sprint weekends, qualifying on the others. It always follows the current schedule.
4. Before the deadline a player sees only their own prediction. After the deadline all predictions for the race are public.
5. After the race the official results are imported and all predictions are scored.
6. If results change later, e.g. after a post-race penalty, they are imported again and all scores of the race are recalculated.
7. A cancelled race does not count. Its predictions earn no points.

The deadline is the last game feature, roadmap item [010](roadmap.md#010-deadline). Until then a prediction can be changed until the race result is imported, and the predictions of other players become public with the result.

### Prediction

- The top 3 of qualifying (P1, which is the pole position, P2, P3) and the podium of the race (P1, P2, P3), all six are required
- The three qualifying drivers are different, and the three race drivers are different. A driver may be in both.
- Only drivers eligible in the race's season can be chosen

### Scoring

| Rule                                             | Points |
|--------------------------------------------------|--------|
| Qualifying driver in the exact position (per driver, P1 is the pole) | 5      |
| Race podium driver in the exact position (per driver)                 | 10     |

A driver in a different position earns nothing. Maximum for one race: 3 × 5 + 3 × 10 = **45 points**.

Example: qualifying ends NOR, VER, LEC and the race VER, NOR, LEC. The prediction is NOR, LEC, VER for qualifying and VER, LEC, NOR for the race. The score is 5 (NOR on pole) + 10 (VER wins) = **15 points**.

### Standings

- Players are ranked by total points in the season
- Ties are broken by the number of exact podium positions, then by the number of perfect podiums. Players still equal share the rank.
- Only players with at least one scored prediction appear in the standings

## Glossary

| Term        | Meaning                                                                    |
|-------------|----------------------------------------------------------------------------|
| Season      | One F1 year, e.g. 2026                                                     |
| Race        | One Grand Prix weekend, identified by season and round                     |
| Deadline    | The moment predictions for a race are locked                               |
| Prediction  | One player's guess for one race: the top 3 of qualifying and the podium    |
| Race result | The official result: the top 3 of qualifying and the podium of the race    |
| Score       | Points a prediction earned, with a breakdown of what they were awarded for |
| Standings   | Season ranking of players by their total score                             |
