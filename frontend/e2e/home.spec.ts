import { expect, test } from '@playwright/test'

test('home page shows the title', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('AI Coding Workshop')
})

test('frontend reaches the backend and the database', async ({ request }) => {
  const response = await request.get('/api/health')
  expect(response.ok()).toBeTruthy()
  expect(await response.json()).toMatchObject({ status: 'ok', database: true })
})
