# 003 Frontend for players: plan

- **Status:** Approved (2026-11-05)
- **Spec:** [spec.md](spec.md)

This plan describes **how** the [spec](spec.md) is implemented. Every phase creates only what it uses itself, ends with something visible in the browser and its own commit, and is reviewed before the next one starts.

| Phase | Result                                                          | Spec items                 |
|-------|-----------------------------------------------------------------|----------------------------|
| 1     | Vue project in Docker, API reachable through the dev server     | AC1, AC2                   |
| 2     | Layout and F1 design                                            | Common layout, design      |
| 3     | Player profile and player not found (`GET`)                     | AC8, AC9, B4, B5           |
| 4     | Create player (`POST`)                                          | AC3–AC7, B1–B4             |
| 5     | Change nickname (`PATCH`)                                       | AC10–AC12                  |
| 6     | Acceptance check and README                                     | AC13–AC15                  |

The profile comes before creating a player, so creating a player can open an existing profile screen right away.

## Technology

| Area             | Choice                                         | Reason                                                       |
|------------------|------------------------------------------------|--------------------------------------------------------------|
| Framework        | Vue 3 (Composition API, `<script setup>`), TypeScript | as in `notes-app`                                      |
| Build and dev server | Vite 8                                     | default of Vue, fast reload                                  |
| Scaffold         | `create-vue` with TypeScript, Vue Router, ESLint + Oxlint, Prettier, without example code | same setup as `notes-app` |
| Routing          | Vue Router                                     | three screens with URLs                                      |
| HTTP             | built-in `fetch` with a small wrapper          | no extra dependency, same choice as the backend              |
| Styles           | plain CSS with custom properties (design tokens), scoped styles in components | no UI library needed for three screens |
| Font             | Titillium Web from Google Fonts                | spec, design section                                         |

No state management library (Pinia) and no toast library: each screen loads its own data, and the one confirmation message is a small inline status.

## Docker

The frontend runs like in `notes-app`: a `frontend` service in `compose.yaml`, without its own Dockerfile.

```yaml
frontend:
  image: node:24-alpine
  user: "${HOST_UID:-1000}:${HOST_GID:-1000}"
  init: true
  working_dir: /app
  # Install dependencies on start (fast when up to date), then run the Vite dev server
  command: sh -c "npm install --no-audit --no-fund && npm run dev"
  environment:
    HOME: /tmp
    NPM_CONFIG_UPDATE_NOTIFIER: "false"
  ports:
    - "${FRONTEND_PORT:-5173}:5173"
  volumes:
    - ./frontend:/app
  depends_on:
    - app
```

- **Proxy instead of CORS:** the Vite dev server forwards `/v1/*` to `http://app:3000`. The browser talks only to `localhost:5173`, so the backend needs no CORS setup. Frontend routes (`/`, `/players/…`) do not start with `/v1`, so they never collide.
- **`node_modules` on the bind mount:** like the backend, `frontend/node_modules` lives in the project folder (ignored by git), so VS Code resolves the types. See "Editor support" below.
- **User:** the service runs with the host user id like the backend, so files it writes belong to the host user.
- **Ports:** `FRONTEND_PORT` added to `.env.example`.

### Editor support

Decided in phase 1 (2026-11-06): `notes-app` keeps `node_modules` in a named volume, but then VS Code cannot resolve `vue` and other types in `frontend/`. The frontend therefore keeps `node_modules` on the bind mount like the backend. The packages are installed in the Linux container and are never run on the host; the editor only reads their type declarations.

### Makefile

| Target                       | What it does                                                    |
|------------------------------|-----------------------------------------------------------------|
| `make up`, `make init`       | also start the frontend (no change needed, it is a compose service) |
| `make frontend-logs`         | follow the logs of the frontend                                 |
| `make frontend-npm c="…"`    | run any npm command in the frontend container                   |
| `make frontend-lint`         | ESLint, Oxlint and `vue-tsc` type check                         |

---

## Phase 1: Vue project in Docker

**Goal:** http://localhost:5173 shows an empty app, and the dev server forwards API calls to the backend.

- Scaffold `frontend/` with `create-vue` in a `node:24-alpine` container (TypeScript, Vue Router, ESLint + Oxlint, Prettier, without example code)
- Remove what the scaffold adds but this project does not use: example components, views and assets
- `vite.config.ts`: `server.host` `0.0.0.0`, port `5173`, `strictPort`, proxy `/v1` → `http://app:3000`
- `src/App.vue`: only the app name as a heading and `<RouterView />`
- `src/router/index.ts`: no routes yet. A redirect of unknown paths to `/` would also match `/` itself and loop, so it comes in phase 4 together with the `/` route.
- `frontend` service in `compose.yaml`, `FRONTEND_PORT` in `.env.example`
- Makefile targets from the table above

**Done when:** after `make up` the page at http://localhost:5173 shows the app name; `curl http://localhost:5173/v1/players/123` returns the backend's `400` `{"error":"playerId must be a UUID"}` through the proxy; changing `App.vue` reloads the page; `make frontend-lint` passes.

---

## Phase 2: Layout and F1 design

**Goal:** the common layout and the visual language every screen uses.

- `index.html`: Titillium Web from Google Fonts (400, 600, 700, 900, italic), page title "F1 Prediction League", `lang="en"`
- `src/assets/styles/tokens.css`: design tokens as CSS custom properties

| Token group | Values                                                                           |
|-------------|----------------------------------------------------------------------------------|
| Colors      | carbon background `#15151E`, panel `#1F1F27`, panel border `#38383F`, text `#FFFFFF`, muted text `#B8B8C0`, accent F1 red `#E10600`, error text `#FF6B6B` |
| Typography  | font family Titillium Web, sizes for headings and text                           |
| Spacing, radius | a small scale (4 / 8 / 12 / 16 / 24 / 32 px), angled corners instead of round ones |

- `src/assets/styles/base.css`: reset, dark background, text color, visible focus outline in red, utility for the checkered motif (CSS gradient, no image)
- `src/components/AppHeader.vue`: dark bar with a red slanted stripe and the app name in bold italic uppercase, linking to `/`
- `App.vue`: `AppHeader` and a centered content area for `<RouterView />`, responsive from 360 px

All colors used for text are checked against the background for WCAG AA contrast.

**Done when:** the header and the empty content area look as described on a 360 px and on a desktop wide window.

---

## Phase 3: Player profile and player not found

**Goal:** `/players/{playerId}` shows a player loaded from `GET /v1/players/{playerId}`.

In the order data travels:

1. **API client** `src/api/client.ts`: `request<T>(method, path, body?)` wrapping `fetch`. Returns the JSON body on success. On an error response it throws `ApiError` with `status` and the `error` message from the body. When the backend cannot be reached it throws `ApiError` with status `0` and the message "Something went wrong. Please try again." (B4). `500` gets the same message.
2. **Players API** `src/api/players.ts`: type `Player` (`id`, `nickname`, `createdAt`, `updatedAt` as ISO strings) and `getPlayer(id)`
3. **Date formatting** `src/utils/format-date.ts`: ISO string → local time, e.g. "23 Oct 2026, 12:15" (B5), with `Intl.DateTimeFormat` in English
4. **Views:**
   - `src/views/PlayerProfileView.vue`: loads the player, shows a loading state, then a card in the timing tower style with the nickname, "Created" and "Last change" dates. `404` and `400` (invalid id) show the not found view (AC9), other errors show the general error message (B4).
   - `src/views/PlayerNotFoundView.vue`: message and a link to `/`
5. **Router:** route `/players/:playerId`

**Done when:** a player created with `curl` is shown at `/players/{id}`; an unknown UUID and `123` show the not found screen; with the backend stopped, the profile shows the general error message.

---

## Phase 4: Create player

**Goal:** `/` creates a player with `POST /v1/players` and opens the profile.

1. **Players API:** `createPlayer(nickname)` returns `{ id }`
2. **Nickname form** `src/components/NicknameForm.vue`, used here and in phase 5:
   - label "Nickname", one text input, submit button with a label passed in by the parent
   - the submit button is disabled when the trimmed value is empty (B3, AC6) or while `submitting` is true; while submitting it shows a working state (B2, AC7)
   - shows an error message passed in by the parent below the input, connected with `aria-describedby` and announced with `role="alert"`
   - emits `submit` with the value, keeps the value after an error
3. **View** `src/views/CreatePlayerView.vue`: headline about the game, the form; on success navigates to `/players/{id}` (AC3); on `ApiError` shows its message in the form (AC4, AC5, B1, B4)
4. **Router:** route `/` and a redirect of unknown paths to `/`

**Done when:** AC3 to AC7 work in the browser.

---

## Phase 5: Change nickname

**Goal:** the profile changes the nickname with `PATCH /v1/players/{playerId}`.

1. **Players API:** `changeNickname(id, nickname)`, the response `204` has no body
2. **Profile view:**
   - a "Change nickname" button shows `NicknameForm` prefilled with the current nickname, with "Save" and a "Cancel" button that hides the form without a request (AC12)
   - on success reloads the player with `getPlayer`, hides the form and shows "Nickname changed" in a status message with `role="status"` that disappears after a few seconds (AC10)
   - on `ApiError` shows its message in the form, the shown nickname stays (AC11)

**Done when:** AC10 to AC12 work in the browser.

---

## Phase 6: Acceptance check and README

- Go through AC1 to AC15 in the browser on a 360 px wide window and on a desktop window, with the backend running and stopped (AC13)
- Fix what does not meet the spec
- README: the frontend in "Getting started" (http://localhost:5173), the new `make` targets, the `frontend` service and port in the configuration table, a short "Frontend" section (Vue 3, Vite, proxy to the backend)
- `FRONTEND_PORT` documented with the other ports

---

## Folder structure after phase 6

```
frontend/
  index.html
  package.json, package-lock.json
  vite.config.ts, tsconfig*.json, eslint.config.ts, .oxlintrc.json, .prettierrc.json
  src/
    main.ts
    App.vue
    router/index.ts
    api/
      client.ts
      players.ts
    utils/
      format-date.ts
    components/
      AppHeader.vue
      NicknameForm.vue
    views/
      CreatePlayerView.vue
      PlayerProfileView.vue
      PlayerNotFoundView.vue
    assets/styles/
      tokens.css
      base.css
```

## Dependencies

Only what the `create-vue` scaffold installs (Vue, Vue Router, Vite, TypeScript, `vue-tsc`, ESLint, Oxlint, Prettier and their plugins). No other packages are added. They are recorded in the [tech-stack dependency log](../../product/tech-stack.md#dependency-log) in phase 1.

## Constitution check

The constitution is written for the backend. These articles apply to the frontend:

| Article        | How this plan follows it                                                                  |
|----------------|-------------------------------------------------------------------------------------------|
| 1 Workflow     | spec, plan, tasks approved first; every phase creates only what it uses                   |
| 7 API conventions | the frontend uses the `/v1` API and its `{ "error": … }` format as it is, no backend changes |
| 9 Tooling      | everything runs in Docker through `make`, nothing on the host                             |

Article 8 (testing) is not applied: automated frontend tests are out of scope in the spec, the acceptance criteria are checked manually in phase 6.
