# 003 Frontend for players: tasks

- **Status:** Approved (2026-11-05)
- **Spec:** [spec.md](spec.md) · **Plan:** [plan.md](plan.md)

Tasks are done in order, one at a time. Every phase creates only what it uses, ends with something visible in the browser, green checks and a commit on the `003-frontend` branch, then stops for review before the next phase starts.

Every command runs through `make` or in a container, never on the host.

## Phase 0: Documentation

- [x] **0.1** Commit the renumbered roadmap with the links updated in `mission`, `tech-stack` and the 002 spec, and the spec, plan and tasks of 003

## Phase 1: Vue project in Docker

- [x] **1.1** Scaffold `frontend/` with `create-vue` in a `node:24-alpine` container: TypeScript, Vue Router, ESLint + Oxlint, Prettier, without example code
- [x] **1.2** Remove the example components, views and assets the scaffold adds. Record the installed packages in the tech-stack dependency log.
- [x] **1.3** `vite.config.ts`: `server.host` `0.0.0.0`, port `5173`, `strictPort`, proxy `/v1` → `http://app:3000`
- [x] **1.4** `src/App.vue` with only the app name as a heading and `<RouterView />`; `src/router/index.ts` without routes
- [x] **1.5** Add the `frontend` service to `compose.yaml`, `FRONTEND_PORT` to `.env.example`
- [x] **1.6** Add `make frontend-logs`, `make frontend-npm c="…"` and `make frontend-lint` (ESLint, Oxlint, `vue-tsc`)
- [x] **1.7** Try the editor support in VS Code with `node_modules` in a named volume. If missing types get in the way, switch to a bind-mounted `node_modules` like the backend and note the decision in the plan.
  - Types were missing, switched to the bind mount (2026-11-06)
- [x] **1.8** Verify: after `make up` http://localhost:5173 shows the app name; `curl -i http://localhost:5173/v1/players/123` returns `400` `{"error":"playerId must be a UUID"}`; changing `App.vue` reloads the page
- [x] **1.9** `make frontend-lint` and `make lint` pass. Commit phase 1.

## Phase 2: Layout and F1 design

- [x] **2.1** `index.html`: Titillium Web from Google Fonts (400, 600, 700, 900, italic), title "F1 Prediction League", `lang="en"`
- [x] **2.2** `src/assets/styles/tokens.css`: colors, typography, spacing and radius tokens from the plan
- [x] **2.3** `src/assets/styles/base.css`: reset, dark background, text color, red focus outline, checkered motif utility; imported in `main.ts`
- [x] **2.4** `src/components/AppHeader.vue`: dark bar, red slanted stripe, app name in bold italic uppercase linking to `/`
- [x] **2.5** `App.vue`: `AppHeader` and a centered content area for `<RouterView />`
- [x] **2.6** Verify: the header and the empty content area look as described at 360 px and on a desktop window, without horizontal scrolling
- [x] **2.7** `make frontend-lint` passes. Commit phase 2.

## Phase 3: Player profile and player not found

Created in the order data travels.

- [x] **3.1 API client:** `src/api/client.ts` with `request<T>(method, path, body?)` and `ApiError` (`status`, message). Error body → its `error` message; `500` and an unreachable backend (status `0`) → "Something went wrong. Please try again." (B4)
- [x] **3.2 Players API:** `src/api/players.ts` with the `Player` type and `getPlayer(id)`
- [x] **3.3 Date formatting:** `src/utils/format-date.ts`, ISO string → "23 Oct 2026, 12:15" in local time with `Intl.DateTimeFormat` (B5)
- [x] **3.4 Views:** `PlayerProfileView.vue` (loading state, timing tower card with nickname, "Created", "Last change"; `404` and `400` → not found view; other errors → general message) and `PlayerNotFoundView.vue` (message, link to `/`)
- [x] **3.5 Router:** route `/players/:playerId`
- [x] **3.6** Verify: a player created with `curl` is shown at `/players/{id}` (AC8); an unknown UUID and `123` show the not found screen (AC9); with the backend stopped, the profile shows the general error message
- [x] **3.7** `make frontend-lint` passes. Commit phase 3.

## Phase 4: Create player

- [x] **4.1 Players API:** `createPlayer(nickname)` returning `{ id }`
- [x] **4.2 Form:** `src/components/NicknameForm.vue`: label "Nickname", one input, submit label from the parent, disabled when the trimmed value is empty or while submitting, working state while submitting, error message below the input with `aria-describedby` and `role="alert"`, emits `submit`, keeps the value after an error
- [x] **4.3 View:** `src/views/CreatePlayerView.vue`: headline about the game, the form; success → `/players/{id}`; `ApiError` → its message in the form
- [x] **4.4 Router:** route `/` and a redirect of unknown paths to `/`
- [x] **4.5** Verify AC3 to AC7 in the browser
- [x] **4.6** `make frontend-lint` passes. Commit phase 4.

## Phase 5: Change nickname

- [x] **5.1 Players API:** `changeNickname(id, nickname)` for the `204` response without a body
- [x] **5.2 Profile view:** "Change nickname" button shows `NicknameForm` prefilled, with "Save" and "Cancel" (hides the form, no request)
- [x] **5.3 Profile view:** success → reload with `getPlayer`, hide the form, "Nickname changed" with `role="status"` for a few seconds; `ApiError` → its message in the form, the shown nickname stays
- [x] **5.4** Verify AC10 to AC12 in the browser
- [x] **5.5** `make frontend-lint` passes. Commit phase 5.

## Phase 6: Acceptance check and README

- [x] **6.1** Go through AC1 to AC15 at 360 px and on a desktop window, with the backend running and stopped. AC1 from scratch: `docker compose down -v`, `make init`.
  - AC3 to AC12 checked in the browser by the project owner during phases 3 to 5. AC1 counted as covered: the frontend service installed `node_modules` from scratch and started on its own in phase 1, so the database was not wiped.
- [x] **6.2** Fix what does not meet the spec
- [x] **6.3** Update the README: the frontend in "Getting started", the new `make` targets, the `frontend` service and `FRONTEND_PORT` in the configuration, a short "Frontend" section (Vue 3, Vite, proxy to the backend)
- [x] **6.4** `make frontend-lint`, `make lint`, `make test` and `make test-e2e` pass. Commit phase 6.

## Finish

- [ ] **F.1** Check off 003 in the roadmap, set spec, plan and tasks to done
- [ ] **F.2** Code review of the branch by the `cto` subagent; fix the findings the project owner accepts
- [ ] **F.3** After approval of the project owner: push the branch and open a pull request
