import { fileURLToPath } from 'node:url'

import { expect, test } from '@playwright/test'

import { join } from './helpers.ts'

const TEST_PHOTO = fileURLToPath(new URL('./fixtures/test-photo.png', import.meta.url))

test('send feedback with a filtered photo, edit it, delete it', async ({ page }) => {
  await join(page, 'Linus')

  await page.getByRole('radio', { name: '4 stars' }).check({ force: true })
  await page.getByLabel('Comment').fill('Loved the live demos')
  await page.getByLabel('Upload a picture').setInputFiles(TEST_PHOTO)
  await page.getByRole('radio', { name: 'Comic' }).click()
  await page.getByLabel('My photo may be shown on the screen during the workshop').check()
  await page.getByRole('button', { name: 'Send feedback' }).click()

  await expect(page.getByRole('status')).toContainText('Thank you')
  await expect(page.getByAltText('Your saved photo')).toBeVisible()

  // The photo was resized in the browser and stored as a small JPEG
  const photoUrl = await page.getByAltText('Your saved photo').getAttribute('src')
  const photo = await page.request.get(photoUrl!)
  expect(photo.headers()['content-type']).toBe('image/jpeg')

  // Edit
  await page.reload()
  await expect(page.getByLabel('Comment')).toHaveValue('Loved the live demos')
  await page.getByRole('radio', { name: '5 stars' }).check({ force: true })
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByRole('status')).toContainText('Saved your changes')

  // Delete
  await page.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('button', { name: 'Yes, delete' }).click()
  await expect(page.getByRole('button', { name: 'Send feedback' })).toBeVisible()
})
