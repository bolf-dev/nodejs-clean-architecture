# 007 Predictions

- **Status:** Done (2026-11-10), amended 2026-11-10: the top 3 of qualifying instead of only the pole position, and the podium design.
- **Roadmap:** [007](../../product/roadmap.md#007-predictions)

## Why

Predicting is the game itself. With the races and the current grid of 006, a player can now predict the top 3 of qualifying and the podium of a race. Scoring follows in 008 and the deadline in 010, so this feature only collects and shows predictions.

## User stories

1. As a **player**, I want to predict the top 3 of qualifying and the podium of the race by picking drivers from the grid.
2. As a **player**, I want to change my prediction.
3. As a **player**, I want to see my predictions of the season on my profile.
4. As a **player**, I want to see the predictions of other players on their profiles, once they cannot help me anymore.

## Business rules

### Prediction

- **R1** A prediction belongs to one player and one race. It has the top 3 of qualifying (P1, which is the pole position, P2 and P3) and the podium of the race (P1, P2 and P3). All six are required.
- **R2** The three qualifying drivers are three different drivers, and the three race drivers are three different drivers. A driver may be in both.
- **R3** Drivers are given by their code (e.g. `VER`) and must be drivers of the race's season (the current grid of 006).
- **R4** A player has at most one prediction per race. Submitting again replaces the previous one; the time of the first submission is kept.
- **R5** A prediction keeps its drivers even when a driver later leaves the grid.
- **R6** Until the deadline (010), every race of a synced season can be predicted and a prediction can be changed at any time.

### Visibility

- **R7** A player always sees their own predictions.
- **R8** A player sees the predictions of another player only for finished races. Races become finished when their result is imported (008), so until then the predictions of other players are never shown.

## API contract

All endpoints require a token (004).

### `PUT /v1/races/{raceId}/predictions/me`

Submit or replace the logged-in player's prediction for the race. `qualifying.p1` is the pole position.

```json
{
  "qualifying": { "p1": "NOR", "p2": "VER", "p3": "LEC" },
  "race": { "p1": "VER", "p2": "NOR", "p3": "LEC" }
}
```

Response `204 No Content`.

| Status | When                                                         | `error`                                                   |
|--------|--------------------------------------------------------------|-----------------------------------------------------------|
| 400    | `raceId` is not a UUID                                       | `raceId must be a UUID`                                   |
| 400    | A field is missing or has the wrong type                     | e.g. `qualifying must be an object`, `race.p1 must be a string` |
| 400    | The qualifying drivers are not three different drivers (R2)  | `Qualifying P1, P2 and P3 must be three different drivers` |
| 400    | The race drivers are not three different drivers (R2)        | `Race P1, P2 and P3 must be three different drivers`      |
| 400    | A code is not a driver of the race's season (R3)             | `Driver "XYZ" is not a driver of the 2026 season`         |
| 404    | No race with this id                                         | `Race "…" not found`                                      |

### `GET /v1/races/{raceId}/predictions/me`

Response `200 OK`:

```json
{
  "raceId": "0199a1b2-7c3d-7e4f-8a5b-6c7d8e9f0a1b",
  "qualifying": { "p1": "NOR", "p2": "VER", "p3": "LEC" },
  "race": { "p1": "VER", "p2": "NOR", "p3": "LEC" },
  "submittedAt": "2026-11-10T09:00:00.000Z",
  "updatedAt": "2026-11-10T09:30:00.000Z"
}
```

| Status | When                                    | `error`                                   |
|--------|-----------------------------------------|-------------------------------------------|
| 400    | `raceId` is not a UUID                  | `raceId must be a UUID`                   |
| 404    | The player has no prediction for the race, or no race has this id | `Prediction not found`  |

### `GET /v1/players/{playerId}/predictions?season=2026`

The predictions of a player in a season, ordered by round. For the logged-in player all of them (R7), for another player only those of finished races (R8).

Response `200 OK`:

```json
{
  "predictions": [
    {
      "raceId": "0199a1b2-7c3d-7e4f-8a5b-6c7d8e9f0a1b",
      "round": 2,
      "raceName": "Chinese Grand Prix",
      "qualifying": { "p1": "NOR", "p2": "VER", "p3": "LEC" },
      "race": { "p1": "VER", "p2": "NOR", "p3": "LEC" },
      "submittedAt": "2026-11-10T09:00:00.000Z",
      "updatedAt": "2026-11-10T09:30:00.000Z"
    }
  ]
}
```

| Status | When                                            | `error`                    |
|--------|-------------------------------------------------|----------------------------|
| 400    | `playerId` is not a UUID                        | `playerId must be a UUID`  |
| 400    | `season` is missing or not a year               | `season must be a year`    |
| 404    | No player with this id                          | `Player "…" not found`     |

## Frontend

- **Race** (`/races/{raceId}`), section "Your prediction" above the driver cards:
  - Two podiums, "Qualifying" (P2, POLE, P3) and "Race" (P2, P1, P3): P1 in the middle on the highest step, P2 on the left, P3 on the right.
  - The first empty step is active; clicking a step makes it active.
  - Clicking a driver card puts the driver onto the active step and activates the next empty one.
  - Putting a driver onto a step of a podium where they already are moves them, so the three drivers of each podium stay different (R2). The two podiums are independent.
  - A driver card shows the steps of the driver, e.g. `POLE · RACE P2`.
  - "Save prediction" is enabled when all six steps are filled. After saving, the screen says so; an error of the API is shown above the button.
  - A saved prediction is loaded onto the steps when the race is opened.
- **My profile** (`/`), section "My predictions": the predictions of the current season, one row per race with round, race name, the three qualifying codes and the three race codes. Each row opens the race. Without predictions the section says so.
- **Player profile** (`/players/{playerId}`), section "Predictions": the visible predictions of the player in the current season, in the same rows. Without visible predictions it says that the predictions of other players are shown after the race.

## Acceptance criteria

### Submitting

- **AC1** Given a synced race, when I submit the top 3 of qualifying and the podium of the race with drivers of its season, then the response is `204` and `GET …/predictions/me` returns them (R1, R3).
- **AC2** Given I predicted a race, when I submit again with other drivers, then the prediction is replaced, `submittedAt` is unchanged and `updatedAt` is later (R4).
- **AC3** When the qualifying or the race drivers are not three different drivers, then the response is `400`; a driver may be in both (R2).
- **AC4** When a code is not a driver of the race's season, then the response is `400` (R3).
- **AC5** When the race does not exist, then the response is `404`.

### Reading

- **AC6** Given I have no prediction for a race, `GET …/predictions/me` returns `404`.
- **AC7** `GET /v1/players/{myId}/predictions?season=2026` returns my predictions ordered by round (R7).
- **AC8** `GET /v1/players/{otherId}/predictions?season=2026` returns an empty list, even when the other player has predictions (R8); an unknown player returns `404`.

### Frontend

- **AC9** When I open a race, fill both podiums from the driver cards and save, then reopening the race shows my prediction on the podiums.
- **AC10** When I open my profile, then I see my predictions of the season; the profile of another player shows that their predictions are shown after the race.

## Out of scope

- Results, scoring and finished races (008)
- Predictions of all players of a race (008)
- The deadline and locking predictions (010)
- Deleting a prediction
