# 004 Authentication: plan

- **Status:** Approved (2026-11-06)
- **Spec:** [spec.md](spec.md)

This plan describes **how** the [spec](spec.md) is implemented. Every phase creates only what it uses itself, ends with green checks and its own commit, and is reviewed before the next one starts.

| Phase | Result                                                         | Spec items                    |
|-------|----------------------------------------------------------------|-------------------------------|
| 1     | Registration with email and password: `POST /v1/players`       | R1–R6, R12, AC1–AC8, T2       |
| 2     | Login: `POST /v1/auth/login`                                   | R7–R9, AC9, AC10, T1          |
| 3     | Access: token guard, `/v1/players/me`, removed `PATCH /{id}`   | R4, R10, AC12–AC16            |
| 4     | Frontend: session, login, registration, header, my profile     | R11, AC17–AC21                |
| 5     | Frontend: other players' profiles, expired session             | AC22                          |
| 6     | README and acceptance check                                    |                               |

After phase 3 the frontend of 003 cannot load profiles anymore, because they need a token. Phase 4 makes it work again; the branch is merged only after phase 6.

## Spec change: players created before 004

R12 and AC11 say that players created before this feature stay in the database without credentials. That would force `email` and `password_hash` to be nullable and the `Player` aggregate to handle a player without credentials forever, only for test data: the project has no production data.

The plan therefore changes R12 to: **the migration removes the players created before this feature**. Then every player has an email and a password hash, the columns are `not null` and the aggregate is always complete. AC11 is dropped. The spec was updated with the approval of this plan (2026-11-06).

## Where the code lives

Everything stays in the `players` module: a player's credentials belong to the player, and registration creates the player. Login and checking a token are use cases of the same module.

- The **token guard** is a provider of `PlayersModule`, registered globally as `APP_GUARD`, so every endpoint of every module is protected by default. It asks the players module through the `QueryBus`, like a controller does.
- Two decorators are shared by all modules' controllers and live in `src/shared/presentation/http/`: `@Public()` marks an endpoint that needs no token, `@CurrentPlayerId()` reads the player id the guard put on the request.
- A new error category `UnauthorizedError` in `src/shared/domain/errors.ts`, mapped to `401` by `ErrorResponseFilter`.

```
POST /v1/auth/login                            Any endpoint without @Public()
  → AuthController                               → AccessTokenGuard
  → QueryBus → LogInHandler                      → QueryBus → AuthenticateHandler
  → PlayerQueries.findCredentialsByEmail         → TokenService.verify → player id
  → PasswordHasher.verify                        → PlayerQueries.findById (player still exists)
  → TokenService.issue → { accessToken, expiresAt }  → request.playerId → @CurrentPlayerId()
```

Login and authentication are **queries**: they change no state, they read credentials and return a token or a player id.

## Technology

| Area             | Choice                                     | Reason |
|------------------|--------------------------------------------|--------|
| Password hashing | `scrypt` from `node:crypto`, random 16-byte salt, stored as `scrypt$<salt>$<hash>` | Slow and salted (T2), built into Node.js, no native dependency to build in Alpine. Same reasoning as `randomUUID()` and `fetch`. |
| Tokens           | `@nestjs/jwt` (HS256)                      | The NestJS way to sign and verify JWTs, used in its authentication recipe |
| Secret           | `JWT_SECRET` environment variable, at least 32 characters (T1) | Validated at startup in `environment.ts`. `compose.yaml` sets a development value, e2e tests use the same. |

The roadmap mentioned argon2; `scrypt` is chosen because it needs no extra package and is a recommended password hashing function as well.

---

## Phase 1: Registration with email and password

**Goal:** `POST /v1/players` takes `email`, `nickname` and `password`. The endpoint stays public, the rest of the API is unchanged in this phase.

### Domain

- `players/domain/email.value-object.ts`: `Email.create(raw)` trims and lowercases (R1), checks `^[^\s@]+@[^\s@]+\.[^\s@]+$` and at most 254 characters (R2), throws `InvalidEmail` (`Email is not valid`)
- `players/domain/password.value-object.ts`: `Password.create(raw)` checks 8 to 128 characters (R5), throws `InvalidPassword`. Holds the plain password only until it is hashed; it has no `toString` or `toJSON` that would print it (R6).
- `Player.create` becomes `Player.register({ id, email, nickname, passwordHash, now })`. The aggregate gets `email` and `passwordHash` (a string; hashing is not the domain's job). `reconstitute` takes them too.
- `players/domain/player.errors.ts`: `InvalidEmail`, `InvalidPassword` (`ValidationError`), `EmailAlreadyRegistered` (`ConflictError`)
- `PlayerRepository.existsWithEmail(email)`; `save` maps a violation of the email index to `EmailAlreadyRegistered`

### Application

- `players/application/ports/password-hasher.port.ts`: `PasswordHasher` with `hash(password)` and `verify(password, hash)`
- `CreatePlayerCommand` / `CreatePlayerHandler` become `RegisterPlayerCommand` / `RegisterPlayerHandler` (folder `register-player/`). Order: `Email.create`, `Nickname.create`, `Password.create` (the spec's error order), then `existsWithEmail` → 409, `existsWithNickname` → 409, `passwordHasher.hash`, `Player.register`, `save`.

### Infrastructure

- `players/infrastructure/security/scrypt-password-hasher.ts`: `ScryptPasswordHasher`, `verify` compares with `timingSafeEqual`
- `players/infrastructure/in-memory/fake-password-hasher.ts`: fast fake for unit tests (`hashed:<password>`)
- `PlayerRecord`: `email` (`varchar(254)`, unique index `players_email_unique`, emails are already lower case) and `passwordHash` (`varchar(255)`), both `not null`. Mapper and `InMemoryPlayerRepository` follow.
- Migration: delete all rows of `players`, then add the columns and the index (spec change above)

### Presentation

- `CreatePlayerRequest` becomes `RegisterPlayerRequest` with `email`, `nickname`, `password`, each `@IsString()`, in this order
- `PasswordHasher` bound in `PlayersModule`

### Tests

- Unit: `Email`, `Password`, `Player.register`, `RegisterPlayerHandler` (with `FakePasswordHasher`), `ScryptPasswordHasher` (hash differs from the password and between two calls, `verify` true and false)
- E2E: the existing tests register with an email and a password; new tests AC1 to AC8. AC8 checks the stored hash starts with `scrypt$` and the response contains no password.

---

## Phase 2: Login

**Goal:** `POST /v1/auth/login` returns an access token. The token is not checked by any endpoint yet.

- `src/config/environment.ts`: `JWT_SECRET` required, at least 32 characters (T1). `compose.yaml`: `JWT_SECRET` for the app with a development default, also used by `make test-e2e`. `.env.example`: `JWT_SECRET`.
- `src/shared/domain/errors.ts`: `UnauthorizedError`; `ErrorResponseFilter`: → `401`
- `players/application/ports/token-service.port.ts`: `TokenService` with `issue(playerId)` → `{ accessToken, expiresAt }` and `verify(token)` → player id or `null`
- `players/infrastructure/security/jwt-token-service.ts`: `JwtTokenService` with `JwtService` from `@nestjs/jwt`, payload `{ sub: playerId }`, expiry 7 days (R9). `JwtModule.registerAsync` in `PlayersModule` with the secret from `ConfigService`.
- `players/infrastructure/in-memory/fake-token-service.ts`: `token-<playerId>` for unit tests
- `PlayerQueries.findCredentialsByEmail(email)` → `{ playerId, passwordHash }` or `null`, in `SqlPlayerQueries` and `InMemoryPlayerQueries`
- `players/application/queries/log-in/`: `LogInQuery(email, password)`, `LogInHandler`: an email that `Email.create` rejects, an unknown email or a wrong password all throw `InvalidCredentials` (`UnauthorizedError`, `Invalid email or password`, R8)
- `players/presentation/http/auth.controller.ts`: `POST /v1/auth/login` returning `200`, `LogInRequest` (`email`, `password`, `@IsString()`)
- Package: `@nestjs/jwt` (dependency log)
- Tests: unit `LogInHandler`; e2e AC9, AC10 in `test/auth.e2e-spec.ts`; the app refuses to start with a short `JWT_SECRET` (unit test of `validateEnvironment`)

---

## Phase 3: Access

**Goal:** every endpoint except registration and login requires a token; a player acts only for themselves.

- `src/shared/presentation/http/public.decorator.ts`: `@Public()` (metadata read with `Reflector`)
- `src/shared/presentation/http/current-player-id.decorator.ts`: `@CurrentPlayerId()` param decorator
- `players/application/queries/authenticate/`: `AuthenticateQuery(token)`, `AuthenticateHandler`: `TokenService.verify`, then `PlayerQueries.findById`; a bad token or a missing player throws `InvalidAccessToken` (`Invalid or expired access token`)
- `players/presentation/http/access-token.guard.ts`: `AccessTokenGuard`; skips `@Public()` endpoints, missing or non-`Bearer` header → `AuthenticationRequired` (`Authentication required`), otherwise runs `AuthenticateQuery` and puts the player id on the request. Registered as `APP_GUARD` in `PlayersModule`.
- `PlayersController`:
  - `create` and `AuthController.logIn` get `@Public()`
  - `GET /v1/players/me` → `GetPlayerQuery(currentPlayerId)` → `MyPlayerResponse` (with `email`); declared before `:playerId`
  - `PATCH /v1/players/me` → `ChangeNicknameCommand(currentPlayerId, …)`
  - `PATCH /v1/players/:playerId` removed
  - `GET /v1/players/:playerId` → `PlayerResponse` as before, without `email` (R4)
- `PlayerReadModel` gets `email`, `SqlPlayerQueries.findById` selects it
- Tests: unit `AuthenticateHandler`; e2e AC12 to AC16 (an expired token is signed in the test with the same secret and a past expiry); existing player e2e tests send a token

---

## Phase 4: Frontend session, login, registration and my profile

**Goal:** a visitor registers or logs in, sees who is logged in and their own profile.

- `frontend/src/auth/session.ts`: the session as module state with Vue `ref`s (no Pinia): `accessToken` kept in `localStorage` until it expires or the player logs out (AC20), `logIn(email, password)`, `register(email, nickname, password)` (registers, then logs in), `logOut()`, `isLoggedIn`
- `api/client.ts`: sends `Authorization: Bearer <token>` when logged in
- `api/auth.ts`: `logIn`; `api/players.ts`: `registerPlayer`, `getMe`
- `views/LoginView.vue` (`/login`) and `views/RegisterView.vue` (`/register`, replaces `CreatePlayerView`): forms with labelled fields, password fields `type="password"`, the submit button disabled while a field is empty or while sending, the API error below the form with `role="alert"`, values kept after an error (AC19)
- The primary button styles of `NicknameForm` move to `base.css` as `.button-primary`, so all forms share them
- Router: `meta.public` on `/login` and `/register`; a `beforeEach` guard sends logged-out visitors to `/login` and logged-in players away from `/login` and `/register` (AC17, AC21)
- `AppHeader`: the logged-in player's nickname linking to `/` and "Log out" (`getMe` once after login and on page load)
- `components/PlayerCard.vue`: the timing tower card from `PlayerProfileView`, optionally with the email
- `views/MyProfileView.vue` (`/`): `getMe`, the card with email, change nickname with `PATCH /v1/players/me` (behavior of 003 AC10 to AC12); `api/players.ts`: `changeMyNickname` replaces `changeNickname(id, …)`

**Done when:** registering and logging in work in the browser and open my profile with my email (AC18), reload keeps the session, logout and the back button show the login screen.

---

## Phase 5: Frontend other players' profiles and expired session

- `PlayerProfileView` (`/players/:playerId`): uses `PlayerCard`, read only, without the change form
- `api/client.ts`: a `401` on any request except login forgets the token and opens `/login` with "Your session has expired. Please log in again." (AC22)

**Done when:** another player's profile opens without an email, and AC22 works in the browser.

---

## Phase 6: README and acceptance check

- README: the API table with the new and removed endpoints and the `Authorization` header, a short "Authentication" section, `JWT_SECRET` in the configuration, `curl` examples with login
- Go through AC1 to AC22 (backend by e2e tests, frontend in the browser)
- `make lint`, `make frontend-lint`, `make test`, `make test-e2e` pass

## Database

One migration in phase 1: `delete from players`, add `email varchar(254) not null`, `password_hash varchar(255) not null`, unique index `players_email_unique` on `email`.

## Dependencies

- `@nestjs/jwt` (runtime, phase 2), recorded in the tech-stack dependency log
- No frontend packages

## Constitution check

| Article | How this plan follows it |
|---------|--------------------------|
| 1 Workflow | spec, plan, tasks approved first; each phase creates only what it uses (e.g. `TokenService` arrives with login, the guard with phase 3) |
| 2 Modules | everything in `players`; other modules later use only `@Public()`, `@CurrentPlayerId()` from `shared` and the global guard |
| 3 Layers | the domain checks email and password rules but never hashes or signs; hashing and JWT are adapters in infrastructure; the guard uses the `QueryBus` |
| 4 Ports | `PasswordHasher` and `TokenService` are abstract classes with fake adapters for unit tests |
| 5 CQRS | registration is a command; login and authentication are queries, they change no state |
| 6 Domain | `Email` and `Password` value objects, `Player.register`; time and ids passed in by the handler |
| 7 API | `401` added by the amendment of 2026-11-06; errors keep the `{ "error" }` body |
| 8 Testing | unit tests for every rule and handler, e2e tests for every endpoint |
| 9 Tooling | `make` only; new dependency recorded |
