// The page the QR code opens (/join/<token>): pick a name, tap Join, and you are in.
import { useState, type FormEvent } from 'react'

import { api } from '../api/client'
import { errorText } from '../api/errors'

type Props = { token: string; onJoined: () => void }

export default function Join({ token, onJoined }: Props) {
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function join(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await api.POST('/api/auth/join', {
      body: { token, display_name: displayName.trim() || null },
    })
    setBusy(false)
    if (error) return setError(errorText(error))
    onJoined()
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 bg-gradient-to-b from-indigo-50 to-slate-50 px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Rate this course ⭐
      </h1>
      <form
        onSubmit={join}
        className="flex w-full max-w-xl flex-col gap-4 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200 sm:p-8"
      >
        <h2 className="text-xl font-semibold text-slate-900">Welcome!</h2>
        <p className="text-sm text-slate-600">
          Pick the name that appears next to your feedback on the big screen — or leave it empty to
          stay anonymous.
        </p>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Your name on the wall <span className="font-normal text-slate-500">(optional)</span>
          <input
            value={displayName}
            maxLength={50}
            autoComplete="nickname"
            autoFocus
            onChange={(event) => setDisplayName(event.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-3 text-base font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <button
          disabled={busy}
          className="rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {busy ? 'Joining…' : 'Join'}
        </button>
      </form>
    </main>
  )
}
