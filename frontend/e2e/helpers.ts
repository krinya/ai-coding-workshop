// Shared steps for the browser tests.
import { expect, request, type Page } from '@playwright/test'

import type { components } from '../src/api/schema.d.ts'

type JoinLinkStatus = components['schemas']['JoinLinkStatus']

// The backend's ADMIN_PASSWORD (the development default is "admin")
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin'

// Make sure feedback is open, as the host would, and return the QR code's link (its path)
export async function openFeedback(): Promise<string> {
  const host = await request.newContext({ baseURL: 'http://localhost:5173' })
  expect((await host.post('/api/auth/admin', { data: { password: ADMIN_PASSWORD } })).ok()).toBe(
    true,
  )
  let status: JoinLinkStatus = await (await host.get('/api/admin/join-link')).json()
  if (!status.join_url) status = await (await host.post('/api/admin/join-link')).json()
  await host.dispose()
  if (!status.join_url) throw new Error('Could not open feedback')
  return new URL(status.join_url).pathname
}

// "Scan" the QR code as a new person
export async function join(page: Page, displayName: string): Promise<void> {
  await page.goto(await openFeedback())
  await page.getByLabel('Your name on the wall').fill(displayName)
  await page.getByRole('button', { name: 'Join' }).click()
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
}
