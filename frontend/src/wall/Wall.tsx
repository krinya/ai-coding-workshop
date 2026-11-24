// The live wall for the projector at /wall. Public; refreshes every few seconds.
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'

import { api } from '../api/client'
import { errorText } from '../api/errors'
import type { Emoji, Wall as WallData } from '../api/types'
import BarChart from './BarChart'
import EntryCard from './EntryCard'
import WordCloud from './WordCloud'

const REFRESH_MS = 4000

export default function Wall() {
  const [wall, setWall] = useState<WallData | null>(null)
  const [signedIn, setSignedIn] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let current = true // stop updating once the page is gone
    const load = () =>
      api
        .GET('/api/wall')
        .then(({ data }) => current && data && setWall(data))
        .catch(() => {}) // keep showing the last wall; the next refresh tries again
    void load()
    const timer = setInterval(() => void load(), REFRESH_MS)
    void api.GET('/api/auth/me').then(({ data }) => current && setSignedIn(Boolean(data)))
    return () => {
      current = false
      clearInterval(timer)
    }
  }, [])

  async function react(feedbackId: number, emoji: Emoji) {
    const { data, error } = await api.POST('/api/feedback/{feedback_id}/reactions', {
      params: { path: { feedback_id: feedbackId } },
      body: { emoji },
    })
    if (error) return setError(errorText(error))
    // Show the server's answer right away instead of waiting for the next refresh
    setWall(
      (old) =>
        old && {
          ...old,
          entries: old.entries.map((entry) =>
            entry.id === feedbackId ? { ...entry, ...data } : entry,
          ),
        },
    )
  }

  if (!wall) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading the wall…
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white sm:p-8">
      <div className="mx-auto grid max-w-[1800px] gap-6 lg:grid-cols-[340px_1fr] lg:gap-8">
        <aside className="flex flex-col gap-6 lg:sticky lg:top-8 lg:self-start">
          <header className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-bold tracking-tight whitespace-nowrap sm:text-3xl">
              Rate this course ⭐
            </h1>
            <a
              href="/"
              className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold whitespace-nowrap lg:hidden"
            >
              Rate it →
            </a>
          </header>

          <section className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
            <div className="flex items-end gap-3">
              <span className="text-8xl leading-none font-black text-amber-400 tabular-nums">
                {wall.average === null ? '–' : String(Number(wall.average.toFixed(1)))}
              </span>
              <span className="flex flex-col pb-2 text-slate-300">
                <span>/ 5</span>
                <span>{wall.count === 1 ? '1 rating' : `${wall.count} ratings`}</span>
              </span>
            </div>
            <div className="mt-6">
              <BarChart histogram={wall.histogram} />
            </div>
          </section>

          {wall.join_url ? (
            <section className="hidden items-center gap-4 rounded-3xl bg-white p-4 text-slate-900 lg:flex">
              <QRCodeSVG
                value={wall.join_url}
                size={128}
                role="img"
                aria-label="QR code to join"
                className="shrink-0"
              />
              <p className="text-xl leading-snug font-bold">Scan to rate the course</p>
            </section>
          ) : (
            <section className="rounded-3xl bg-white/5 p-6 text-center text-xl text-slate-300 ring-1 ring-white/10">
              Feedback is closed
            </section>
          )}
        </aside>

        <div className="flex flex-col gap-6">
          <section
            aria-label="Most used words"
            className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10"
          >
            <WordCloud words={wall.words} />
          </section>

          {error && (
            <p role="alert" className="rounded-lg bg-red-500/20 px-4 py-2 text-red-200">
              {error}
            </p>
          )}

          {wall.entries.length === 0 ? (
            <p className="py-20 text-center text-2xl text-slate-400">
              No feedback yet{wall.join_url ? ' — scan the QR code and be the first!' : '.'}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] sm:gap-6">
              {wall.entries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  canReact={signedIn}
                  onReact={(emoji) => void react(entry.id, emoji)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <button
        onClick={() => void document.documentElement.requestFullscreen?.()}
        className="fixed right-4 bottom-4 hidden rounded-lg px-3 py-1.5 text-sm text-slate-500 ring-1 ring-white/10 hover:text-white lg:block"
      >
        Full screen
      </button>
    </main>
  )
}
