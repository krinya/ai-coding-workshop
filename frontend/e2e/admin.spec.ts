import { expect, test } from '@playwright/test'

import { ADMIN_PASSWORD } from './helpers.ts'

test('the host opens, renews and closes the QR code', async ({ page, context }) => {
  await page.goto('/admin')
  await page.getByLabel('Admin password').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()

  // Open (or keep open) and remember the link. Wait for the status before deciding.
  await expect(page.getByRole('heading', { name: /Feedback is (open|closed)/ })).toBeVisible()
  const openButton = page.getByRole('button', { name: 'Open feedback' })
  if (await openButton.isVisible()) await openButton.click()
  await expect(page.getByRole('img', { name: 'QR code to join' })).toBeVisible()
  const oldLink = await page.getByText('/join/').textContent()

  // A new QR code makes the old link stop working
  await page.getByRole('button', { name: 'New QR code' }).click()
  await expect(page.getByText('/join/')).not.toHaveText(oldLink!)
  const visitor = await context.browser()!.newPage()
  await visitor.goto(new URL(oldLink!).pathname)
  await visitor.getByRole('button', { name: 'Join' }).click()
  await expect(visitor.getByRole('alert')).toContainText('not active any more')

  // The host's wall shows the QR code; a visitor's wall does not
  await page.goto('/wall')
  await expect(page.getByRole('img', { name: 'QR code to join' })).toBeVisible()
  await visitor.goto('/wall')
  await expect(visitor.getByText('Feedback is open')).toBeVisible()
  await expect(visitor.getByRole('img', { name: 'QR code to join' })).toHaveCount(0)
  await page.goto('/admin')

  // Close: the wall takes the QR code down
  await page.getByRole('button', { name: 'Close feedback' }).click()
  await expect(page.getByText('Feedback is closed')).toBeVisible()
  await visitor.goto('/wall')
  await expect(visitor.getByText('Feedback is closed')).toBeVisible()
  await expect(visitor.getByRole('img', { name: 'QR code to join' })).toHaveCount(0)

  // Open again for the next tests
  await page.getByRole('button', { name: 'Open feedback' }).click()
  await expect(page.getByRole('img', { name: 'QR code to join' })).toBeVisible()
})
