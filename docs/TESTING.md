# InsightFlow EDU — Testing Guide

This document explains the testing stack, how to run tests, what is covered today, and how to add more tests. It also includes a detailed list of current test cases.

## Testing stack

- Jest: JavaScript/TypeScript test runner
- ts-jest: TypeScript integration for Jest
- React Testing Library (RTL): Behavior-focused component testing
- jest-dom: Extra DOM matchers (e.g., `toBeInTheDocument`)
- jsdom: Browser-like DOM in Node for component tests
- MSW (Mock Service Worker): Mock HTTP calls deterministically in tests
- Local test setup:
  - `frontend/src/tests/setup.ts` registers jest-dom, stubs `ResizeObserver`, and mocks `framer-motion` for stable, fast tests.

Why this stack?
- RTL encourages testing user-visible behavior instead of implementation details
- Jest is fast, battle-tested, and integrates well with TypeScript
- MSW avoids flakey tests by mocking HTTP without requiring a running backend
- The stubs/mocks eliminate jsdom limitations (ResizeObserver) and animation runtime complexity (framer-motion)

## Project layout for tests

- Frontend unit tests live in `frontend/src/tests/`
  - `setup.ts` — global setup for Jest environment
  - `LoginPage.test.tsx` — form rendering and validation tests
  - `Dashboard.test.tsx` — chart components behavior with/without data

Backend tests: Not present in this snapshot. You can add JUnit tests under `backend/insightflow-backend/src/test/java/` later.

## How to run tests

You can run tests from either the repo root (scripts proxy to the frontend) or from the `frontend/` directory.

From repo root:

```powershell
# run all frontend tests
npm run test

# run tests in watch mode (if configured in frontend)
# npm run test:watch

# run a single test file via CMD if PowerShell blocks npm scripts
taskkill /F /IM node.exe 2>$null # optional: clean old Node processes
cmd /c "npm --prefix frontend run test -- src/tests/LoginPage.test.tsx"
```

From frontend directory:

```powershell
cd frontend
npm ci
npm test

# single test file (PowerShell-friendly)
npm run test -- src/tests/LoginPage.test.tsx
```

Coverage (optional):

```powershell
cd frontend
npm run test:coverage
```

Notes for Windows PowerShell
- If you hit "running scripts is disabled" for `npm.ps1`, prefer running via `cmd /c "npm run ..."` as shown above or adjust the execution policy according to your org policies.

## Environment and network behavior in tests

- Unit tests do not require a running backend.
- Network requests should be mocked (MSW) if a component performs real HTTP calls. Current tests avoid live HTTP by focusing on UI rendering and validation. If you add tests that call the API, add handlers in `frontend/src/mocks/handlers.ts` and wire MSW in the test setup.
- `frontend/src/api/axiosClient.ts` safely resolves `VITE_API_BASE_URL` for Jest; tests won’t crash on `import.meta`.

## Current test suites and cases (detailed)

### LoginPage.test.tsx
File: `frontend/src/tests/LoginPage.test.tsx`

- Test: "renders login form"
  - Purpose: Sanity-check that the page renders main elements
  - Steps: Render `LoginPage` inside `AuthProvider`, `BrowserRouter`, and `QueryClientProvider`
  - Asserts:
    - Heading "Welcome back" is present
    - Username and Password inputs exist

- Test: "shows validation errors for empty fields"
  - Purpose: Validate form-level errors on empty submit
  - Steps: Click Sign In with empty fields
  - Asserts:
    - Error text for username minimum length is shown

- Test: "validates minimum length for username and password"
  - Purpose: Enforce schema rules via zod
  - Steps: Type short values (username: `ab`, password: `12345`), click Sign In
  - Asserts:
    - "Username must be at least 3 characters"
    - "Password must be at least 6 characters"

### Dashboard.test.tsx
File: `frontend/src/tests/Dashboard.test.tsx`

- Suite: GpaChart
  - Test: "renders chart with data"
    - Purpose: Chart is rendered when data exists
    - Steps: Provide mock `GpaTrend[]` with 3 points
    - Asserts:
      - "no data available" message is NOT present
  - Test: "shows 'no data' message when empty"
    - Purpose: Graceful empty state
    - Steps: Provide empty array
    - Asserts:
      - "no data available" message is present

- Suite: AttendanceChart
  - Test: "renders chart with data"
    - Purpose: Chart is rendered when data exists
    - Steps: Provide mock `AttendanceTrend[]` with 2 points
    - Asserts:
      - "no data available" message is NOT present
  - Test: "shows 'no data' message when empty"
    - Purpose: Graceful empty state
    - Steps: Provide empty array
    - Asserts:
      - "no data available" message is present

## Adding new tests

1. Create a new file under `frontend/src/tests/YourComponent.test.tsx`.
2. Use RTL helpers and wrap with any required providers (Router, QueryClient, AuthProvider).
3. Prefer user-centric queries (e.g., `getByRole`, `getByLabelText`). Avoid querying by implementation details.
4. If your component fetches data, add MSW handlers to return deterministic responses.
5. Run `npm test` and iterate until green.

Example skeleton:

```tsx
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import YourComponent from '@/path/YourComponent';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderWithProviders = (ui: React.ReactNode) =>
  render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );

test('renders expected content', () => {
  renderWithProviders(<YourComponent />);
  expect(screen.getByText(/expected/i)).toBeInTheDocument();
});
```

## Troubleshooting

- PowerShell blocks npm:
  - Use `cmd /c "npm run test -- <file>"` or adjust execution policy.
- Tests fail on charts/animations:
  - Ensure `src/tests/setup.ts` is referenced by Jest config (`frontend/jest.config.cjs`). It stubs `ResizeObserver` and mocks `framer-motion`.
- Backend-related tests fail:
  - Unit tests should not depend on the live backend. Mock HTTP with MSW or abstract calls.
- Environment variables not picked up:
  - Restart the Vite dev server after editing `.env.*`. For Jest, ensure no direct `import.meta` usage in test environment; this repo guards it in `axiosClient`.

---

If you want CI to run tests and linting automatically, we can add a GitHub Actions workflow that:
- Installs Node
- Runs `npm ci` in `frontend`
- Runs `npm run lint` and `npm test`
- Optionally builds the backend (`mvn -q -DskipTests package`)
