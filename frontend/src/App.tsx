import { useEffect, useState } from 'react'

import { api } from './api/client'
import type { Me } from './api/types'
import SignIn from './auth/SignIn'

const REPO_URL = 'https://github.com/krinya/ai-coding-workshop'

export default function App() {
  // undefined: still asking the backend; null: nobody is signed in
  const [me, setMe] = useState<Me | null | undefined>(undefined)

  useEffect(() => {
    api
      .GET('/api/auth/me')
      .then(({ data }) => setMe(data ?? null))
      .catch(() => setMe(null))
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

      {me === null && <SignIn onSignedIn={setMe} />}
      {me && (
        <p className="text-slate-700">
          Signed in as <strong>{me.display_name ?? me.email}</strong>
        </p>
      )}

      <footer className="mt-auto flex gap-4 text-sm text-slate-500">
        <a href="/wall" className="underline hover:text-slate-800">
          Live wall
        </a>
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
