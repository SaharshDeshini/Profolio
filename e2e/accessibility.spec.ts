import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/**
 * Automated a11y sweep with axe-core. This catches contrast, labelling and
 * landmark issues; it does not replace a manual screen-reader/keyboard pass
 * (see arrival.spec.ts and project-overlay.spec.ts for the focus-management
 * assertions axe cannot make). `<canvas>` is excluded: axe has no way to
 * inspect WebGL content, and everything drawn on it is decorative — the real
 * page content is the DOM sitting over it.
 *
 * Reduced motion is emulated before every scan. Without it, axe can catch the
 * arrival/overlay entrance and exit transitions mid-fade and flag a false
 * contrast violation against a translucent intermediate frame — a real
 * animation artifact, not a real, steady-state a11y bug. `global.css`
 * collapses `animation`/`transition` durations under reduced motion, which is
 * also the state the site's own `prefers-reduced-motion` visitors get.
 */
test.describe('accessibility', () => {
  test('the landing page has no automatically detectable violations', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.getByRole('button', { name: /skip intro/i }).press('Enter')
    // The arrival screen's own unmount delay is a JS timer (Arrival.tsx's
    // LEAVE_MS), not a CSS transition, so reduced motion alone doesn't skip
    // it — wait for the dialog to actually leave the DOM.
    await expect(page.getByRole('dialog', { name: 'Introduction' })).toHaveCount(0)

    const results = await new AxeBuilder({ page }).exclude('canvas').analyze()

    expect(results.violations).toEqual([])
  })

  test('the project overlay has no automatically detectable violations', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/project/project-one')
    await expect(page.locator('#overlay-title')).toBeVisible()

    const results = await new AxeBuilder({ page }).exclude('canvas').analyze()

    expect(results.violations).toEqual([])
  })
})
