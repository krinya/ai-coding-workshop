import { expect, test } from '@playwright/test'

import { signIn, uniqueEmail } from './helpers.ts'

test('sign in with an emailed code, then sign out', async ({ page }) => {
  await signIn(page, uniqueEmail('signin'), 'Grace')
  await expect(page.getByText('Grace')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible() // the cookie keeps you in

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByRole('button', { name: 'Email me a code' })).toBeVisible()
})

test('a wrong code shows an error', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Email').fill(uniqueEmail('wrong'))
  await page.getByRole('button', { name: 'Email me a code' }).click()
  await page.getByLabel('6-digit code').fill('000000')
  await expect(page.getByRole('alert')).toContainText(/wrong code|expired/i)
})
