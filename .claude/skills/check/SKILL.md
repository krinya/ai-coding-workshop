---
name: check
description: Run every check (format, lint, types, tests, build, browser tests), fix what fails, and repeat until all pass. Use before saying a task is done, or when the user says "check", "is it green", "run the tests".
---

# Check

1. Run `make check`. It starts Postgres if needed and regenerates the API types.
2. If it fails, read the **first** error only and fix its cause:
   - formatting or simple lint → `make format`
   - a type error → fix the type; never silence it with `Any`, `# type: ignore`, `as any` or
     `@ts-ignore`
   - a failing test → fix the code, unless the test asserts behaviour the user asked to change
   - a browser test → look at the page with the Playwright MCP tools before changing code
3. Run `make check` again. Repeat until it passes.
4. Report in one or two lines: what failed, what you changed, and that `make check` now passes.
   If you could not make it pass, say which step still fails and paste its error.
