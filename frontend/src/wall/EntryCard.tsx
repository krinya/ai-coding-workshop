// One feedback entry on the wall: photo, name, stars, comment and emoji reactions.
import type { Emoji, WallEntry } from '../api/types'

const EMOJIS: Emoji[] = ['clap', 'laugh', 'heart']
const EMOJI: Record<Emoji, string> = { clap: '👏', laugh: '😂', heart: '❤️' }

type Props = {
  entry: WallEntry
  canReact: boolean
  onReact: (emoji: Emoji) => void
}

export default function EntryCard({ entry, canReact, onReact }: Props) {
  const name = entry.display_name ?? 'Anonymous'
  return (
    <article
      aria-label={name}
      className="animate-pop-in flex flex-col overflow-hidden rounded-2xl bg-white text-slate-900 shadow-xl"
    >
      {entry.photo_url ? (
        <img src={entry.photo_url} alt={name} className="aspect-square w-full object-cover" />
      ) : (
        <div
          aria-hidden="true"
          className="flex aspect-square w-full items-center justify-center bg-gradient-to-br from-indigo-400 to-pink-400 text-5xl font-bold text-white sm:text-7xl"
        >
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex grow flex-col gap-2 p-3 sm:p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-2">
          <h3 className="truncate font-semibold">{name}</h3>
          <span
            aria-label={`${entry.rating} out of 5 stars`}
            className="shrink-0 tracking-tight text-amber-400"
          >
            {'★'.repeat(entry.rating)}
            <span className="text-slate-300">{'★'.repeat(5 - entry.rating)}</span>
          </span>
        </div>
        {entry.comment && <p className="text-sm break-words text-slate-700">{entry.comment}</p>}
        <div className="mt-auto flex flex-wrap gap-1 pt-1 sm:gap-2">
          {EMOJIS.map((emoji) => {
            const pressed = entry.my_reactions.includes(emoji)
            return (
              <button
                key={emoji}
                type="button"
                disabled={!canReact}
                aria-pressed={pressed}
                title={canReact ? undefined : 'Sign in to react'}
                onClick={() => onReact(emoji)}
                className={`rounded-full px-1.5 py-0.5 text-xs tabular-nums transition enabled:hover:scale-110 disabled:cursor-default sm:px-2.5 sm:py-1 sm:text-sm ${
                  pressed ? 'bg-indigo-100 ring-2 ring-indigo-400' : 'bg-slate-100'
                }`}
              >
                {EMOJI[emoji]} {entry.reactions[emoji]}
              </button>
            )
          })}
        </div>
      </div>
    </article>
  )
}
