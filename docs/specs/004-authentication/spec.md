# 004 Authentication

- **Status:** Done (2026-11-09)
- **Roadmap:** [004](../../product/roadmap.md#004-authentication)

## Why

Today anyone can create a player and change any player's nickname by knowing their id. Every later feature (predictions, my predictions, other players' predictions) needs to know who is acting. Players therefore register with an email and a password, log in and act as themselves. Everything except registering and logging in requires being logged in.

## User stories

1. As a **visitor**, I want to register with an email, a nickname and a password, so that I can take part in the league.
2. As a **visitor**, I want to log in with my email and password, so that I can act as my player.
3. As a **player**, I want to see my own profile, including my email.
4. As a **player**, I want to change my nickname, and nobody else should be able to change it.
5. As a **player**, I want to see another player's profile, without their email.
6. As a **player**, I want to log out.

## Business rules

The nickname rules R1 to R9 of [002](../002-players/spec.md#business-rules) stay unchanged.

### Email

- **R1** Leading and trailing whitespace is removed and the email is stored in lower case.
- **R2** The email has the form `local@domain` with a dot in the domain, no whitespace, and at most 254 characters.
- **R3** The email is unique. Because of R1, `JohnDoe@Example.com` and `johndoe@example.com` are the same email.
- **R4** The email cannot be changed and is shown only to the player it belongs to.

### Password

- **R5** The password is 8 to 128 characters long. It is used exactly as entered, whitespace included.
- **R6** The password is never stored or logged in plain text and never returned by the API.

### Login and access

- **R7** Logging in with an email and the matching password returns an access token. The email is matched after R1, so letter case does not matter.
- **R8** A wrong email and a wrong password give the same error, so the API does not reveal which emails are registered.
- **R9** The access token is valid for 7 days. It cannot be refreshed; after it expires the player logs in again.
- **R10** Every endpoint except registering and logging in requires a valid access token. The token identifies the player; endpoints acting for a player use the player from the token, never an id from the URL.
- **R11** Logging out only forgets the token in the browser. The API keeps no list of logged-in sessions.
- **R12** Players created before this feature have no email and password. They are removed when this feature is deployed; the project has no production data. (Changed on 2026-11-06 with the approval of the plan.)

## API contract

Times are in UTC, in ISO 8601 format. Endpoints marked **auth** require the header `Authorization: Bearer <accessToken>`.

| Method  | Path                       | Auth | Change against 002                          |
|---------|----------------------------|------|---------------------------------------------|
| `POST`  | `/v1/players`              | no   | registration: adds `email` and `password`   |
| `POST`  | `/v1/auth/login`           | no   | new                                         |
| `GET`   | `/v1/players/me`           | auth | new                                         |
| `PATCH` | `/v1/players/me`           | auth | new, replaces `PATCH /v1/players/{playerId}` |
| `GET`   | `/v1/players/{playerId}`   | auth | now requires a token                        |
| `PATCH` | `/v1/players/{playerId}`   | –    | removed, unknown route `404`                |

### Errors of every auth endpoint

| Status | When                                                    | `error`                             |
|--------|---------------------------------------------------------|-------------------------------------|
| 401    | The `Authorization` header is missing or not `Bearer`   | `Authentication required`           |
| 401    | The token is invalid, expired, or its player no longer exists | `Invalid or expired access token` |

### `POST /v1/players`

Registers a player.

Request:

```json
{ "email": "johndoe@example.com", "nickname": "JohnDoe", "password": "correct-horse" }
```

Response `201 Created`, with the header `Location: /v1/players/{id}`:

```json
{ "id": "0199a1b2-7c3d-7e4f-8a5b-6c7d8e9f0a1b" }
```

| Status | When                                                          | Example `error`                                     |
|--------|---------------------------------------------------------------|-----------------------------------------------------|
| 400    | `email`, `nickname` or `password` is missing or not a string  | `email must be a string`                            |
| 400    | The email breaks R2                                           | `Email is not valid`                                |
| 400    | The nickname breaks a rule of 002                             | `Nickname must be 3 to 20 characters long`          |
| 400    | The password breaks R5                                        | `Password must be 8 to 128 characters long`         |
| 409    | The email is taken (R3)                                       | `Email "johndoe@example.com" is already registered` |
| 409    | The nickname is taken                                         | `Nickname "johndoe" is already taken`               |

When several values are invalid, only the first error is returned, in the order email, nickname, password.

### `POST /v1/auth/login`

Request:

```json
{ "email": "johndoe@example.com", "password": "correct-horse" }
```

Response `200 OK`:

```json
{ "accessToken": "eyJhbGciOi…", "expiresAt": "2026-11-13T10:15:00.000Z" }
```

| Status | When                                          | `error`                      |
|--------|-----------------------------------------------|------------------------------|
| 400    | `email` or `password` is missing or not a string | `email must be a string`  |
| 401    | No player has the email, or the password is wrong (R8) | `Invalid email or password` |

### `GET /v1/players/me` (auth)

Response `200 OK`, the logged-in player including the email:

```json
{
  "id": "0199a1b2-7c3d-7e4f-8a5b-6c7d8e9f0a1b",
  "email": "johndoe@example.com",
  "nickname": "JohnDoe",
  "createdAt": "2026-10-23T10:15:00.000Z",
  "updatedAt": "2026-10-23T10:15:00.000Z"
}
```

### `PATCH /v1/players/me` (auth)

Changes the logged-in player's nickname, with the rules and errors of `PATCH /v1/players/{playerId}` in 002 except `404`.

Request `{ "nickname": "Ferrari_Fan" }`, response `204 No Content`.

### `GET /v1/players/{playerId}` (auth)

Unchanged from 002: `id`, `nickname`, `createdAt`, `updatedAt`, never the email (R4).

## Frontend

The screens of [003](../003-frontend/spec.md) keep their design and behavior rules B1 to B5.

| Path                  | Logged in | Screen |
|-----------------------|-----------|--------|
| `/login`              | no        | Email and password, a link to registration. On success opens `/`. |
| `/register`           | no        | Email, nickname and password, a link to login. On success logs in and opens `/`. Replaces the create player screen. |
| `/`                   | yes       | My profile: nickname, email, dates, change nickname |
| `/players/{playerId}` | yes       | Another player's profile, read only, without email |

- A logged-out visitor opening any other screen is sent to `/login`. A logged-in player opening `/login` or `/register` is sent to `/`.
- The header shows the logged-in player's nickname, linking to `/`, and a "Log out" button. Logging out forgets the token and opens `/login`.
- The token is kept in the browser until it expires or the player logs out, so reloading the page keeps the player logged in.
- When the API answers `401` on any screen except login, the token is forgotten and `/login` shows "Your session has expired. Please log in again."
- Password fields hide what is typed. The frontend checks only that the fields are not empty (like B3 of 003), all other rules stay in the backend.

## Acceptance criteria

### Registration

- **AC1** Given I register `johndoe@example.com`, `JohnDoe`, `correct-horse`, then I get `201` with an id and a `Location` header, and I can log in with them.
- **AC2** Given I register `"  JohnDoe@Example.COM "`, then the stored email is `johndoe@example.com` (R1).
- **AC3** Given I register `johndoe`, `john doe@example.com` or `john@example`, then I get `400` `Email is not valid` (R2).
- **AC4** Given `johndoe@example.com` is registered, when I register `JOHNDOE@example.com`, then I get `409` and no second player is created (R3).
- **AC5** Given I register a password of 7 characters, then I get `400`; 8 and 128 characters are accepted, 129 are not (R5).
- **AC6** Given the nickname is invalid or taken, then I get the `400` or `409` of 002.
- **AC7** Given `email`, `nickname` or `password` is missing, then I get `400`.
- **AC8** No response and no log line contains the password; the database holds only a hash of it (R6).

### Login

- **AC9** Given a registered player, when I log in with their email in any letter case and the right password, then I get `200` with `accessToken` and `expiresAt` 7 days ahead (R7, R9).
- **AC10** Given a wrong password, or an email nobody registered, then I get `401` `Invalid email or password` in both cases (R8).
- **AC11** Dropped on 2026-11-06: players created before this feature are removed (R12).

### Access

- **AC12** Given no `Authorization` header, when I call any auth endpoint, then I get `401` `Authentication required`.
- **AC13** Given a token that is malformed, signed with another key or expired, then I get `401` `Invalid or expired access token`.
- **AC14** Given a valid token, `GET /v1/players/me` returns my player with my email.
- **AC15** Given a valid token, `GET /v1/players/{playerId}` of another player returns their profile without an email (R4).
- **AC16** Given a valid token, `PATCH /v1/players/me` changes my nickname with the rules of 002, and `PATCH /v1/players/{playerId}` returns `404`.

### Frontend

- **AC17** Given I am logged out, when I open `/` or a profile, then I see the login screen.
- **AC18** Given I register in the browser, then I am logged in and see my profile with my email.
- **AC19** Given I log in with a wrong password, then I see `Invalid email or password` and the email stays in the field.
- **AC20** Given I am logged in and reload the page, then I am still logged in.
- **AC21** Given I log out, then I see the login screen, and the back button does not show my profile.
- **AC22** Given my token has expired, when a screen calls the API, then I see the login screen with "Your session has expired. Please log in again."

## Technical acceptance criteria

- **T1** The app refuses to start when the secret for signing tokens is missing or shorter than 32 characters.
- **T2** Passwords are hashed with a slow, salted password hashing algorithm.

## Constitution

Article 7 lists the status codes the API uses and has no `401`. Approving this spec includes amending article 7 with: `401` the request needs a valid access token, or the login credentials are wrong.

## Out of scope

- Email verification, password reset, changing the email or the password
- Refresh tokens and revoking tokens on the server
- Limiting login attempts
- Roles and administrators
- Returning to the requested screen after logging in
- Deleting a player
