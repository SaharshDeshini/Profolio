import { expect, test } from '@playwright/test'

test.describe('arrival screen', () => {
  test('shows the introduction dialog on a cold load', async ({ page }) => {
    await page.goto('/')
    const dialog = page.getByRole('dialog', { name: 'Introduction' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute('data-state', 'visible')
  })

  test('dismisses via the skip button and reveals the hero landmark', async ({ page }) => {
    await page.goto('/')
    // The skip button is visually hidden until keyboard focus reaches it
    // (clipped, so no pointer can hit it — see .arrival__skip in arrival.css),
    // so it is driven the way its users reach it: focused, then Enter.
    const dialog = page.getByRole('dialog', { name: 'Introduction' })
    await page.getByRole('button', { name: /skip intro/i }).press('Enter')

    await expect(dialog).toHaveAttribute('data-state', 'leaving')
    // The hero <header> is intentionally screen-reader-only (sr-only, clipped
    // to zero area) — it's never visible, so it can't be the "revealed"
    // signal. What the skip button actually reveals is <main>, which App.tsx
    // marks `inert` only while the arrival screen is up.
    await expect(page.locator('main')).not.toHaveAttribute('inert')
  })

  test('dismisses on Escape', async ({ page }) => {
    await page.goto('/')
    const dialog = page.getByRole('dialog', { name: 'Introduction' })
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveAttribute('data-state', 'leaving')
  })
})
