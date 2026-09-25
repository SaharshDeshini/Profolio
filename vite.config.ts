import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    target: 'es2023',
  },
  server: {
    warmup: { clientFiles: ['./src/main.tsx'] },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Vitest stubs CSS out by default; one test reads global.css as text to
    // check it agrees with the layout constants, so let that file through.
    css: { include: [/global\.css/] },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // Not measured here: every .tsx file (components and R3F scenes) and the
      // DOM-bound hooks. They need a real browser, so they are covered by the
      // Playwright e2e pass added in the polish step, not by unit tests.
      exclude: ['src/**/*.test.ts', 'src/**/use[A-Z]*.ts', 'src/**/*.d.ts'],
      // perFile: an untested new module cannot hide behind a well-tested one.
      thresholds: { perFile: true, lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
})
