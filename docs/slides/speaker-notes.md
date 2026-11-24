# AI Coding Workshop — speaker notes

What to say on each slide. The slides: [index.html](index.html) (open in a browser) or [the PDF](ai-coding-workshop.pdf).

The deck has a **cut point at slide 21**: everything before it prepares people to write and send their
first prompt; after they press enter, the AI works for several minutes, and slides 22–29 fill that
time. Slide 30 sends everyone back to their screens.

## Part 1 — What's possible

### 1. Building a web app with AI

Welcome everyone. Today is hands-on: by the end, each of you will have built a small web app together with an AI. You don't need to know how to code. You need to know what you want, and I'll show you how to check that you got it.

### 2. A website shows you something. A web app does something for you.

Let's start with what we're building. A website is a poster on the internet: everyone sees the same thing, and it only changes when someone edits it. A web app is a program you use through your browser. Here's an easy test: same address, different page. You and I both go to gmail.com, but your Gmail isn't my Gmail. That means there's a program behind the page that knows who you are, remembers what you did, and does work for you. That program is what we build today.

### 3. Like a restaurant: three rooms

Every web app has the same three parts, and a restaurant is a good picture of them. Guests only see the dining room — that's the frontend, the page in your browser. The kitchen does the work and keeps the secret recipes; in software those are passwords and API keys, and they must never be brought out to the dining room. The pantry is the database. When our app uses AI or sends an email, the kitchen phones a supplier; the guest never does.

### 4. AI can do far more than the chat window shows.

This is what made me want to run this workshop. Most people meet AI in a chat window, and they think that's what it is. But think about it: code is just text. An app is thousands of lines of written instructions. And writing text is exactly what a language model is best at. So why copy code out of a chat window and hope it works? The better way is to let an AI agent work inside your project: it writes the code, runs it, and uses tools to check that it's right — the same tools a software developer would use.

### 5. From asking questions to building together

Three ways to use AI. Most people stop at the first or second. The third is different in kind: the AI isn't a chat window any more, it's a colleague working in the same project. It can run what it wrote, see that something failed, and fix it. That's what we'll do today.

### 6. Imagine ten expert colleagues who do exactly what you ask.

Here's how I think about AI. Imagine you have ten expert colleagues. They're brilliant, fast, and they never get tired. But they do exactly what you ask — nothing more. If you say "make me a booking page", they'll each guess: which tools, which fields, who can see what. Ten experts, ten different apps, and probably none of them is the one you had in mind. If you say who books what, with which tools, what must never happen, and how to prove it works — you get the app you wanted. Whatever you leave out, they decide for you.

### 7. Let's build a real web app — together, with AI.

So the idea is simple: instead of talking about AI, we build something with it. A real web app that runs in your browser, with a page, a server behind it and a database. You bring the idea; the AI does the typing; and together we learn how to check that it really works.

### 8. The plan

Five parts. We just did the first: what's possible. Next: where AI goes wrong, and the safety net. Then you plan your app and send it to the AI. While it builds — and it takes a while — I'll show you how the checks work and where I think all this is heading. Then back to your screens.

## Part 2 — Where AI goes wrong

### 9. What AI is bad at

Before we trust it with anything, know its weak spots. Hallucination: it can be confidently wrong — invent a setting that doesn't exist, or tell you "it's done" when it isn't. Drift: on a long task it slowly moves away from what you asked. Context rot: the longer the conversation, the less it remembers the rules you set at the start. And untested code: it writes something that never actually ran, or that ran on your laptop but not on the server. None of this shows up in a chat demo. All of it shows up in a real project.

### 10. Developers met these problems long ago — and built tools for them.

Here's the good news. These aren't new problems. Human developers hallucinate too — we call it "I was sure that function existed". We drift, we forget, and "it works on my machine" is a decades-old joke. So the software world built tools for exactly this: checkers that verify every claim by running it, plans and tests written first, a rulebook, and containers that run the same everywhere. We don't trust the AI more. We check it more, automatically.

### 11. You could just ask Claude to "make me an app". So why a starter kit?

A fair question: Claude can build an app from one sentence, so why did I prepare anything? Because the first version is the easy part. The hard part is the tenth change, when something you didn't touch quietly stops working. The starter kit makes every mistake visible within seconds, with its exact place, so the AI can fix it before you ever see it.

### 12. Don't start in an empty field.

Think of building a house. Asking the AI with nothing prepared is like starting in an empty field: it will build you something, but nobody checks the walls. The starter kit is a plot with the foundations poured, the utilities connected, and an inspector who checks every wall the moment it goes up. The AI is still the builder; the inspector is what makes it trustworthy.

### 13. A shipping container for software

Installing software is where workshops usually lose the first hour. Docker solves that. Like a shipping container, it packs the app with everything it needs, so it runs the same on any machine. Next to it is Make: a menu of short commands, so instead of remembering long instructions you type 'make up' to start everything and 'make check' to run all the checks.

### 14. Four checkers that never get tired

These four are the building inspector. You don't need to know how they work, only what each one catches. The formatter keeps everything tidy. The linter is a grammar checker for code: it knows mistakes people have made a million times, including security holes. The type checker is like plugs and sockets. And tests are a checklist that actually clicks through the app. All four run with one command, in seconds, every time. You'll see each one in action in a few minutes — on your own screen.

### 15. The AI works inside the safety net

This is the heart of it. Without the starter kit, the loop stops after step 2: the AI writes something and you find out later whether it works. With it, steps 2 to 4 repeat on their own — write, check, fix — until everything is green. You only step in at the beginning, to say what you want, and at the end, to look and decide.

## Part 3 — Plan and send

### 16. A good plan is half the app.

Now the most important skill of the day: the plan. Remember the ten colleagues. A good plan answers four things. What: who uses it, what they can do, what "done" looks like. With what: the tools — the database, email, AI, or anything you already use. How: the rules — who may see or change what, and what must never happen. And proof: which tests to write first, and how you'll check it works. Every detail you decide is one the AI doesn't have to guess.

### 17. Changing your mind later costs more — with AI too.

One more thing before you write. Just like with any project, changing something big later is much harder than deciding it at the start. Moving a wall on the drawing takes an eraser; moving it after the house is built means walls, wiring and plumbing. With AI it's the same: switching the login method of a finished app touches dozens of files, the database and every test. AI makes building fast. It doesn't make rebuilding free. So decide the big things now: who logs in, where the data lives, how it will run online.

### 18. Small changes in wording, big difference

Some concrete examples of the difference. Be concrete about what someone should be able to do. Say where the data goes. Ask for the tests first, so the AI knows what "done" means. When something breaks, don't describe the symptom — let the checker tell it. Ask it to look at the page. And before you call it done, ask for a second opinion.

### 19. Ideas to get you started

If you don't have an idea yet, pick one of these. Start with the warm-up if you're unsure — it already uses the page, the kitchen and the pantry. The quiz and the notes use the AI. The stretch one also sends email. The best projects, though, come from your own work: a small annoying task you'd like a tool for.

### 20. Your turn: plan it, send it

Here's what to do now. Get your own copy of the starter from GitHub. Write your plan — what, with what, how, and the proof — in plain words. Paste it into Claude Code and press enter. Then let it work: it will write, run the checks and fix things on its own for a while. Take five or ten minutes for the plan; I'll walk around and help.

### 21. Press enter. Let it work.

*(The cut point — wait here until most people have sent their plan.)* Sent? Good. The AI is now working on your app, and that takes a while. Don't sit and watch it type. We continue with the slides — and now and then, peek at your screen: the checkers I'm about to show you are doing their work right there.

## Part 4 — While it builds

### 22. The tidy-up: same layout, every time

The simplest of the four. A formatter is like auto-format in Word: it puts every space and line break in the same place. Nobody has to think about it — in our setup it runs automatically every time the AI saves a file. The benefit: when you compare two versions, the only differences you see are real changes, not someone's spacing habits.

### 23. The grammar checker: knows the classic mistakes

A linter is a grammar checker for code. Spell-check finds typos; grammar check finds sentences that are spelled right but still wrong. Here the AI wrote a perfectly working way to look up a user by name. But a visitor could type something sneaky as their name and change what the database is asked — a classic attack called SQL injection. The linter recognised the pattern instantly, named it, and the AI rewrote it the safe way.

### 24. The plug and socket: does every piece fit?

A type checker knows what kind of thing each piece expects: a number, a piece of text, a date. Here the counter expects a number, but the AI gave it the text "0" — one pair of quotes. Nothing crashes; the counter would just count wrongly: zero-one, zero-one-one. You might not notice for weeks. The type checker refuses it before the app even starts, like a plug that won't go into the wrong socket.

### 25. The checklist: "done" written down

Tests are the most powerful of the four, because they check what you actually wanted. The trick: write the test first. Here we wrote down, in one line, that asking for a greeting for Ada should answer "Hello, Ada!". We ran it before anything was built, and it failed — exactly as it should. Then we told the AI: make this pass. It has a precise target and can check itself. And the test stays: if a later change breaks the greeting, it turns red again. If you asked for tests first in your plan, your AI is doing exactly this right now.

### 26. A mistake, caught in a second

Here's a real example from this starter kit. The AI renamed a single word in the kitchen. Everything still looked fine. But the type checker immediately said: in this file, on line 9, the dining room still asks for the old name. The AI read that and fixed it. Without the checker, nothing would have crashed — the page would just have shown the wrong thing, forever, and someone would have had to discover why.

### 27. A rulebook, eyes, and a second opinion

Four more things in the kit make the AI better at its job — and they're the answers to the weak spots from earlier. A rulebook — a file called CLAUDE.md — is like the onboarding handbook you give a new colleague, and the AI rereads it every time: that's against context rot. Eyes: it can open the app in a browser and look. A second opinion: a separate reviewer that only sees the changes, so it isn't blinded by the first AI's reasoning. And a safe: the file with passwords and keys is off-limits to the AI.

### 28. What used to take me a year, I now do in 1–3 days.

I want to be honest about what this means, because I'm not exaggerating. Projects that used to take me a year, I now finish in one to three days. And it doesn't stop when I stop: an agent can keep working around the clock on tasks I define for it. But there's a condition. It works because I know the building blocks, I have the checks in place, and I write a proper plan. In the right hands, this is a different world. Without those, it's a fast way to make a mess.

### 29. Developers set the stage. AI fills in the gaps.

So where is this heading? I think the developer's job is moving. Less typing, more of this: set up the environment — the checks, the rules, the tools — like the starter kit you're using today. Learn the building blocks well enough to plan. Write the plan in as much detail as you can: what we're building, with which tools, how. Then the AI fills in the implementation, checking as it goes, and you look, judge and decide. The environment and the plan are the job now. The typing isn't.

## Part 5 — Look and refine

### 30. Look, try, refine

Back to your screens. Open your app and try it like a user would: does it do what you planned? Ask for one change at a time, as concretely as you wrote your plan. Before you call it done, ask the reviewer for a second opinion. And at the end, we'll show each other what we made — and what surprised us.

### 31. The skill is no longer typing code.

If you remember one thing: the bottleneck has moved. Typing code is now the easy part. What matters is setting up the environment, describing exactly what you want, and having a way to check that you got it — that's what the starter kit gives you. The repository stays online, so you can keep building after today. Thank you!
