# AI Coding Workshop — speaker notes

What to say on each slide. The slides: [index.html](index.html) (open in a browser) or [the PDF](ai-coding-workshop.pdf).

The talk starts wide and zooms in: what AI is (Part 1), why it needs checking (Part 2), then the web app we
build today (Part 3). The deck has a **cut point at slide 21**: everything before it prepares people to
write and send their first prompt. After they press enter, the AI works for several minutes, and slides
22–27 fill that time, ending by zooming back out to where this is heading. Slide 28 sends everyone back to
their screens.

The small grey line at the top of each slide (“Part 2 of 6 · The problem”) only shows where we are in the
talk; the big line is the slide’s title.

## Part 1 — The big picture

### 1. Building a web app with AI

Welcome everyone. Today is hands-on: by the end, each of you will have built a small web app together with an AI. You don't need to know how to code. You need to know what you want, and I'll show you how to check that you got it.

### 2. What used to take me a year, I now do in 1–3 days.

Let me start with why I'm here. Projects that used to take me a year, I now finish in one to three days. I'm not exaggerating. And it doesn't stop when I stop: an agent can keep working through the night on tasks I define for it. But there's a catch, and it's the whole point of today: it only works if you know what to ask for, and how to check that you got it. In the wrong hands, it's a fast way to make a mess. So let's start with what this thing actually is.

### 3. An LLM is autocomplete that read almost everything.

The AI we use is a large language model, an LLM. Underneath, it does one thing: given some text, it guesses the next word. You know this from your phone's keyboard. "The cat sat on the…" — mat, probably. Then it adds that word and guesses again, and again. The difference from your phone is scale: it has read a huge part of everything people have written — books, websites, and a lot of code. That one trick, done at that scale, writes essays, answers questions and writes software. Keep this picture in mind, because it explains both halves of today: why it's so good, and why it always sounds sure even when it's wrong. It picks the likely word, not the true one.

### 4. Code is just text — so coding is where AI shines.

Now, why coding in particular? An app is just thousands of lines of written instructions. Writing text is exactly what a language model is best at. And here's the part people miss: unlike an essay, code can be checked. You can run it and see whether it works. A guess you can check is a guess you can fix. That's why coding is where AI has moved fastest.

### 5. From chat window to colleague, in three years

Look how fast this went. In 2022 most of us met AI in a chat window: you ask, it answers, and you still do all the work. Then people started asking it for code: it writes it in the chat, you copy it somewhere and hope it works. Now we have agents. An agent is the same LLM, but given tools — it can open files, write them, run them, read the errors — and allowed to keep going until the job is done. It isn't a chat window any more; it's a colleague working in the same project. That's what we use today.

### 6. What AI is bad at: fluent is not the same as correct

Before we trust it with anything, know its weak spots — and notice they all come from that "guess the next word" picture. Hallucination: it can be confidently wrong — invent a setting that doesn't exist, or tell you "it's done" when it isn't. Drift: on a long task it slowly moves away from what you asked. Context rot: the longer the conversation, the less it remembers the rules you set at the start. And untested code: it writes something that never actually ran, or that ran on your laptop but not on the server. None of this shows up in a chat demo. All of it shows up in a real project.

### 7. Imagine ten expert colleagues who do exactly what you ask.

Here's how I think about working with it. Imagine ten expert colleagues. Brilliant, fast, never tired. But they do exactly what you ask — nothing more. If you say "make me a booking page", they'll each guess: which tools, which fields, who can see what. Ten experts, ten different apps, and probably none of them is the one you had in mind. If you say who books what, with which tools, what must never happen, and how to prove it works — you get the app you wanted. Whatever you leave out, they decide for you.

## Part 2 — The problem

### 8. Developers met these problems long ago — and built tools for them.

So: a fast, literal colleague who is sometimes confidently wrong. How do you work with that? Good news — these aren't new problems. Human developers hallucinate too; we call it "I was sure that function existed". We drift, we forget, and "it works on my machine" is a decades-old joke. So the software world built tools for exactly this. Against hallucination: checkers that verify every claim by running it. Against drift: a written plan and tests written first, a target that doesn't move. Against context rot: a rulebook in a file, and small steps. Against untested code: a standard box the app runs in, the same everywhere, plus tests that click through the real app. We don't trust the AI more. We check it more, automatically.

### 9. Developers set the stage. AI fills in the gaps.

And that changes what the job is. Less typing, more of this: set up the environment — the checks, the rules, the tools. Learn the building blocks well enough to plan. Write the plan in as much detail as you can. Then the AI fills in the implementation, checking as it goes, and you look, judge and decide. The environment and the plan are the job now. The typing isn't. Today I've done the first step for you — the environment is ready. You'll do the rest.

## Part 3 — What we build today

### 10. Let's build a real web app — together, with AI.

So instead of talking about AI, we build something with it. A real web app that runs in your browser, with a page, a server behind it and a database. You bring the idea; the AI does the typing; and together we check that it really works.

### 11. Today: from the big picture to your own app

Here's where we are. We've done the big picture and the problem. Now we zoom in: what a web app is, and how the AI builds one safely. Then you plan your app and send it to the AI. While it builds — and that takes a while — I'll show you the checkers at work. Then back to your screens to look and refine.

### 12. A website shows you something. A web app does something for you.

First, what are we building? A website is a poster on the internet: everyone sees the same thing, and it only changes when someone edits it. A web app is a program you use through your browser. Easy test: same address, different page. You and I both go to gmail.com, but your Gmail isn't my Gmail. That means there's a program behind the page that knows who you are, remembers what you did, and does work for you. That program is what we build today.

### 13. A web app is like a restaurant: three rooms

Every web app — Netflix, Instagram, Uber, Gmail — has the same three parts, and a restaurant is a good picture of them. Guests only see the dining room: that's the frontend, the page in your browser. The kitchen does the work and keeps the secret recipes: that's the backend, and the secrets are passwords and API keys, which must never be brought out to the dining room. The pantry is the database, where things are kept so they're still there tomorrow. The waiter between dining room and kitchen is the API: you can only order what's on the menu, in a fixed format, and you get a fixed answer back. Because the parts only talk through these agreed orders, the AI can change one without breaking the others. When our app uses AI or sends an email, the kitchen phones a supplier; the guest never does. *(Quick question to the room: in Netflix, what's the dining room? The kitchen? The pantry?)*

### 14. Don't start in an empty field.

A fair question: you could just ask an AI to "make me an app", and it would. It works — the first time. The hard part is the tenth change, when something you didn't touch quietly stops working. So we don't start in an empty field. The starter kit is a plot with the foundations poured: the app already runs, and one command starts all three rooms the same way on every laptop — that's a tool called Docker, a shipping container for software. The utilities are connected: database, AI and email, ready to use. And there's an inspector who checks every wall the moment it goes up, and points at the exact file and line when something's wrong.

### 15. The AI works inside the safety net

This is the heart of it. You describe what you want. The AI writes the code. Then the checkers run, in seconds: a linter, a type checker, and tests — I'll show you each one while your app builds. The AI reads what they found and fixes it. Without the starter kit, the loop stops after step 2: the AI writes something and you find out later whether it works. With it, steps 2 to 4 repeat on their own until everything is green. Then it opens the page to look at it, a second AI reviews the changes, and you decide.

## Part 4 — Plan and send

### 16. A good plan is half the app.

Now the most important skill of the day: the plan. Remember the ten colleagues. A good plan answers four things. What: who uses it, what they can do, what "done" looks like. With what: the tools — the database, email, AI, or anything you already use. How: the rules — who may see or change what, and what must never happen. And proof: which tests to write first, and how you'll check it works. Every detail you decide is one the AI doesn't have to guess.

### 17. Changing your mind later costs more — with AI too.

One more thing before you write. Changing something big later is much harder than deciding it at the start. Moving a wall on the drawing takes an eraser; moving it after the house is built means walls, wiring and plumbing. With AI it's the same: switching the login method of a finished app touches dozens of files, the database and every test. AI makes building fast. It doesn't make rebuilding free. So decide the big things now: who logs in, where the data lives, how it will run online.

### 18. Small changes in wording, big difference

Some concrete examples. Be concrete about what someone should be able to do, and ask for the tests first, so the AI knows what "done" means. Say where the data goes. When something breaks, don't describe the symptom — let the checker tell it. And ask it to look at the page itself. The crossed-out versions aren't wrong, they're just guesses waiting to happen.

### 19. Ideas to get you started

If you don't have an idea yet, pick one of these. Start with the warm-up if you're unsure — it already uses the page, the kitchen and the pantry. The quiz and the notes use the AI. The stretch one also sends email. The best projects, though, come from your own work: a small annoying task you'd like a tool for.

### 20. Your turn: plan it, send it

Here's what to do now. Get your own copy of the starter from GitHub. Write your plan — what, with what, how, and the proof — in plain words. Paste it into Claude Code and press enter. Then let it work: it will write, run the checks and fix things on its own for a while. Take five or ten minutes for the plan; I'll walk around and help.

### 21. Press enter. Let it work.

*(The cut point — wait here until most people have sent their plan.)* Sent? Good. The AI is now working on your app, and that takes a while. Don't sit and watch it type. We continue with the slides — and now and then, peek at your screen: the checkers I'm about to show you are doing their work right there.

## Part 5 — While it builds

### 22. Linter: it knows the classic mistakes

A linter is a grammar checker for code. Spell-check finds typos; grammar check finds sentences that are spelled right but still wrong. Here the AI wrote a perfectly working way to look up a user by name. But a visitor could type something sneaky as their name and change what the database is asked — a classic attack called SQL injection. The linter recognised the pattern instantly, named it, and the AI rewrote it the safe way.

### 23. Type checker: does every piece fit?

A type checker knows what kind of thing each piece expects: a number, a piece of text, a date. Here the counter expects a number, but the AI gave it the text "0" — one pair of quotes. Nothing crashes; the counter would just count wrongly: zero-one, zero-one-one. You might not notice for weeks. The type checker refuses it before the app even starts, like a plug that won't go into the wrong socket.

### 24. Tests: "done", written down

Tests are the most powerful of the checkers, because they check what you actually wanted. The trick: write the test first. Here we wrote down, in one line, that asking for a greeting for Ada should answer "Hello, Ada!". We ran it before anything was built, and it failed — exactly as it should. Then we told the AI: make this pass. It has a precise target and can check itself. And the test stays: if a later change breaks the greeting, it turns red again. If you asked for tests first in your plan, your AI is doing exactly this right now.

### 25. A real mistake, caught in a second

Here's a real example from this starter kit. The AI renamed a single word in the kitchen. Everything still looked fine. But the type checker immediately said: in this file, on line 9, the dining room still asks for the old name. The AI read that and fixed it. Without the checker, nothing would have crashed — the page would just have shown the wrong thing, forever, and someone would have had to discover why.

### 26. A rulebook, eyes, and a second opinion

Four more things in the kit make the AI better at its job — and they answer the weak spots from Part 1. A rulebook — a file called CLAUDE.md — is like the onboarding handbook you give a new colleague, and the AI rereads it every time: that's against context rot. Eyes: it can open the app in a browser and look. A second opinion: a separate reviewer that only sees the changes, so it isn't blinded by the first AI's reasoning. And a safe: the file with passwords and keys is off-limits to the AI.

### 27. Zoom back out: one person, a team of agents

Let's zoom back out to where we started. What you're doing today with one agent, I do with several. They keep working overnight on tasks I defined during the day. One builds, another tests, another reviews — at the same time. My part is deciding what's worth building, setting up the checks, and judging the result. That's how a year becomes a few days. The bottleneck has moved from typing to deciding, and to checking.

## Part 6 — Look and refine

### 28. Look, try, refine

Back to your screens. Open your app and try it like a user would: does it do what you planned? Ask for one change at a time, as concretely as you wrote your plan. Before you call it done, ask the reviewer for a second opinion. And at the end, we'll show each other what we made — and what surprised us.

### 29. The skill is no longer typing code.

If you remember one thing: the bottleneck has moved. Typing code is now the easy part. What matters is setting up the environment, describing exactly what you want, and having a way to check that you got it — that's what the starter kit gives you. The repository stays online, so you can keep building after today. Thank you!
