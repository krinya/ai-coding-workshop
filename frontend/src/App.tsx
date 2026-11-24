const REPO_URL = 'https://github.com/krinya/ai-coding-workshop'

export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900">AI Coding Workshop</h1>
      <a
        href={REPO_URL}
        target="_blank"
        rel="noreferrer"
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        View the code on GitHub
      </a>
    </main>
  )
}
