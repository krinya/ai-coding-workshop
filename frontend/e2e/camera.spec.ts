import { expect, test } from '@playwright/test'

import { join } from './helpers.ts'

// Chromium's fake webcam shows a test pattern, and camera access is pre-approved
test.use({
  permissions: ['camera'],
  launchOptions: {
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  },
})

test('on a laptop, take a photo with a 3-2-1 countdown', async ({ page }) => {
  await join(page, 'Cam')

  await page.getByRole('button', { name: 'Use camera' }).click()
  await expect(page.getByLabel('Camera preview')).toBeVisible()
  await page.getByRole('button', { name: 'Take photo' }).click()

  await expect(page.getByText('3', { exact: true })).toBeVisible()
  await expect(page.getByText('1', { exact: true })).toBeVisible()
  await expect(page.getByAltText('Your photo')).toBeVisible({ timeout: 5000 })
  await expect(page.getByRole('radio', { name: 'Sepia' })).toBeVisible()
})
