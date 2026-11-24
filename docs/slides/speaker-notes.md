# AI Coding Workshop — speaker notes

What to say on each slide. The slides: [index.html](index.html) (open in a browser) or [the PDF](ai-coding-workshop.pdf).

## 1. Building a web app with AI

Welcome everyone. Today is hands-on: by the end, each of you will have built a small web app together with an AI. You don't need to know how to code. You need to know what you want, and I'll show you how to check that you got it.

## 2. Some people build working software with AI every day. Others don’t know it’s possible.

This is what made me want to run this workshop. Around me I see a wide gap: some colleagues build small tools with AI every week, others have never tried, and many use it only as a search engine. The difference isn't how clever people are. It's whether someone has shown them what is possible and how to work with it.

## 3. From asking questions to building together

Most people stop at the first or second. The third is different in kind: the AI isn't a chat window any more, it's a colleague working in the same project. It can run what it wrote, see that something failed, and fix it. That's what we'll do today.

## 4. Let’s build a real web app — together, with AI.

So the idea is simple: instead of talking about AI, we build something with it. A real web app that runs in your browser, with a page, a server behind it and a database. You bring the idea; the AI does the typing; and together we learn how to check that it really works.

## 5. The plan

Four parts. First why — that's what we just did. Then I'll open up the starter kit I prepared, so you understand what's underneath. Most of the time goes to building. We finish by showing each other what we made.

## 6. You could just ask Claude to “make me an app”. So why a starter kit?

A fair question: Claude can build an app from one sentence, so why did I prepare anything? Because the first version is the easy part. The hard part is the tenth change, when something you didn't touch quietly stops working. The starter kit makes every mistake visible within seconds, with its exact place, so the AI can fix it before you ever see it.

## 7. Don’t start in an empty field.

Think of building a house. Asking the AI with nothing prepared is like starting in an empty field: it will build you something, but nobody checks the walls. The starter kit is a plot with the foundations poured, the utilities connected, and an inspector who checks every wall the moment it goes up. The AI is still the builder; the inspector is what makes it trustworthy.

## 8. Like a restaurant: three rooms

Every web app has the same three parts, and a restaurant is a good picture of them. Guests only see the dining room — that's the frontend, the page in your browser. The kitchen does the work and keeps the secret recipes; in software those are passwords and API keys, and they must never be brought out to the dining room. The pantry is the database. When our app uses AI or sends an email, the kitchen phones a supplier; the guest never does.

## 9. A shipping container for software

Installing software is where workshops usually lose the first hour. Docker solves that. Like a shipping container, it packs the app with everything it needs, so it runs the same on any machine. Next to it is Make: a menu of short commands, so instead of remembering long instructions you type 'make up' to start everything and 'make check' to run all the checks.

## 10. Four checkers that never get tired

These four are the building inspector. You don't need to know how they work, only what each one catches. The formatter keeps everything tidy. The linter is a grammar checker for code: it knows mistakes people have made a million times, including security holes. The type checker is like plugs and sockets: a UK plug doesn't fit an EU socket, and it tells you before you switch anything on. And tests are a checklist that actually clicks through the app. All four run with one command, in seconds, every time.

## 11. The tidy-up: same layout, every time

The simplest of the four. A formatter is like auto-format in Word: it puts every space and line break in the same place. Nobody has to think about it — in our setup it runs automatically every time the AI saves a file. The benefit: when you compare two versions, the only differences you see are real changes, not someone's spacing habits.

## 12. The grammar checker: knows the classic mistakes

A linter is a grammar checker for code. Spell-check finds typos; grammar check finds sentences that are spelled right but still wrong. Here the AI wrote a perfectly working way to look up a user by name. But a visitor could type something sneaky as their name and change what the database is asked — a classic attack called SQL injection. The linter recognised the pattern instantly, named it, and the AI rewrote it the safe way.

## 13. The plug and socket: does every piece fit?

A type checker knows what kind of thing each piece expects: a number, a piece of text, a date. Here the counter expects a number, but the AI gave it the text "0" — one pair of quotes. Nothing crashes; the counter would just count wrongly: zero-one, zero-one-one. You might not notice for weeks. The type checker refuses it before the app even starts, like a plug that won't go into the wrong socket.

## 14. The checklist: “done” written down

Tests are the most powerful of the four, because they check what you actually wanted. The trick: write the test first. Here we wrote down, in one line, that asking for a greeting for Ada should answer "Hello, Ada!". We ran it before anything was built, and it failed — exactly as it should. Then we told the AI: make this pass. It has a precise target and can check itself. And the test stays: if a later change breaks the greeting, it turns red again. There are also tests that click through the real page in a browser, like a user would.

## 15. The AI works inside the safety net

This is the heart of it. Without the starter kit, the loop stops after step 2: the AI writes something and you find out later whether it works. With it, steps 2 to 4 repeat on their own — write, check, fix — until everything is green. You only step in at the beginning, to say what you want, and at the end, to look and decide.

## 16. A mistake, caught in a second

Here's a real example from this starter kit. The AI renamed a single word in the kitchen. Everything still looked fine. But the type checker immediately said: in this file, on line 9, the dining room still asks for the old name. The AI read that and fixed it. Without the checker, nothing would have crashed — the page would just have shown the wrong thing, forever, and someone would have had to discover why.

## 17. A rulebook, eyes, and a second opinion

Four more things in the kit make the AI better at its job. A rulebook — a file called CLAUDE.md — is like the onboarding handbook you give a new colleague. Eyes: it can open the app in a browser and look, so it notices when a button is in the wrong place. A second opinion: a separate reviewer that only sees the changes, so it isn't blinded by the first AI's reasoning. And a safe: the file with passwords and keys is off-limits to the AI, so they never end up anywhere they shouldn't.

## 18. Just asking vs. the starter kit

To sum up the building blocks: starting is equally fast either way. The difference shows up from the second change onwards. With the kit, mistakes are found immediately and precisely, and the AI fixes them itself. Without it, you find them later — or your users do.

## 19. How we work today

Now it's your turn. Everyone gets their own copy of the starter from GitHub. Then you describe a feature in plain words — no technical terms needed. The AI builds it and runs the checks until everything passes. And then the most important part: open the page, try it yourself, and ask for changes. Repeat.

## 20. Small changes in wording, big difference

The skill you practise today is describing. Be concrete about what someone should be able to do. Ask for the tests first, so the AI knows what "done" means. When something breaks, don't describe the symptom — let the checker tell it. Ask it to look at the page. And before you call it done, ask for a second opinion.

## 21. Ideas to get you started

If you don't have an idea yet, pick one of these. Start with the warm-up if you're unsure — it already uses the page, the kitchen and the pantry. The quiz and the notes use the AI. The stretch one also sends email. The best projects, though, come from your own work: a small annoying task you'd like a tool for.

## 22. The skill is no longer typing code.

If you remember one thing: the bottleneck has moved. Typing code is now the easy part. What matters is describing clearly what you want, and having a way to check that you got it — that's what the starter kit gives you. The repository stays online, so you can keep building after today. Thank you!
