import { expect, test } from '@playwright/test'

/** Matches the DebugHud's `raw     0.1234` / `smooth  0.1234` / `scrollY 42` lines. */
function readHudProgress(text: string): { raw: number; smooth: number; scrollY: number } {
  const raw = Number(/raw\s+([\d.]+)/.exec(text)?.[1])
  const smooth = Number(/smooth\s+([\d.]+)/.exec(text)?.[1])
  const scrollY = Number(/scrollY\s+(-?\d+)/.exec(text)?.[1])
  return { raw, smooth, scrollY }
}

test.describe('scene load and scroll', () => {
  test('the canvas mounts once the arrival screen is skipped', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /skip intro/i }).press('Enter')
    await expect(page.locator('canvas')).toBeVisible()
  })

  test('scrolling past the skipped intro advances scroll while story progress stays pinned', async ({ page }) => {
    // DebugHud only mounts in dev builds with this opt-in query param, so it
    // never shows up unannounced for a normal visitor.
    await page.goto('/?debug=1')
    await page.getByRole('button', { name: /skip intro/i }).press('Enter')

    const hud = page.getByTestId('debug-hud')
    await expect(hud).toBeVisible()
    // "Skip intro" (useSkipToContent) calls snapProgress(1) and jumps straight
    // to #intro, so raw/smooth are already pinned at their max and scrollY is
    // wherever #intro landed — neither is 0 here, unlike a cold, unskipped load.
    const before = readHudProgress(await hud.innerText())
    expect(before.raw).toBe(1)

    await page.mouse.wheel(0, 2400)
    // The smoothed value eases toward the raw one rather than jumping, so
    // give it a moment before reading a stable frame.
    await expect
      .poll(async () => readHudProgress(await hud.innerText()).scrollY)
      .toBeGreaterThan(before.scrollY)

    // Act 1's story progress is Act 1-only: scrolling through Act 2 content
    // must not un-pin it.
    const after = readHudProgress(await hud.innerText())
    expect(after.raw).toBe(1)
  })
})
