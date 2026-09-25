import { defineConfig, devices } from '@playwright/test'

/**
 * Real system Chrome and Edge, not Playwright-managed downloads: this
 * environment has no `ms-playwright` browser cache, and both browsers are
 * already installed. `swiftshader` forces software GL so the suite is stable
 * on machines without a passthrough GPU, matching how the app's own WebGL
 * context-loss recovery was reproduced and verified during development.
 */
const SOFTWARE_GL_ARGS = [
  '--use-gl=angle',
  '--use-angle=swiftshader',
  // Recent Chrome/Edge refuse software WebGL in automated/headless contexts
  // unless explicitly unlocked; without this the app's own hasWebGL probe
  // fails, the story falls back to 'static' mode, and the canvas never mounts.
  '--enable-unsafe-swiftshader',
]

export default defineConfig({
  testDir: './e2e',
  // Software-rendered WebGL (swiftshader) is CPU-bound and slow; running
  // specs in parallel starves each other's frame budget and causes spurious
  // timeouts on this machine, so tests run one at a time instead.
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome', launchOptions: { args: SOFTWARE_GL_ARGS } },
    },
    {
      name: 'edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge', launchOptions: { args: SOFTWARE_GL_ARGS } },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
