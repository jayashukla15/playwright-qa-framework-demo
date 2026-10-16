# Playwright QA Framework

A TypeScript end-to-end testing starter using Playwright Test, page objects, and typed fixtures. Example tests cover OrangeHRM login, employee actions, API consistency, and the complete employee lifecycle.

## Prerequisites

- Node.js 20 or later
- npm

## Dependencies

The project uses these development dependencies:

- **`@playwright/test`** — Playwright's test runner, browser automation, assertions, fixtures, and test reporting.
- **`typescript`** — TypeScript compiler used for static type checking.
- **`@types/node`** — Node.js type definitions for TypeScript.
- **`dotenv`** — Loads `.env` configuration when the Playwright config starts.

Playwright runs tests in Chromium, Firefox, and WebKit. Install their browser binaries with `npm run install:browsers`.

## Setup

```powershell
npm install
npx playwright install
```

`npm install` installs the project dependencies, including `@playwright/test`; `npx playwright install` downloads the browser binaries used by the tests.

Copy `.env.example` to `.env` and set `PLAYWRIGHT_BASE_URL` to the application's origin. The base URL can also be supplied directly as an environment variable. The default points to the public OrangeHRM demo. The smoke test uses its published demo credentials (`Admin` / `admin123`); do not reuse those credentials for another environment.

## Run tests

Run the test suite and open the generated HTML report:

Run the complete employee lifecycle scenario in Chromium:

```cmd
npx playwright test tests/e2e/employee-lifecycle.spec.ts --project=chromium
```

Tests run against Chromium, Firefox, and WebKit. Set `CI=true` in CI to enable retries, single-worker execution, and protection against accidentally committed focused tests.

Playwright records video for every test. Video artifacts are saved under `test-results/`.

For reporting

```powershell
npm run test:report
```
The report is generated in `playwright-report/`. `npm run test:report` serves it locally and opens it in your browser.

## Project structure

```text
src/
  fixtures/       Shared typed Playwright fixtures
  pages/          Page objects and page-level interactions
tests/
  employee/       Employee lifecycle tests
  smoke/          Login and logout tests
  e2e/            Serial multi-test lifecycle scenarios
  support/        Shared test-step logging
data/
  employee.json   Data-driven employee scenarios
  profile_picture_upload.png  Source profile image
playwright.config.ts
```

The employee test resizes the supplied profile image in memory to meet OrangeHRM's 1 MB upload limit. Keep assertions and scenario intent in tests; put reusable page interactions and locators in page objects. Prefer role, label, and test-id locators over brittle CSS selectors. Add domain-specific fixtures only when they make setup or cleanup reusable, and keep test data isolated so tests can run in parallel.