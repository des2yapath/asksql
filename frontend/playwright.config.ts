import { defineConfig } from "@playwright/test";

// Two projects, one config:
//
//   chromium - every /api call is answered in the browser (see
//              e2e/fixtures/api.ts), so this suite needs no database, no
//              Gemini key and no running backend. This is the default
//              `npm run test:e2e`.
//   live     - only the @live tests, which talk to the real backend on :8000
//              and skip themselves when it isn't up (`npm run test:e2e:live`).
//
// They're separate projects rather than an env-var switch because setting a
// var inside an npm script is a cross-platform headache, and grepInvert/grep
// already gives us the split for free.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    // Artifacts worth keeping when something flakes - traces show the network
    // calls the stubs answered, which is usually where the answer is.
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  // Only the frontend is started for you; the live project expects the
  // backend (and its database) to already be running. See README.
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    { name: "chromium", grepInvert: /@live/ },
    { name: "live", grep: /@live/ },
  ],
});
