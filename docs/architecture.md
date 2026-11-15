# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Build the UI as route-driven React pages that read from the shared API client, keep view logic in components, and surface loading, empty, success, and error states with accessible text. The pages for activities, teams, leaderboard, and workout suggestions should render the real API payloads instead of stubbed placeholders.
- Logic tier decision: Keep route handlers thin and push business behavior into explicit service functions under `octofit-tracker/backend/src`. Express endpoints should validate user input early, normalize IDs, and return deliberate 4xx responses for invalid or missing records instead of allowing Mongoose cast errors to bubble up as 500s.
- Data tier decision: Model the domain with Mongoose schemas for `User`, `Team`, `Activity`, and `Workout`, with required fields, relationships, and default values enforced in the schema layer. Seed fixtures should use upserts so demo data stays stable and idempotent when the app starts or tests rerun.
- Activity tracking approach: Store `user`, `team`, `type`, `minutes`, `points`, and `occurredAt` as required fields. `userId` and `teamId` must resolve to real documents; invalid IDs should reject with a 4xx, and computed `points` should be based on the submitted minutes so the record matches the API contract.
- Team management approach: Teams must include a `name` and `mascot`, and `members` should default to an empty array. Team creation should accept member IDs, persist them as ObjectIds, and expose the list through the API so the UI can render membership cleanly.
- Leaderboard approach: Aggregate activities by team, sum each team's points, and sort descending so the top team is rank 1. Each leaderboard item includes `teamName`, `totalPoints`, and a 1-based `rank` using the API contract defined in the architecture.
- Workout suggestions approach: Recommend workouts by matching the logged-in user's recent activity pattern or declared fitness goal to a workout `focus`, including a human-readable `reason`. Unknown users should return a deliberate 4xx, while known users should get the strongest suggestion first for their recent endurance, strength, or mobility trend.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Result: passes all 5 tests.
  - Meaning: required model fields, defaults, and idempotent seed behavior satisfy the data contract.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Result: passes all 4 tests.
  - Meaning: activity and team validation, leaderboard ranking, and activity-informed workout suggestions satisfy the API contract.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - Result: passes all 15 tests.
  - Meaning: each capability renders API data and provides loading, empty, and accessible error states.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - Result: passes (`tsc --noEmit`).
  - Meaning: the backend TypeScript compiles cleanly.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - Result: passes (`tsc --noEmit && vite build`).
  - Meaning: the frontend type-checks and produces a production bundle.

- Baseline: failing tests captured before implementation.
