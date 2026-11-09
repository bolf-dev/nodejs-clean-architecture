# 005 Players list

- **Status:** Done (2026-11-09)
- **Roadmap:** [005](../../product/roadmap.md#005-players-list)

## Why

A logged-in player can open another player's profile only by knowing its URL. A list of all players of the league lets them find the others. It is also the first list screen, a pattern the leaderboard and the predictions will follow.

## User stories

1. As a **player**, I want to see all players of the league, so that I can find the others.
2. As a **player**, I want to open a player's profile from the list.

## Business rules

- **R1** The list contains every registered player, including the logged-in one.
- **R2** Players are ordered by nickname, ignoring letter case.
- **R3** The list shows only the id and the nickname, never the email (R4 of [004](../004-authentication/spec.md#email)).

## API contract

### `GET /v1/players` (auth)

Response `200 OK`:

```json
{
  "players": [
    { "id": "0199a1b2-7c3d-7e4f-8a5b-6c7d8e9f0a1b", "nickname": "Ferrari_Fan" },
    { "id": "0199a1b2-8d4e-7f50-9b6c-7d8e9f0a1b2c", "nickname": "JohnDoe" }
  ]
}
```

The list is wrapped in an object, so fields like paging can be added later without breaking clients.

| Status | When                                       | `error`                           |
|--------|--------------------------------------------|-----------------------------------|
| 401    | No token, or an invalid or expired one     | as in [004](../004-authentication/spec.md#errors-of-every-auth-endpoint) |

## Frontend

- A new screen `/players` with all players, in the design of [003](../003-frontend/spec.md#design): rows like the timing tower, one player per row.
- The header gets a "Players" link to it.
- Every row opens the player's profile. The logged-in player's row is marked "You" and opens `/`.
- While the list loads, the screen shows a loading state; errors follow B4 of 003.

## Acceptance criteria

- **AC1** Given players `johndoe`, `Ferrari_Fan` and `Alonso_Fan` exist, when I request the list, then I get them ordered `Alonso_Fan`, `Ferrari_Fan`, `johndoe` with `id` and `nickname` only (R1, R2, R3).
- **AC2** Given no token, then I get `401`.
- **AC3** Given I am logged in, when I open "Players" in the header, then I see all players in this order, my row marked "You".
- **AC4** Given I click another player's row, then I see their profile; my own row opens my profile.

## Out of scope

- Paging and search. The league is small; paging can be added inside the response object later.
- Statistics or points in the list, until the leaderboard ([009](../../product/roadmap.md#009-leaderboard))
