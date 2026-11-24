// Shared steps for the browser tests.
import { expect, type APIRequestContext, type Page } from '@playwright/test'

const MAILPIT = 'http://localhost:8025'

// A fresh address per test, so tests never share an account
export function uniqueEmail(name: string): string {
  return `${name}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`
}

// Read the sign-in code from the newest email Mailpit caught for this address
export async function readCode(request: APIRequestContext, email: string): Promise<string> {
  let code = ''
  await expect
    .poll(async () => {
      const query = encodeURIComponent(`to:"${email}"`)
      const response = await request.get(`${MAILPIT}/api/v1/search?query=${query}`)
      const body = (await response.json()) as { messages: { Subject: string }[] }
      code = body.messages[0]?.Subject.match(/\d{6}/)?.[0] ?? ''
      return code
    }, 'the sign-in email arrives in Mailpit')
    .toMatch(/^\d{6}$/)
  return code
}

export async function signIn(page: Page, email: string, displayName: string): Promise<void> {
  await page.goto('/')
  await page.getByLabel('Email').fill(email)
  await page.getByRole('button', { name: 'Email me a code' }).click()
  await page.getByLabel('Your name on the wall').fill(displayName)
  await page.getByLabel('6-digit code').fill(await readCode(page.request, email))
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
}
