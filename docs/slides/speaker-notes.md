# AI Coding Workshop — speaker notes

What to say on each slide. The slides: [index.html](index.html) (open in a browser) or [the PDF](ai-coding-workshop.pdf).

The talk starts wide and zooms in: what AI is (Part 1), why it needs checking (Part 2), then the web app we
build today (Part 3). The slides carry only a few words; the explanation is here.

## Timing (2 hours)

| Block | Slides | Time |
|---|---|---|
| Talk: big picture, the problem, what we build | 1–18 | ~25 min |
| Plan, ideas, **live demo** | 19–22 | ~10 min |
| People write and send their plan | 23–24 | ~10 min |
| While it builds: one slide, then help people | 25 | ~3 min talk, then walk around (~40 min) |
| Look, refine, show & tell, going online | 26–30 | ~30 min |

**Cut point: slide 24.** After people press enter, the AI works for several minutes; slide 25 shows people
what is happening on their screen. Slide 26 sends everyone back to their screens.

Big one-sentence slides (5, 10, 22, 26) take about 20 seconds: say the line, pause, move on.

The small grey line at the top of each slide (“Part 2 of 6 · The problem”) only shows where we are in the
talk; the big line is the slide’s title.

## Part 1 — The big picture

### 1. Building a web app with AI

Welcome everyone. *(Show of hands: who has used ChatGPT or another AI chat? Who has asked it to write code?)* Today is hands-on: by the end, each of you will have built a small web app together with an AI. You don't need to know how to code. You need to know what you want, and I'll show you how to check that you got it.

### 2. What we'll do today

Here's the plan for our two hours, in six parts. The first three are me talking, about 25 minutes: what AI is and what it's bad at, how to work with something that is sometimes wrong, and what we're building today. Then it's your turn: you write a plan and hand it to the AI. While it builds, I'll show you what it's doing on your screen. And at the end you try your app, improve it, and show it to the rest of us.

### 3. What used to take me a year, I now do in 1–3 days.

Let me start with why I'm here. Projects that used to take me a year, I now finish in one to three days. I'm not exaggerating. And it doesn't stop when I stop: I give agents tasks during the day, and they keep working through the night — one builds, another tests, another reviews. But there's a catch, and it's the whole point of today: it only works if you know what to ask for, and how to check that you got it. So let's start with what this thing actually is.

### 4. An LLM is autocomplete that read almost everything.

*(Before you talk: ask the room to finish the sentence "The cat sat on the…" out loud. Most will say "mat".)* You just did what an LLM does. A large language model does one thing: given some text, it guesses the next word. Then it adds that word and guesses again, and again. You know this from your phone's keyboard. The difference is scale: it has read a huge part of everything people have written — books, websites, and a lot of code. That one trick, done at that scale, writes essays, answers questions and writes software.

### 5. It picks the likely word — not the true one.

*(Statement slide — say it and pause.)* This one sentence explains both halves of today: why it's so good, and why it always sounds sure even when it's wrong.

### 6. Coding is where AI shines.

Why coding in particular? An app is just thousands of lines of written instructions, and writing text is exactly what a language model is best at. And here's the part people miss: unlike an essay, code can be checked. You can run it and see whether it works. A guess you can check is a guess you can fix. That's why coding is where AI has moved fastest.

### 7. From chat window to colleague, in four years

Look how fast this went. A few years ago most of us met AI in a chat window: you ask, it answers, and you still do all the work. Then people started asking it for code: it writes it in the chat, you copy it somewhere and hope it works. Now we have agents. An agent is the same LLM, but given tools — it can open files, write them, run them, read the errors — and allowed to keep going until the job is done. It isn't a chat window any more; it's a colleague working in the same project. That's what we use today.

### 8. What AI is bad at

Before we trust it with anything, know its weak spots — and notice they all come from "it picks the likely word". Hallucination: it can be confidently wrong — invent a setting that doesn't exist, or say "it's done" when it isn't. Drift: on a long task it slowly moves away from what you asked. Context rot: the longer the conversation, the less weight it gives the rules you set at the start. And untested code: it writes something that never actually ran, or that only ran on your laptop. None of this shows up in a chat demo. All of it shows up in a real project.

### 9. Imagine ten expert colleagues who do exactly what you ask.

Here's how I think about working with it. Imagine ten expert colleagues. Brilliant, fast, never tired. But they do exactly what you ask — nothing more. If you say "make me a booking page", they'll each guess: which tools, which fields, who can see what. Ten experts, ten different apps, and probably none of them is the one you had in mind. If you say who books what, what must never happen, and how to prove it works — you get the app you wanted. Whatever you leave out, they decide for you.

## Part 2 — The problem

### 10. We don't trust the AI more. We check it more.

*(Statement slide.)* So: a fast, literal colleague who is sometimes confidently wrong. How do you work with that? Not by trusting it more. By checking it more — automatically.

### 11. Developers met these problems long ago, and built tools for them.

Good news — these aren't new problems. Human developers hallucinate too; we call it "I was sure that function existed". We drift, we forget, and "it works on my machine" is a decades-old joke. So the software world built tools for exactly this. Against hallucination: checkers and tests that verify every claim by running it. Against drift: a written plan and tests written first — a target that doesn't move. Against context rot: a rulebook in a file that it rereads. Against untested code: a standard box the app runs in, the same on every laptop.

### 12. Developers set the stage. AI fills in the gaps.

And that changes what the job is. Less typing, more of this: set up the environment — the checks, the rules, the tools. Write the plan in as much detail as you can. Then the AI writes the code, checking as it goes, and you look, judge and decide. The plan and the checks are the job now. The typing isn't. Today I've done the first step for you — the environment is ready. You'll do the rest.

## Part 3 — What we build today

### 13. Let's build a real web app. Together, with AI.

So instead of talking about AI, we build something with it. A real web app that runs in your browser, with a page, a server behind it and a database. You bring the idea; the AI does the typing; and together we check that it really works.

### 14. Today: from the big picture to your own app

Here's where we are. We've done the big picture and the problem. Now we zoom in: what a web app is, and how the AI builds one safely. Then you plan your app and send it. While it builds, I'll show you how the checks work. Then back to your screens.

### 15. A website shows you something. A web app does something for you.

First, what are we building? A website is a poster on the internet: everyone sees the same thing, and it only changes when someone edits it. A web app is a program you use through your browser. Easy test: same address, different page. You and I both go to gmail.com, but your Gmail isn't my Gmail. There's a program behind the page that knows who you are, remembers what you did, and does work for you. That program is what we build today.

### 16. A web app is like a restaurant with three rooms.

Every web app — Netflix, Instagram, Uber, Gmail — has the same three parts, and a restaurant is a good picture of them. Guests only see the dining room: that's the frontend, the page in your browser. The kitchen does the work and keeps the secret recipes: that's the backend, and the secrets are passwords and API keys, which must never be brought out to the dining room. The pantry is the database, where things are kept so they're still there tomorrow. The waiter between dining room and kitchen is the API: you can only order what's on the menu, and you get a fixed answer back. When our app uses AI or sends an email, the kitchen phones a supplier; the guest never does. *(Quick question to the room: in Netflix, what's the dining room? The kitchen? The pantry?)*

### 17. Don't start in an empty field.

You could just ask an AI to "make me an app", and it would. It works — the first time. The hard part is the tenth change, when something you didn't touch quietly stops working. So we don't start in an empty field. The starter kit is a plot with the foundations poured: the app already runs, and one command starts all three rooms the same way on every laptop — a tool called Docker, a shipping container for software. The utilities are connected: database, AI and email, ready to use. And there's an inspector who checks every wall the moment it goes up, and points at the exact file and line when something's wrong.

### 18. The AI works inside the safety net.

This is the heart of it. You describe what you want. The AI writes the code. Then the automatic checks run, in seconds — the main one is tests — you'll see them at work in the demo. The AI reads what they found and fixes it. Without the starter kit, the loop stops after step 2: the AI writes something and you find out later whether it works. With it, steps 2 to 4 repeat on their own until everything is green. Then it opens the page to look at it, a second AI reviews the changes, and you decide.

## Part 4 — Plan and send

### 19. A good plan is half the app.

Now the most important skill of the day: the plan. Remember the ten colleagues. A good plan answers four things. What: who uses it, what they can do, what "done" looks like. With what: the tools — the database, email, AI. How: the rules — who may see or change what, and what must never happen. And proof: which tests to write first. Every detail you decide is one the AI doesn't have to guess.

### 20. Changing your mind later costs more. With AI too.

One more thing before you write. Changing something big later is much harder than deciding it at the start. Moving a wall on the drawing takes an eraser; moving it after the house is built means walls, wiring and plumbing. With AI it's the same: switching the login method of a finished app touches dozens of files, the database and every test. AI makes building fast. It doesn't make rebuilding free. So decide the big things now: who logs in, and where the data lives.

### 21. Ideas to get you started

If you don't have an idea yet, pick one of these. Start with the guestbook if you're unsure — it's the simplest. The quiz and the notes use the AI. The stretch one also sends email. The best projects, though, come from your own work: a small annoying task you'd like a tool for.

### 22. Watch it build. — the live demo (~5 min)

*(Statement slide stays up while you switch to the terminal.)* Before you write yours, watch me do it once.

**Before the workshop:** have the starter running (`make up`), Claude Code open in the project, and http://localhost:5173 open in the browser. Make the terminal font large.

**The prompt to paste:**

> Add a greeting box to the page: I type a name, press the button, and the page shows "Hello, <name>!". The backend makes the greeting. Write the test first, run it and see it fail, then make it pass. Run make check and fix anything it reports.

**While it works, narrate:** "It's reading the rulebook… now it wrote the test… the test fails — good, that's what we want… now it writes the code… the checks run… one failed, it's reading the error, fixing it… green." Then switch to the browser, refresh, type a name from the room, and press the button.

**If it's slow or fails:** say so — "this is exactly why the checks exist" — and switch to a copy where you ran the same prompt before the workshop (have it ready in a second folder or branch). Don't debug on stage.

### 23. Your turn: plan it, send it.

Your turn. Get your own copy of the starter from GitHub. Write your plan — what, with what, how, and the proof — in plain words. Paste it into Claude Code and press enter. Then let it work: it will write, run the checks and fix things on its own for a while. Take five or ten minutes for the plan; I'll walk around and help.

### 24. Press enter. Let it work.

*(The cut point — wait here until most people have sent their plan.)* Sent? Good. The AI is now working on your app, and that takes a while. Don't sit and watch it type. One more slide, about what's happening on your screen right now.

## Part 5 — While it builds

### 25. What your AI is doing right now

This is what's happening on your screen while we talk. First it reads the house rules — a file in the project called CLAUDE.md, like the onboarding handbook you give a new colleague; it rereads it every time, so it doesn't forget the rules. Then it writes the tests — your proof, written down — and runs them before anything is built. They fail. That's good: red means the test works and the feature isn't there yet. Then it writes the code and runs the checks. When a check finds a mistake, it points at the exact file and line, and the AI reads that and fixes it — this loop can go round several times. When everything is green, it opens the page in a browser and looks at it. Finally a second AI, which only sees the changes, reviews them with fresh eyes. *(Ask: which step is yours on? Then stop talking and walk around to help.)*

## Part 6 — Look and refine

### 26. Your app is ready. Now look at it like a user.

*(Statement slide — puts everyone back on their screens.)*

### 27. Try it on your laptop.

Your AI has probably started the app already; if not, this is how. `make up` starts all three rooms in Docker — the dining room, the kitchen and the pantry. Open localhost:5173 in your browser: that's your app. Ask for a small change, like "make the button blue", and watch the page reload by itself. One thing to know: "localhost" means *this computer*. Nobody else can open that address — your neighbour can't, your phone can't. We'll fix that at the end.

### 28. Look, try, refine.

Open your app and try it like a user would: does it do what you planned? Ask for one change at a time, as concretely as you wrote your plan — "make it look good on a phone", not "make it nicer". If something breaks, don't describe the symptom: tell it "the check fails — fix the first error" and let the checker explain. Before you call it done, ask the reviewer for a second opinion. Then we'll show each other what we made — and what surprised us.

### 29. Put it online: same box, different computer.

*(After show & tell, before the closing slide.)* Last question: how do other people use your app? On your laptop it's three boxes in Docker, and only you can see it. To put it online, we pack it into one box — the page built once, served by the kitchen — and give it a real database in the cloud. I use Azure; any place that runs Docker works the same way. Then you get a real https address that anyone can open, on any phone. *(If you deployed a demo before the workshop: show its address — or a QR code — and let people open it on their phones.)* The steps are written down in the repo, in docs/deploy-azure.md, and you can ask the AI to follow them. Expect about an hour the first time. And it costs a little money while it runs, so delete it when you're done.

**Before the workshop, if you want to show a live one:** follow docs/deploy-azure.md for a small demo app (about $18/month while it exists: database ~$13, registry ~$5, the app itself almost free when idle). Run `az containerapp update … --min-replicas 1` before the session so the first visitor doesn't wait 10–20 seconds. Afterwards: `az group delete -n <resource group>`.

### 30. The skill is no longer typing code.

If you remember one thing: the bottleneck has moved. Typing code is now the easy part. What matters is setting up the environment, describing exactly what you want, and having a way to check that you got it — that's what the starter kit gives you. The repository stays online, so you can keep building after today. Thank you!
