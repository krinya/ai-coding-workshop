import { useEffect, useState } from 'react'

import { api } from './api/client'
import type { Me } from './api/types'
import FeedbackForm from './feedback/FeedbackForm'

const REPO_URL = 'https://github.com/krinya/ai-coding-workshop'

export default function App() {
  // undefined: still asking the backend; null: nobody is signed in
  const [me, setMe] = useState<Me | null | undefined>(undefined)

  useEffect(() => {
    let current = true // ignore a late answer from an earlier run of this effect
    api
      .GET('/api/auth/me')
      .then(({ data }) => current && setMe(data ?? null))
      .catch(() => current && setMe(null))
    return () => {
      current = false
    }
  }, [])

  async function signOut() {
    await api.POST('/api/auth/sign-out')
    setMe(null)
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 bg-gradient-to-b from-indigo-50 to-slate-50 px-4 py-10">
      <header className="flex w-full max-w-xl items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Rate this course ⭐
        </h1>
        {me && (
          <button
            onClick={() => void signOut()}
            className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-300 hover:bg-white"
          >
            Sign out
          </button>
        )}
      </header>

      {me === null && (
        <section className="flex w-full max-w-xl flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center shadow-lg ring-1 ring-slate-200">
          <span className="text-5xl" aria-hidden="true">
            📱
          </span>
          <h2 className="text-xl font-semibold text-slate-900">Scan the QR code to join</h2>
          <p className="text-slate-600">
            The QR code is on the big screen. Scan it with your phone's camera to give your
            feedback.
          </p>
        </section>
      )}
      {me && (
        <>
          <p className="-mb-4 w-full max-w-xl text-slate-700">
            Hi{me.display_name && <strong> {me.display_name}</strong>} — tell us what you thought.
          </p>
          <FeedbackForm />
        </>
      )}

      <footer className="mt-auto flex gap-4 text-sm text-slate-500">
        <a href="/wall" className="underline hover:text-slate-800">
          Live wall
        </a>
        {me?.is_admin && (
          <a href="/admin" className="underline hover:text-slate-800">
            Host controls
          </a>
        )}
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-slate-800"
        >
          View the code on GitHub
        </a>
      </footer>
    </main>
  )
}
