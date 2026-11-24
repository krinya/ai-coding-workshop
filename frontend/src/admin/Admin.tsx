// The host's page (/admin): show or hide the QR code, and remove entries from the wall.
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState, type FormEvent } from 'react'

import { api } from '../api/client'
import { errorText } from '../api/errors'
import type { JoinLinkStatus, PublicFeedback } from '../api/types'

const card = 'w-full max-w-xl rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200 sm:p-8'
const button = 'rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50'

export default function Admin() {
  // undefined: still asking the backend; false: not signed in as the host
  const [isAdmin, setIsAdmin] = useState<boolean | undefined>(undefined)
  const [status, setStatus] = useState<JoinLinkStatus | null>(null)
  const [entries, setEntries] = useState<PublicFeedback[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let current = true // ignore a late answer from an earlier run of this effect
    void api.GET('/api/auth/me').then(({ data }) => current && setIsAdmin(Boolean(data?.is_admin)))
    return () => {
      current = false
    }
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    let current = true
    void api.GET('/api/admin/join-link').then(({ data }) => current && data && setStatus(data))
    void api.GET('/api/feedback').then(({ data }) => current && data && setEntries(data))
    return () => {
      current = false
    }
  }, [isAdmin])

  async function change(action: 'open' | 'close') {
    setError('')
    const { data, error } =
      action === 'open'
        ? await api.POST('/api/admin/join-link')
        : await api.DELETE('/api/admin/join-link')
    if (error) return setError(errorText(error))
    setStatus(data)
  }

  async function remove(id: number) {
    const { error } = await api.DELETE('/api/admin/feedback/{feedback_id}', {
      params: { path: { feedback_id: id } },
    })
    if (error) return setError(errorText(error))
    setEntries((old) => old.filter((entry) => entry.id !== id))
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-slate-100 px-4 py-10">
      <header className="flex w-full max-w-xl items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Host controls</h1>
        <a href="/wall" className="text-sm text-indigo-700 underline">
          Open the wall →
        </a>
      </header>

      {isAdmin === false && <AdminSignIn onSignedIn={() => setIsAdmin(true)} />}

      {isAdmin && status && (
        <section className={`${card} flex flex-col gap-4`}>
          {status.join_url ? (
            <>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-500" />
                <h2 className="text-lg font-semibold text-slate-900">Feedback is open</h2>
                <span className="ml-auto text-sm text-slate-500">
                  {status.joined === 1 ? '1 person joined' : `${status.joined} people joined`}
                </span>
              </div>
              <div className="flex flex-col items-center gap-3 sm:flex-row">
                <QRCodeSVG
                  value={status.join_url}
                  size={160}
                  role="img"
                  aria-label="QR code to join"
                  className="shrink-0"
                />
                <p className="text-sm break-all text-slate-600">{status.join_url}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => void change('close')}
                  className={`${button} bg-red-600 text-white hover:bg-red-500`}
                >
                  Close feedback
                </button>
                <button
                  onClick={() => void change('open')}
                  className={`${button} bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50`}
                >
                  New QR code
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Closing takes the QR code off the wall and stops new people from joining. People who
                already joined can still edit their feedback. A new QR code makes the old one stop
                working.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-slate-400" />
                <h2 className="text-lg font-semibold text-slate-900">Feedback is closed</h2>
              </div>
              <button
                onClick={() => void change('open')}
                className={`${button} self-start bg-emerald-600 text-white hover:bg-emerald-500`}
              >
                Open feedback
              </button>
            </>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
        </section>
      )}

      {isAdmin && (
        <section className={`${card} flex flex-col gap-3`}>
          <h2 className="text-lg font-semibold text-slate-900">Entries ({entries.length})</h2>
          {entries.length === 0 && <p className="text-sm text-slate-500">No feedback yet.</p>}
          <ul className="flex flex-col divide-y divide-slate-100">
            {entries.map((entry) => (
              <EntryRow key={entry.id} entry={entry} onRemove={() => void remove(entry.id)} />
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}

function AdminSignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function signIn(event: FormEvent) {
    event.preventDefault()
    const { error } = await api.POST('/api/auth/admin', { body: { password } })
    if (error) return setError(errorText(error))
    onSignedIn()
  }

  return (
    <form onSubmit={signIn} className={`${card} flex flex-col gap-4`}>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Admin password
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-xl border border-slate-300 px-4 py-3 text-base font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button className={`${button} bg-indigo-600 py-3 text-white hover:bg-indigo-500`}>
        Sign in
      </button>
    </form>
  )
}

function EntryRow({ entry, onRemove }: { entry: PublicFeedback; onRemove: () => void }) {
  const [confirming, setConfirming] = useState(false)
  return (
    <li className="flex items-center gap-3 py-3">
      {entry.photo_url ? (
        <img src={entry.photo_url} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
      ) : (
        <span className="h-12 w-12 shrink-0 rounded-lg bg-slate-200" />
      )}
      <div className="min-w-0 grow">
        <p className="text-sm font-medium text-slate-900">
          {entry.display_name ?? 'Anonymous'}{' '}
          <span className="text-amber-500">{'★'.repeat(entry.rating)}</span>
        </p>
        {entry.comment && <p className="truncate text-sm text-slate-600">{entry.comment}</p>}
      </div>
      {confirming ? (
        <span className="flex shrink-0 gap-2 text-sm">
          <button onClick={onRemove} className="rounded-lg bg-red-600 px-3 py-1.5 text-white">
            Yes, remove
          </button>
          <button onClick={() => setConfirming(false)} className="underline">
            Keep
          </button>
        </span>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="shrink-0 text-sm text-red-600 underline"
        >
          Remove
        </button>
      )}
    </li>
  )
}
