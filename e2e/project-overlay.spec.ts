import { expect, test } from '@playwright/test'

test.describe('project overlay route', () => {
  test('opening a project route directly renders the case study panel', async ({ page }) => {
    await page.goto('/project/project-one')
    await expect(page.locator('#overlay-title')).toBeVisible()
    await expect(page.getByRole('button', { name: /close/i })).toBeVisible()
  })

  test('closing the overlay returns to the base route', async ({ page }) => {
    await page.goto('/project/project-one')
    await page.getByRole('button', { name: /close/i }).click()
    await expect(page).toHaveURL('/')
  })
})
