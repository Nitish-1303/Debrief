# Debrief

**Meetings in. Tasks out.**

Paste a meeting transcript and get back every commitment — each with an owner, a
date, and the exact verbatim sentence it came from. Nothing is stored; your data
never leaves the paste.

**Live:** https://debrief-bay.vercel.app

## What it does

Debrief turns a raw transcript into a checkable task list. It extracts the
commitments, then runs a second pass that verifies each one against the source
text before you ever see it — so what you get is auditable, not just plausible.

## Why it's different

1. **Quote-first.** Every task shows the exact source sentence inline — no buried
   links, no "trust me."
2. **Verifier pass with proof.** A second model call checks that each quote exists
   verbatim in the transcript and actually supports the task, and attaches a
   confidence score (0–100). Anything that fails is flagged **unverified** — so a
   hallucinated task gets caught on screen.
3. **Acts on results.** Any task missing an owner gets a one-click **Draft the
   nudge** — a short follow-up message asking who owns it and by when, ready to
   copy.
4. **Honest extraction.** Owner and deadline are marked **stated** or **missing**,
   never guessed or inferred. A blank is a feature.
5. **Paste-only privacy.** No account, no recording, no database.
6. **One-click export.** Copy the whole list as Markdown, quotes included.

## How it works

`POST /api/extract` takes `{ transcript }`, runs an extraction call, then a
verifier call, and returns `tasks[]`. `POST /api/nudge` drafts a single follow-up
message for an unowned task.

Every run is **Traced with Neatlogs**: one trace per request, with separate spans
for the extraction call, the verifier call, and JSON validation.

## Stack

- Next.js (App Router, TypeScript) + Tailwind, deployed on Vercel
- Gemini (`gemini-3.8-flash`) via its OpenAI-compatible endpoint
- Neatlogs tracing (`wrapOpenAI`, initialized once at server startup)

## Local setup

```bash
npm install
cp .env.example .env   # then fill in the two keys
npm run dev
```

`.env` (gitignored — never commit it):

```
GEMINI_API_KEY=your_gemini_key
NEATLOGS_API_KEY=your_neatlogs_project_key
```

Open http://localhost:3000, paste a transcript (or use a built-in sample), and
extract.

> Note: Gemini's free tier is capped at 20 requests/day per model, and each
> extraction uses two calls. If you hit the cap the app shows a friendly
> rate-limit message; the quota resets daily.
