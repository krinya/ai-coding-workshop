// Take or upload a photo, pick a filter. Reports the result as a small JPEG data URL.
import { useEffect, useMemo, useRef, useState } from 'react'

import { FILTERS, fileToCanvas, filtered, toCanvas, type Filter } from './photo'

type Props = { onChange: (photo: string | null) => void }

// Laptops (a mouse or trackpad, and a camera API) get a live preview; phones get their camera app
function hasLiveCamera(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: fine)').matches &&
    typeof navigator.mediaDevices?.getUserMedia === 'function'
  )
}

const buttonClass =
  'cursor-pointer rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-400'

export default function PhotoPicker({ onChange }: Props) {
  const [source, setSource] = useState<HTMLCanvasElement | null>(null)
  const [filter, setFilter] = useState<Filter>('normal')
  const [cameraOn, setCameraOn] = useState(false)
  const [error, setError] = useState('')
  const liveCamera = hasLiveCamera()

  // One preview per filter, so the thumbnails show what each one looks like
  const previews = useMemo(
    () => (source ? new Map(FILTERS.map(({ id }) => [id, filtered(source, id)])) : null),
    [source],
  )

  useEffect(() => {
    onChange(previews?.get(filter) ?? null)
  }, [previews, filter, onChange])

  async function pickFile(file: File | undefined) {
    if (!file) return
    setError('')
    try {
      setSource(await fileToCanvas(file))
      setFilter('normal')
    } catch {
      setError('That file is not a picture we can read. Try a JPEG or PNG.')
    }
  }

  if (cameraOn) {
    return (
      <Camera
        onCapture={(canvas) => {
          setCameraOn(false)
          setSource(canvas)
          setFilter('normal')
        }}
        onCancel={() => setCameraOn(false)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {previews && (
        <>
          <img
            src={previews.get(filter)}
            alt="Your photo"
            className="w-full max-w-sm self-center rounded-xl shadow"
          />
          <div role="radiogroup" aria-label="Filter" className="grid grid-cols-4 gap-2">
            {FILTERS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={filter === id}
                onClick={() => setFilter(id)}
                className={`flex flex-col items-center gap-1 rounded-lg p-1 text-xs ${
                  filter === id ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'hover:bg-slate-100'
                }`}
              >
                <img
                  src={previews.get(id)}
                  alt=""
                  className="aspect-square w-full rounded object-cover"
                />
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="flex flex-wrap gap-2">
        {liveCamera ? (
          <button type="button" onClick={() => setCameraOn(true)} className={buttonClass}>
            📷 {source ? 'Retake' : 'Use camera'}
          </button>
        ) : (
          <label className={buttonClass}>
            📷 {source ? 'Retake' : 'Take a selfie'}
            <input
              type="file"
              accept="image/*"
              capture="user"
              className="sr-only"
              onChange={(event) => void pickFile(event.target.files?.[0])}
            />
          </label>
        )}
        <label className={buttonClass}>
          🖼️ Upload a picture
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => void pickFile(event.target.files?.[0])}
          />
        </label>
        {source && (
          <button
            type="button"
            onClick={() => setSource(null)}
            className="rounded-xl px-4 py-2.5 text-sm text-slate-600 underline hover:text-slate-900"
          >
            No photo
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

// Live camera preview with a 3-2-1 countdown
function Camera({
  onCapture,
  onCancel,
}: {
  onCapture: (canvas: HTMLCanvasElement) => void
  onCancel: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let stream: MediaStream | undefined
    let closed = false
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 } } })
      .then((opened) => {
        stream = opened
        if (closed) return stopCamera(opened)
        if (videoRef.current) videoRef.current.srcObject = opened
      })
      .catch(() => setError('The camera did not open. Allow camera access, or upload a picture.'))
    return () => {
      closed = true
      if (stream) stopCamera(stream)
    }
  }, [])

  useEffect(() => {
    if (countdown === null) return
    const video = videoRef.current
    if (countdown === 0 && video) {
      onCapture(toCanvas(video, video.videoWidth, video.videoHeight, true))
      return
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, onCapture])

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-xl bg-slate-900">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          aria-label="Camera preview"
          className="aspect-video w-full -scale-x-100 object-cover"
        />
        {countdown !== null && countdown > 0 && (
          <span
            key={countdown}
            className="absolute inset-0 flex items-center justify-center text-9xl font-bold text-white drop-shadow-lg"
          >
            {countdown}
          </span>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={countdown !== null || error !== ''}
          onClick={() => setCountdown(3)}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {countdown === null ? 'Take photo' : 'Smile!'}
        </button>
        <button type="button" onClick={onCancel} className={buttonClass}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function stopCamera(stream: MediaStream) {
  for (const track of stream.getTracks()) track.stop()
}
