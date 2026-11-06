# 003 Frontend for players

- **Status:** Done (2026-11-06)
- **Roadmap:** [003](../../product/roadmap.md#003-frontend-for-players)

## Why

The players API from [002](../002-players/spec.md) can only be used with `curl` today. A web frontend makes the project usable in a browser and shows it as a full stack application. It also prepares the place where predictions, results and standings will be shown later.

The look is inspired by Formula 1 TV graphics, so the app feels like part of a race weekend.

## User stories

1. As a **visitor**, I want to create a player in the browser, so that I do not need `curl`.
2. As a **player**, I want to see my player profile.
3. As a **player**, I want to change my nickname in the browser.

## Screens

The UI is in English.

### Create player (`/`)

- A short headline about the game and a form with one field: nickname
- Submitting creates the player and opens their profile
- Errors from the API are shown next to the field, the entered value stays in the field

### Player profile (`/players/{playerId}`)

- Shows the nickname, the date the player was created and the date of the last change
- A "Change nickname" action opens an inline form prefilled with the current nickname
- After a successful change, the profile shows the new nickname and the new date of the last change, and a short confirmation appears
- Errors from the API are shown next to the field, the profile keeps the old nickname

### Player not found

- Shown for a profile URL whose player does not exist or whose id is not valid
- Offers a link back to creating a player

### Common layout

- A header with the name of the app, "F1 Prediction League", linking to the create player screen
- Every screen works on a phone (from 360 px wide) and on a desktop

## Behavior rules

- **B1** The backend is the only place with the nickname rules. The frontend does not repeat them, it shows the error message returned by the API (`{ "error": "…" }`).
- **B2** A submit button is disabled while its request is running, so a form cannot be sent twice.
- **B3** An empty or whitespace-only nickname cannot be submitted. This is the only check done in the frontend, to avoid a pointless request.
- **B4** When the API cannot be reached or returns `500`, the screen shows "Something went wrong. Please try again." and the form keeps its values.
- **B5** Dates are shown in the user's local time zone in a readable format, e.g. "23 Oct 2026, 12:15".

## Design

Inspired by Formula 1 TV graphics, without using the Formula 1 logo, name in a logo form or any other trademark.

- **Theme:** dark only. Carbon black background, white text, F1 red (`#E10600`) as the accent for primary actions and highlights.
- **Typography:** Titillium Web (Google Fonts), bold and italic uppercase for headings, regular weight for text.
- **Elements:** a checkered flag motif and slanted red stripes as decoration, cards styled like the timing tower and TV info graphics (dark panels, sharp angled edges, a red accent bar on the side).
- **Accessibility:** text contrast at least WCAG AA, every input has a visible label, keyboard focus is clearly visible, errors are announced to screen readers.

## Acceptance criteria

### Running the frontend

- **AC1** After `make init` on a fresh clone, or `make up`, the frontend is available at http://localhost:5173 and talks to the backend without any extra setup.
- **AC2** Nothing besides Docker and `make` is needed on the host, as for the backend.

### Create player

- **AC3** Given I enter `JohnDoe` and submit, then the player is created and I see their profile with the nickname `JohnDoe`.
- **AC4** Given I enter `ab`, when I submit, then I see `Nickname must be 3 to 20 characters long` next to the field and stay on the form with `ab` still entered.
- **AC5** Given `JohnDoe` exists, when I submit `johndoe`, then I see `Nickname "johndoe" is already taken`.
- **AC6** Given the nickname field is empty or contains only spaces, then the submit button is disabled (B3).
- **AC7** While the request is running, the submit button is disabled and shows that it is working (B2).

### Player profile

- **AC8** Given a player exists, when I open their profile, then I see the nickname, the creation date and the date of the last change (B5).
- **AC9** Given no player has the id in the URL, or the id is not a UUID, then I see the player not found screen with a link to create a player.

### Change nickname

- **AC10** Given I am on a profile, when I change the nickname to `Ferrari_Fan`, then the profile shows `Ferrari_Fan`, the new date of the last change and a short confirmation.
- **AC11** Given I change the nickname to a taken or invalid one, then I see the error from the API next to the field and the profile still shows the old nickname.
- **AC12** Given I open the change form and cancel it, then nothing is sent and the profile shows the old nickname.

### Errors and layout

- **AC13** Given the backend is stopped, when I submit any form, then I see "Something went wrong. Please try again." and the form keeps its values (B4).
- **AC14** Every screen is usable on a 360 px wide screen without horizontal scrolling.
- **AC15** The screens follow the design section: dark theme, F1 red accent, Titillium Web, checkered and stripe motifs, no Formula 1 trademarks.

## Out of scope

- A list of all players or search
- Logging in, until roadmap item [004](../../product/roadmap.md#004-authentication)
- Remembering the last created player in the browser
- A light theme and other languages than English
- Automated frontend tests (unit, component or end-to-end). The acceptance criteria are checked manually in the browser.
- A production build and hosting of the frontend
