// Five stars that are real radio buttons underneath: clicks, arrow keys and screen readers work.
type Props = {
  value: number // 0 means "not picked yet"
  onChange: (value: number) => void
}

export default function StarRating({ value, onChange }: Props) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 text-sm font-medium text-slate-700">Your rating</legend>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <label key={star} className="cursor-pointer">
            <input
              type="radio"
              name="rating"
              value={star}
              checked={value === star}
              onChange={() => onChange(star)}
              required
              aria-label={star === 1 ? '1 star' : `${star} stars`}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className={`block text-4xl leading-none transition-transform peer-focus-visible:rounded peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-400 hover:scale-110 sm:text-5xl ${
                star <= value ? 'text-amber-400' : 'text-slate-300'
              }`}
            >
              ★
            </span>
          </label>
        ))}
        <span className="ml-3 text-sm text-slate-500">
          {value ? `${value} / 5` : 'Pick a rating'}
        </span>
      </div>
    </fieldset>
  )
}
