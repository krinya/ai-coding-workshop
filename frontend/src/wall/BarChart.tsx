// How many people gave 1, 2, 3, 4 and 5 stars, as horizontal bars (5 stars on top).
type Props = { histogram: number[] }

export default function BarChart({ histogram }: Props) {
  const most = Math.max(1, ...histogram)
  return (
    <ul className="flex flex-col gap-2">
      {[5, 4, 3, 2, 1].map((stars) => {
        const count = histogram[stars - 1] ?? 0
        return (
          <li
            key={stars}
            aria-label={`${stars} ${stars === 1 ? 'star' : 'stars'}: ${count}`}
            className="flex items-center gap-3 text-lg"
          >
            <span aria-hidden="true" className="w-10 shrink-0 text-right text-amber-300">
              {stars}★
            </span>
            <span className="h-6 grow overflow-hidden rounded-full bg-white/10">
              <span
                className="block h-full rounded-full bg-amber-400 transition-[width] duration-700"
                style={{ width: `${(count / most) * 100}%` }}
              />
            </span>
            <span aria-hidden="true" className="w-8 shrink-0 text-slate-300 tabular-nums">
              {count}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
