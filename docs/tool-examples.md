# The tools in action: real examples

[building-blocks.md](building-blocks.md) explains what each tool is for. This page shows each
one **catching a real mistake**: the code, the exact output the tool prints (captured from this
repo), what it means, and the fix. These are the mistakes an AI assistant typically makes when it
writes code quickly — and because each tool names the file, the line and the problem, the
assistant can read the error and fix it without you.

Every example is run by one command: **`make check`**. You rarely run the tools one by one.

- [Type checkers: mypy and tsc](#type-checkers-mypy-and-tsc)
- [The API contract: generated types](#the-api-contract-generated-types)
- [Linters: Ruff and oxlint](#linters-ruff-and-oxlint)
- [Formatters: Ruff and Prettier](#formatters-ruff-and-prettier)
- [Tests: pytest, Vitest, Playwright](#tests-pytest-vitest-playwright)
- [Migrations: Alembic](#migrations-alembic)
- [Make, the hook and the guard rails](#make-the-hook-and-the-guard-rails)
- [Prompts that use all of this](#prompts-that-use-all-of-this)

## Type checkers: mypy and tsc

**Why:** a type checker reads the code *without running it* and proves that every value is used
as what it is. It finds the bug before any user — or test — does.

### mypy: Python

```python
def total_price(prices: list[float]) -> int:
    total = 0.0
    for price in prices:
        total += price
    return total


def llm_key() -> str:
    return settings.llm_api_key.get_secret_value()


total_price(["9.99", "4.50"])
```

```text
$ make typecheck
app/example.py:8: error: Incompatible return value type (got "float", expected "int")  [return-value]
app/example.py:12: error: Item "None" of "SecretStr | None" has no attribute "get_secret_value"  [union-attr]
app/example.py:15: error: List item 0 has incompatible type "str"; expected "float"  [list-item]
app/example.py:15: error: List item 1 has incompatible type "str"; expected "float"  [list-item]
```

| Error | What it caught | Fix |
| --- | --- | --- |
| `return-value` | The function promises a whole number but returns `14.49`. | Declare `-> float`. |
| `union-attr` | `LLM_API_KEY` may be missing from `.env`, so the key can be `None`. Without the check, this crashes the first time someone runs it without a key. | `if settings.llm_api_key is None: raise ...` before using it. |
| `list-item` | Prices arrive as text (`"9.99"`), e.g. straight from a form. | Convert them: `float(p)`, or let a Pydantic model do it. |

The second one is the most valuable: it is a crash that *only happens on someone else's
machine*. mypy finds it on yours.

### tsc: TypeScript

```tsx
type CounterProps = { label: string; start: number }

export function Page() {
  return <Counter label="Clicks" start="0" />
}
```

```text
$ make typecheck
src/Status.tsx(18,34): error TS2322: Type 'string' is not assignable to type 'number'.
```

`start="0"` passes the *text* `"0"`; `count + 1` would then give `"01"`, not `1`. The fix is
`start={0}`. In plain JavaScript this bug shows up as a wrong number on screen, much later.

> **Rule in `CLAUDE.md`:** never silence a checker with `Any`, `# type: ignore`, `as any` or
> `@ts-ignore`. An assistant under pressure to "make it pass" will reach for these; the rule
> makes it fix the real problem instead.

## The API contract: generated types

**Why:** the backend (Python) and the frontend (TypeScript) are separate programs. Normally
nothing stops one from changing a field name the other relies on — you find out when the page
goes blank. Here the frontend's types are *generated from the backend*, so a mismatch is a
compile error.

A component reads the database status from `/api/health`:

```tsx
api.GET('/api/health').then(({ data }) => setUp(data?.database ?? false))
```

Now the assistant renames the field in the backend, `database` → `database_up`, and runs
`make check`, which regenerates the types first:

```text
$ make check
src/Status.tsx(9,64): error TS2339: Property 'database' does not exist on type
'{ status: string; environment: string; database_up: boolean; llm_configured: boolean; email_configured: boolean; }'.
```

The error names the frontend file and line that still uses the old name, and lists the fields
that do exist. Fix: `data?.database_up`. Without generated types this change passes every check
and the page silently shows "down" forever.

CI adds one more step: if someone changed the backend but did not commit the regenerated types,
the build fails with `Generated API types are committed`.

## Linters: Ruff and oxlint

**Why:** a linter knows the classic mistakes of a language — code that runs, but is wrong,
risky or dead. Where the type checker asks "do the types fit?", the linter asks "is this a known
bad pattern?"

### Ruff: Python

```python
import os


def add_tag(tag, tags=[]):
    tags.append(tag)
    return tags


def find_user(name: str) -> str:
    return f"SELECT * FROM users WHERE name = '{name}'"


def safe_divide(a: float, b: float) -> float:
    try:
        return a / b
    except:
        return 0
```

```text
$ make lint
app/example.py:1:8: F401 [*] `os` imported but unused
app/example.py:6:23: B006 Do not use mutable data structures for argument defaults
app/example.py:20:12: S608 Possible SQL injection vector through string-based query construction
app/example.py:26:5: E722 Do not use bare `except`
```

| Rule | What it caught | Fix |
| --- | --- | --- |
| `F401` | Dead import. `[*]` means `make format` removes it for you. | Automatic. |
| `B006` | Python creates the `[]` default **once**: every call without `tags` shares, and grows, the same list. A classic bug that is very hard to spot by reading. | `tags: list[str] \| None = None`, then `tags = tags or []`. |
| `S608` | A name like `' OR '1'='1` rewrites the query: SQL injection, a top-10 security flaw. | Query through SQLAlchemy (`select(User).where(User.name == name)`), never by building SQL strings. |
| `E722` | A bare `except` also swallows typos, `Ctrl+C` and every other bug, and hides them behind `0`. | Catch what you expect: `except ZeroDivisionError:`. |

### oxlint: React and TypeScript

```tsx
export function Counter({ label, start }: CounterProps) {
  if (label === '') {
    return null
  }
  const [count, setCount] = useState(start)
  const unused = 42
  useEffect(() => {
    document.title = `${label}: ${count}`
  }, [])
  return <button onClick={() => setCount(count + 1)}>{label}</button>
}
```

```text
$ make lint
src/Status.tsx:9:29: error react-hooks(rules-of-hooks): React Hook "useState" is called conditionally.
  React Hooks must be called in the exact same order in every component render.
  help: Move the Hook call before the condition, or call it unconditionally and branch inside the Hook/effect instead.
src/Status.tsx:11:3: error react-hooks(rules-of-hooks): React Hook "useEffect" is called conditionally. ...
src/Status.tsx:12:25: warning react-hooks(exhaustive-deps): React Hook useEffect has missing dependencies: 'label', and 'count'
src/Status.tsx:10:9: warning eslint(no-unused-vars): Variable 'unused' is declared but never used.
```

- **`rules-of-hooks`**: React remembers state by the *order* of hook calls. The early `return`
  changes that order between renders, and the component breaks in confusing ways. Fix: move the
  `if (label === '') return null` below the hooks.
- **`exhaustive-deps`**: the effect uses `label` and `count` but says it depends on nothing
  (`[]`), so the tab title never updates after a click. Fix: `[label, count]`.

Both compile fine and pass the type checker — only a linter that knows React's rules sees them.
Note the `help:` line: it tells the assistant exactly how to fix it.

## Formatters: Ruff and Prettier

**Why:** layout is not worth anyone's attention. A formatter rewrites the code into one
standard style, so diffs show only real changes and nobody argues about spaces.

Python, before and after `make format`:

```python
def greet(name:str)->str :
    return "Hello, "+name+"!"
items=[ 1,2,
  3 ]
```

```python
def greet(name: str) -> str:
    return "Hello, " + name + "!"


items = [1, 2, 3]
```

TypeScript — Prettier also puts Tailwind classes in a fixed order (layout → colour → spacing →
type → effects), so two components with the same style look the same in the code:

```tsx
export function Card({title}:{title:string}){
  return <div className="p-4 text-white shadow-lg rounded-xl bg-slate-800 font-bold"><h2>{title}</h2></div>;
}
```

```tsx
export function Card({ title }: { title: string }) {
  return (
    <div className="rounded-xl bg-slate-800 p-4 font-bold text-white shadow-lg">
      <h2>{title}</h2>
    </div>
  )
}
```

With Claude Code you never run this yourself: the format hook runs it on every file the
assistant edits.

## Tests: pytest, Vitest, Playwright

**Why:** the checkers above prove the code is *consistent*. Only a test proves it does *what you
wanted*. A test is also the most precise way to tell an assistant what "done" means.

### pytest: write the test first

Before any code exists, describe the feature as a test (`backend/tests/test_greeting.py`):

```python
def test_greeting_uses_the_name(client: TestClient) -> None:
    response = client.get("/api/greeting", params={"name": "Ada"})
    assert response.status_code == 200
    assert response.json() == {"message": "Hello, Ada!"}
```

```text
$ make test
>       assert response.status_code == 200
E       assert 404 == 200
E        +  where 404 = <Response [404 Not Found]>.status_code
tests/test_greeting.py:6: AssertionError
FAILED tests/test_greeting.py::test_greeting_uses_the_name - assert 404 == 200
```

`404` means the endpoint does not exist yet — the test is red for the right reason. Now ask the
assistant to *make the test pass*. It has an exact target, it can check itself, and the test
stays behind to protect the feature from later changes.

The `client` fixture (`tests/conftest.py`) talks to a separate `app_test` database that is
emptied after every test, so tests can create data freely without touching yours.

### Vitest: one component

Someone changes the title in `App.tsx` to "AI Workshop":

```text
$ make test
 FAIL  src/App.test.tsx > App > shows the title
Error: expect(element).toHaveTextContent()
Expected element to have text content:
  AI Coding Workshop
Received:
  AI Workshop
 ❯ src/App.test.tsx:9:55
```

A failing test asks a question: **is the code wrong, or is the test out of date?** If the new
title was intended, update the test; if not, the test just caught a regression. When an
assistant "fixes" a failing test, check which of the two it changed — and why.

### Playwright: the real browser

The same change, seen by the end-to-end test that drives Chromium against the running app:

```text
$ make e2e
  1) [chromium] › e2e/home.spec.ts:3:1 › home page shows the title
    Error: expect(locator).toHaveText(expected) failed
    Locator:  getByRole('heading', { level: 1 })
    Expected: "AI Coding Workshop"
    Received: "AI Workshop"
    Timeout:  5000ms
      - waiting for getByRole('heading', { level: 1 })
        14 × locator resolved to <h1 class="text-4xl font-semibold ...">AI Workshop</h1>
    attachment #1: screenshot (image/png)
```

Playwright retried for 5 seconds (pages load asynchronously), then saved a **screenshot** of the
failure in `frontend/test-results/`. Browser tests are slower, so keep a few for the main flows
(sign up, submit the form, see the result) and test the details with pytest and Vitest.

### Coverage: where the tests are thin

```text
$ make coverage
Name             Stmts   Miss  Cover   Missing
...
TOTAL               60      4    93%
```

`Missing` lists the line numbers no test runs. Ask the assistant to "add tests for the
uncovered lines in `app/notes.py`" — a concrete, checkable request.

## Migrations: Alembic

**Why:** the database schema has to change along with the code, the same way on every machine.
A migration is a small, reviewable script for each change.

The assistant adds a model to `backend/app/models.py`:

```python
class Note(Base):
    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(primary_key=True)
    text: Mapped[str]
    done: Mapped[bool] = mapped_column(default=False)
```

```text
$ make migration m="add notes table"
INFO  [alembic.autogenerate.compare.tables] Detected added table 'notes'
Generating backend/migrations/versions/2026_11_24_1635-2c8cac07b96b_add_notes_table.py ...  done
```

The generated file:

```python
def upgrade() -> None:
    op.create_table(
        "notes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("text", sa.String(), nullable=False),
        sa.Column("done", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("notes")
```

**Read it before `make migrate`.** Autogenerate compares the models with the database and
guesses. It is usually right, but a *renamed* column shows up as "drop column + add column" —
which deletes the data in it. This is the one place where reading the AI's output matters most:
code can be fixed later, deleted data cannot.

## Make, the hook and the guard rails

**`make`** — one menu for every task, the same for you, your teammates, CI and the assistant:

```text
$ make help
  setup          First-time setup: .env, dependencies, Playwright's browser
  up             Start the whole stack in Docker (http://localhost:5173)
  migration      Create a migration from changed models: make migration m="add notes table"
  api-types      Regenerate the frontend's API types from the backend
  test           Unit tests: backend (pytest, own test database) and frontend (Vitest)
  check          Everything CI runs: format, lint, types, unit tests, build, browser tests
  ...
```

**The format hook** (`.claude/hooks/format.mjs`) runs after *every* file the assistant edits. It
is the difference between an instruction ("please format your code") that a model may forget and
a rule the tool enforces. Anything that must always happen belongs in a hook.

**The `.env` guard** (`.claude/settings.json`) — ask Claude Code to "show me what's in .env" and
the read is refused. Your keys never enter the conversation, so they cannot end up in a log, a
commit, or a model's context.

**The Playwright MCP server** — "open localhost:5173 and take a screenshot" gives the assistant
eyes. After a UI change it can see that the button overlaps the title and fix it — no type
checker or test describes "looks wrong".

**The `reviewer` agent** — "use the reviewer agent on my changes" starts a second assistant
that sees only the diff and `CLAUDE.md`, not the first one's reasoning. It catches what the
author was too close to see — like the migration above that would drop a column.

## Prompts that use all of this

| Instead of… | Say… | Why it works |
| --- | --- | --- |
| "Add a notes feature" | "Add notes: a `Note` model, `GET/POST /api/notes`, and a list on the page. Write the pytest tests first, then make them pass, then `/check`." | The tests define done; `/check` proves it. |
| "It's broken" | "`make check` fails — fix the first error." | The tool already said exactly what is wrong. |
| "Make it look nicer" | "Open the page with Playwright, take a screenshot, and fix what looks off on a phone-sized window." | The assistant can see the result instead of guessing. |
| "Rename `database` to `database_up`" | …the same, plus "then fix the frontend until `make check` passes." | The generated types point at every place to change. |
| "Looks good, commit" | "Use the reviewer agent on these changes first." | A second, unanchored read before it is permanent. |
