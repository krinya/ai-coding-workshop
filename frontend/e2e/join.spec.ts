import { expect, test } from '@playwright/test'

import { join } from './helpers.ts'

test('scan the QR code to join, then sign out', async ({ page }) => {
  await join(page, 'Grace')
  await expect(page.getByText('Grace')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible() // the cookie keeps you in

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByText('Scan the QR code to join')).toBeVisible()
})

test('an old QR code explains itself', async ({ page }) => {
  await page.goto('/join/not-a-real-token')
  await page.getByRole('button', { name: 'Join' }).click()
  await expect(page.getByRole('alert')).toContainText('not active any more')
})
