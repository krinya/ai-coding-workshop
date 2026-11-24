// One input for the 6-digit code: digits only, paste-friendly, and phones can autofill it.
type Props = {
  value: string
  onChange: (code: string) => void
  onComplete: (code: string) => void
}

export default function CodeInput({ value, onChange, onComplete }: Props) {
  function handleChange(raw: string) {
    const code = raw.replace(/\D/g, '').slice(0, 6)
    onChange(code)
    if (code.length === 6 && code !== value) onComplete(code)
  }

  return (
    <input
      aria-label="6-digit code"
      value={value}
      onChange={(event) => handleChange(event.target.value)}
      inputMode="numeric"
      autoComplete="one-time-code"
      autoFocus
      placeholder="••••••"
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center font-mono text-3xl tracking-[0.5em] text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
    />
  )
}
