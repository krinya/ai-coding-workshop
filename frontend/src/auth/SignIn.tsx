// Two steps: enter your email → enter the 6-digit code we emailed you.
import { useState, type FormEvent } from 'react'

import { api } from '../api/client'
import { errorText } from '../api/errors'
import type { Me } from '../api/types'
import CodeInput from './CodeInput'

type Props = { onSignedIn: (me: Me) => void }

export default function SignIn({ onSignedIn }: Props) {
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function sendCode(event?: FormEvent) {
    event?.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await api.POST('/api/auth/request-code', { body: { email } })
    setBusy(false)
    if (error) return setError(errorText(error))
    setCode('')
    setStep('code')
  }

  async function verify(codeToCheck: string) {
    setBusy(true)
    setError('')
    const { data, error } = await api.POST('/api/auth/verify-code', {
      body: { email, code: codeToCheck, display_name: displayName || null },
    })
    setBusy(false)
    if (error) return setError(errorText(error))
    onSignedIn(data)
  }

  return (
    <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200 sm:p-8">
      {step === 'email' ? (
        <form onSubmit={sendCode} className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-slate-900">Sign in</h2>
          <p className="text-sm text-slate-600">
            We email you a 6-digit code. No password needed — the first sign-in creates your
            account.
          </p>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
            {busy ? 'Sending…' : 'Email me a code'}
          </button>
        </form>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void verify(code)
          }}
          className="flex flex-col gap-4"
        >
          <h2 className="text-xl font-semibold text-slate-900">Check your email</h2>
          <p className="text-sm text-slate-600">
            We sent a code to <strong className="block break-all">{email}</strong>
            It works for 10 minutes.
          </p>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Your name on the wall{' '}
            <span className="font-normal text-slate-500">(optional, first sign-in only)</span>
            <input
              value={displayName}
              maxLength={50}
              autoComplete="nickname"
              onChange={(event) => setDisplayName(event.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-3 text-base font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </label>
          <div className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            <span aria-hidden="true">Code from the email</span>
            <CodeInput value={code} onChange={setCode} onComplete={(full) => void verify(full)} />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            disabled={busy || code.length !== 6}
            className="rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {busy ? 'Checking…' : 'Sign in'}
          </button>
          <div className="flex justify-between text-sm">
            <button
              type="button"
              onClick={() => setStep('email')}
              className="text-slate-600 underline hover:text-slate-900"
            >
              Use another email
            </button>
            <button
              type="button"
              onClick={() => void sendCode()}
              className="text-indigo-600 underline hover:text-indigo-800"
            >
              Send a new code
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
