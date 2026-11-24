// The most used words in the comments: the more often a word is used, the bigger it is.
import type { Wall } from '../api/types'

const COLOURS = [
  'text-amber-300',
  'text-sky-300',
  'text-pink-300',
  'text-emerald-300',
  'text-violet-300',
]

export default function WordCloud({ words }: { words: Wall['words'] }) {
  if (words.length === 0)
    return <p className="text-slate-400">Words from the comments appear here.</p>
  const most = words[0]?.count ?? 1
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
      {words.map(({ word, count }, index) => (
        <li
          key={word}
          title={`${count}×`}
          className={`leading-tight font-semibold ${COLOURS[index % COLOURS.length]}`}
          style={{ fontSize: `${1 + (count / most) * 2.2}rem` }}
        >
          {word}
        </li>
      ))}
    </ul>
  )
}
