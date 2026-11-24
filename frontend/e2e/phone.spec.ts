import { devices, expect, test } from '@playwright/test'

import { signIn, uniqueEmail } from './helpers.ts'

// A phone: touch screen, small viewport, no mouse
test.use({ ...devices['Pixel 7'] })

test("on a phone, the camera button opens the phone's camera app", async ({ page }) => {
  await signIn(page, uniqueEmail('phone'), 'Pixel')
  await expect(page.getByLabel('Take a selfie')).toHaveAttribute('capture', 'user')
  await expect(page.getByRole('button', { name: 'Use camera' })).toHaveCount(0)
})
