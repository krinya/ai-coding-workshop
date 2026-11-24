// The feedback form. Loads your entry if you already sent one, so you can edit or delete it.
import confetti from 'canvas-confetti'
import { useCallback, useEffect, useState, type FormEvent } from 'react'

import { api } from '../api/client'
import { errorText } from '../api/errors'
import type { MyFeedback } from '../api/types'
import PhotoPicker from './PhotoPicker'
import StarRating from './StarRating'

const MAX_COMMENT = 500

export default function FeedbackForm() {
  const [loaded, setLoaded] = useState(false)
  const [entry, setEntry] = useState<MyFeedback | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [photo, setPhoto] = useState<string | null>(null) // a new photo, not yet saved
  const [removePhoto, setRemovePhoto] = useState(false)
  const [consent, setConsent] = useState(false)
  const [pickerKey, setPickerKey] = useState(0) // changing it resets the photo picker
  const [status, setStatus] = useState<{ kind: 'error' | 'done'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function show(saved: MyFeedback | null) {
    setEntry(saved)
    setRating(saved?.rating ?? 0)
    setComment(saved?.comment ?? '')
    setConsent(Boolean(saved?.photo_url))
    setPhoto(null)
    setRemovePhoto(false)
    setPickerKey((key) => key + 1)
  }

  useEffect(() => {
    // Ignore a late answer from an earlier run of this effect, or it would wipe the form
    let current = true
    api
      .GET('/api/feedback/mine')
      .then(({ data }) => current && show(data ?? null))
      .catch(() => current && setStatus({ kind: 'error', text: 'Could not load your feedback.' }))
      .finally(() => current && setLoaded(true))
    return () => {
      current = false
    }
  }, [])

  const onPhoto = useCallback((next: string | null) => setPhoto(next), [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setStatus(null)
    const body = {
      rating,
      comment,
      photo,
      photo_consent: consent,
      remove_photo: removePhoto && !photo, // a newly picked photo replaces the old one
    }
    const { data, error } = entry
      ? await api.PUT('/api/feedback/{feedback_id}', {
          params: { path: { feedback_id: entry.id } },
          body,
        })
      : await api.POST('/api/feedback', { body })
    setBusy(false)
    if (error) return setStatus({ kind: 'error', text: errorText(error) })
    show(data)
    setStatus({
      kind: 'done',
      text: entry ? 'Saved your changes.' : 'Thank you for your feedback!',
    })
    void confetti({ particleCount: 150, spread: 80, origin: { y: 0.7 } })
  }

  async function remove() {
    if (!entry) return
    const { error } = await api.DELETE('/api/feedback/{feedback_id}', {
      params: { path: { feedback_id: entry.id } },
    })
    setConfirmDelete(false)
    if (error) return setStatus({ kind: 'error', text: errorText(error) })
    show(null)
    setStatus({ kind: 'done', text: 'Your feedback is deleted.' })
  }

  if (!loaded) return <p className="text-slate-500">Loading…</p>

  const keepsOldPhoto = Boolean(entry?.photo_url) && !removePhoto && !photo
  const hasPhoto = Boolean(photo) || keepsOldPhoto

  return (
    <form
      onSubmit={submit}
      className="flex w-full max-w-xl flex-col gap-6 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200 sm:p-8"
    >
      <h2 className="text-xl font-semibold text-slate-900">
        {entry ? 'Your feedback' : 'How was the course?'}
      </h2>

      {status && (
        <p
          role={status.kind === 'error' ? 'alert' : 'status'}
          className={`rounded-lg px-4 py-3 text-sm ${
            status.kind === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'
          }`}
        >
          {status.text}{' '}
          {status.kind === 'done' && entry && (
            <a href="/wall" className="font-medium underline">
              See the live wall →
            </a>
          )}
        </p>
      )}

      <StarRating value={rating} onChange={setRating} />

      <div className="flex flex-col gap-1">
        <label htmlFor="comment" className="text-sm font-medium text-slate-700">
          Comment
        </label>
        <textarea
          id="comment"
          value={comment}
          maxLength={MAX_COMMENT}
          rows={4}
          placeholder="What did you like? What should change?"
          onChange={(event) => setComment(event.target.value)}
          className="rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        <span className="self-end text-xs text-slate-500">
          {comment.length} / {MAX_COMMENT}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-700">Photo (optional)</span>
        {keepsOldPhoto && entry?.photo_url && (
          <div className="flex items-center gap-3">
            <img
              src={entry.photo_url}
              alt="Your saved photo"
              className="h-20 w-20 rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={() => setRemovePhoto(true)}
              className="text-sm text-slate-600 underline hover:text-slate-900"
            >
              Remove photo
            </button>
          </div>
        )}
        <PhotoPicker key={pickerKey} onChange={onPhoto} />
      </div>

      <label className="flex items-start gap-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-indigo-600"
        />
        My photo may be shown on the screen during the workshop
      </label>
      {hasPhoto && !consent && (
        <p className="-mt-4 text-sm text-amber-700">
          Without this consent, your feedback is saved without the photo.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          disabled={busy || rating === 0}
          className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {busy ? 'Sending…' : entry ? 'Save changes' : 'Send feedback'}
        </button>
        {entry &&
          (confirmDelete ? (
            <span className="flex items-center gap-2 text-sm">
              Delete your feedback?
              <button
                type="button"
                onClick={() => void remove()}
                className="rounded-lg bg-red-600 px-3 py-2 font-medium text-white hover:bg-red-500"
              >
                Yes, delete
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="underline">
                Keep it
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-red-600 underline hover:text-red-800"
            >
              Delete
            </button>
          ))}
      </div>
    </form>
  )
}
