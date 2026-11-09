# 004 Authentication: tasks

- **Status:** Approved (2026-11-06)
- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

Tasks are done in order, one at a time. Every phase creates only what it uses, ends with green checks and a commit on the `004-authentication` branch, then stops for review before the next phase starts.

Every command runs through `make`, never on the host.

## Phase 0: Documentation

- [x] **0.1** Commit the spec, plan and tasks of 004 and the constitution amendment (401)

## Phase 1: Registration with email and password

- [x] **1.1 Domain:** `Email` (R1, R2) and `Password` (R5, R6) value objects, `InvalidEmail`, `InvalidPassword`, `EmailAlreadyRegistered`
- [x] **1.2 Domain:** `Player.register` replaces `Player.create`, the aggregate gets `email` and `passwordHash`; `reconstitute` takes them; `PlayerRepository.existsWithEmail`
- [x] **1.3 Application:** `PasswordHasher` port; `RegisterPlayerCommand` and `RegisterPlayerHandler` replace `CreatePlayer…` (validation order email, nickname, password, then the two uniqueness checks)
- [x] **1.4 Infrastructure:** `ScryptPasswordHasher`, `FakePasswordHasher`; `PlayerRecord` with `email` and `passwordHash`, mapper, `MikroOrmPlayerRepository` (`existsWithEmail`, email index violation → `EmailAlreadyRegistered`), `InMemoryPlayerRepository`
- [x] **1.5 Migration:** generate with `make migration`, add `delete from players` before the new `not null` columns, review the SQL, `make migrate`
- [x] **1.6 Presentation:** `RegisterPlayerRequest` (`email`, `nickname`, `password`), controller and `PlayersModule` binding of `PasswordHasher`
- [x] **1.7 Tests:** unit tests of `Email`, `Password`, `Player.register`, `RegisterPlayerHandler`, `ScryptPasswordHasher`; existing e2e tests register with email and password; e2e AC1 to AC8
- [x] **1.8** `make test`, `make test-e2e` and `make lint` pass. Commit phase 1.

## Phase 2: Login

- [x] **2.1 Configuration:** `JWT_SECRET` in `validateEnvironment` (required, at least 32 characters) with a unit test (T1); development value in `compose.yaml`, `.env.example`
- [x] **2.2 Errors:** `UnauthorizedError` category, mapped to `401` in `ErrorResponseFilter`
- [x] **2.3 Tokens:** install `@nestjs/jwt` (dependency log); `TokenService` port, `JwtTokenService` (7 days, `sub` = player id), `FakeTokenService`; `JwtModule.registerAsync` in `PlayersModule`
- [x] **2.4 Query:** `PlayerQueries.findCredentialsByEmail` (SQL and in-memory); `LogInQuery`, `LogInHandler`, `InvalidCredentials`
- [x] **2.5 Presentation:** `AuthController` with `POST /v1/auth/login` (`200`), `LogInRequest`
- [x] **2.6 Tests:** unit `LogInHandler`; e2e AC9, AC10 in `test/auth.e2e-spec.ts`
- [x] **2.7** `make test`, `make test-e2e` and `make lint` pass. Commit phase 2.

## Phase 3: Access

- [x] **3.1 Shared:** `@Public()` and `@CurrentPlayerId()` decorators
- [x] **3.2 Query:** `AuthenticateQuery`, `AuthenticateHandler`, `InvalidAccessToken`, `AuthenticationRequired`
- [x] **3.3 Guard:** `AccessTokenGuard`, registered as `APP_GUARD` in `PlayersModule`; registration and login marked `@Public()`
- [x] **3.4 Endpoints:** `GET /v1/players/me` with `MyPlayerResponse`, `PATCH /v1/players/me`, `PATCH /v1/players/:playerId` removed; `PlayerReadModel` with `email`, `PlayerResponse` without it
- [x] **3.5 Tests:** unit `AuthenticateHandler`; e2e AC12 to AC16; existing e2e tests send a token
- [x] **3.6** `make test`, `make test-e2e` and `make lint` pass. Commit phase 3.

## Phase 4: Frontend session, login, registration and my profile

- [x] **4.1 Session:** `src/auth/session.ts` (token in `localStorage`, `logIn`, `register`, `logOut`, `isLoggedIn`); `api/client.ts` sends the `Authorization` header; `api/auth.ts`, `registerPlayer` and `getMe` in `api/players.ts`
- [x] **4.2 Styles:** primary button styles from `NicknameForm` move to `base.css` as `.button-primary`
- [x] **4.3 Views:** `LoginView` (`/login`) and `RegisterView` (`/register`, replaces `CreatePlayerView`)
- [x] **4.4 Router:** `meta.public`, `beforeEach` guard for logged-out and logged-in players
- [x] **4.5 Header:** nickname of the logged-in player linking to `/` and "Log out"
- [x] **4.6 My profile:** `PlayerCard` component from `PlayerProfileView`, `MyProfileView` at `/` with email and change nickname through `PATCH /v1/players/me` (`changeMyNickname` replaces `changeNickname`)
- [x] **4.7** Verify in the browser: AC17 to AC21
- [x] **4.8** `make frontend-lint` passes. Commit phase 4.

## Phase 5: Frontend other players' profiles and expired session

- [x] **5.1** `PlayerProfileView` uses `PlayerCard`, read only, without email
  - Done in phase 4: removing `changeNickname(id, …)` from the API client left the old change form without an endpoint
- [ ] **5.2** `api/client.ts`: `401` outside login forgets the token and opens `/login` with "Your session has expired. Please log in again."
- [ ] **5.3** Verify in the browser: another player's profile and AC22
- [ ] **5.4** `make frontend-lint` passes. Commit phase 5.

## Phase 6: README and acceptance check

- [ ] **6.1** Update the README: API table and `Authorization` header, "Authentication" section, `JWT_SECRET`, `curl` examples with login
- [ ] **6.2** `make lint`, `make frontend-lint`, `make test` and `make test-e2e` pass. Commit phase 6.

## Finish

- [ ] **F.1** Check off 004 in the roadmap, set spec, plan and tasks to done
- [ ] **F.2** Code review of the branch by the `cto` subagent; fix the findings the project owner accepts
- [ ] **F.3** After approval of the project owner: push the branch and open a pull request
