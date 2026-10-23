# Mission

## Pitch

**F1 Prediction League** is a backend API for a Formula 1 prediction game. Before every Grand Prix, players predict the pole position and the podium. After the race the official results are imported, every prediction is scored and the season standings are updated.

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

- Authentication until roadmap item [007](roadmap.md#007-authentication). Until then a player is identified by an id in the URL.
- Roles and permissions. Every player has the same rights.
- Private leagues and invitations
- Sprint race predictions, constructors, fastest lap
- Frontend
- Automatic scheduled synchronization. Data is loaded through endpoints.

Some of these are listed as ideas for later in the [roadmap](roadmap.md).

## How the game works

### Race weekend

1. The season calendar and drivers are loaded from the official F1 data source.
2. Until the **deadline**, every player can submit a prediction for the race: pole position, P1, P2 and P3. Submitting again replaces the previous prediction.
3. The deadline is the start of the first competitive session of the weekend: sprint qualifying on sprint weekends, qualifying on the others. It always follows the current schedule.
4. Before the deadline a player sees only their own prediction. After the deadline all predictions for the race are public.
5. After the race the official results are imported and all predictions are scored.
6. If results change later, e.g. after a post-race penalty, they are imported again and all scores of the race are recalculated.
7. A cancelled race does not count. Its predictions earn no points.

### Prediction

- Pole position and three podium positions, all four are required
- P1, P2 and P3 are three different drivers. The pole driver may be any of them.
- Only drivers eligible in the race's season can be chosen

### Scoring

| Rule                                                         | Points |
|--------------------------------------------------------------|--------|
| Pole position correct                                        | 5      |
| Podium driver in the exact position (per driver)             | 10     |
| Podium driver on the podium, but in a different position     | 3      |
| Bonus: whole podium in the exact order                       | 10     |

Maximum for one race: 5 + 3 × 10 + 10 = **45 points**.

Example: the result is VER, NOR, LEC with pole NOR, and the prediction is VER, LEC, NOR with pole NOR. The score is 5 (pole) + 10 (VER exact) + 3 (LEC on podium) + 3 (NOR on podium) = **21 points**.

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
| Prediction  | One player's guess for one race: pole position, P1, P2 and P3              |
| Race result | The official qualifying and race result: pole position and podium          |
| Score       | Points a prediction earned, with a breakdown of what they were awarded for |
| Standings   | Season ranking of players by their total score                             |
