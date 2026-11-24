// The whole story: scan the QR code, send feedback with a photo, see it on /wall.
import { fileURLToPath } from 'node:url'

import { expect, test } from '@playwright/test'

import { join } from './helpers.ts'

const TEST_PHOTO = fileURLToPath(new URL('./fixtures/test-photo.png', import.meta.url))

test('join by QR code, send feedback with a photo, see it on the wall and react', async ({
  page,
}) => {
  const name = `Tester ${Date.now() % 100000}`
  const comment = `Fantastic workshop ${Date.now()}`

  await join(page, name)
  await page.getByRole('radio', { name: '5 stars' }).check({ force: true })
  await page.getByLabel('Comment').fill(comment)
  await page.getByLabel('Upload a picture').setInputFiles(TEST_PHOTO)
  await page.getByRole('radio', { name: 'Sepia' }).click()
  await page.getByLabel('My photo may be shown on the screen during the workshop').check()
  await page.getByRole('button', { name: 'Send feedback' }).click()
  await expect(page.getByRole('status')).toContainText('Thank you')

  await page.goto('/wall')
  const card = page.getByRole('article', { name })
  await expect(card).toBeVisible()
  await expect(card.getByText(comment)).toBeVisible()
  await expect(card.getByLabel('5 out of 5 stars')).toBeVisible()
  await expect(card.getByRole('img', { name })).toBeVisible()
  await expect(page.getByRole('img', { name: 'QR code to join' })).toBeVisible()

  // Signed in, so reactions work
  await card.getByRole('button', { name: '👏 0' }).click()
  await expect(card.getByRole('button', { name: '👏 1' })).toHaveAttribute('aria-pressed', 'true')

  // Clean up, so test runs do not fill the wall
  await page.goto('/')
  await page.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('button', { name: 'Yes, delete' }).click()
  await expect(page.getByRole('button', { name: 'Send feedback' })).toBeVisible()
})
