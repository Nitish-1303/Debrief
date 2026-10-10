# Debrief

**Meetings in. Tasks out.**

Paste a meeting transcript and get back every commitment — each with an owner, a
date, and the exact verbatim sentence it came from. Nothing is stored; your data
never leaves the paste.

## Why it's different

1. **Quote-first.** Every task shows the exact source sentence inline — no buried
   links, no "trust me."
2. **Verifier pass.** A second model call checks that each quote exists verbatim
   in the transcript and actually supports the task. Anything that fails is
   flagged **unverified** or dropped — so a hallucinated task gets caught.
3. **Honest extraction.** Owner and deadline are marked **stated** or **missing**.
   They are never guessed or inferred. A blank is a feature.
4. **Paste-only privacy.** No account, no recording, no database. Your data never
   leaves the paste.
5. **One-click export.** Copy the whole list as Markdown, quotes included.

## Stack

- Next.js (App Router, TypeScript) + Tailwind
- `POST /api/extract`: `{ transcript }` → extraction → verifier → `tasks[]`
- Gemini (`gemini-2.5-flash`) via its OpenAI-compatible endpoint
- Neatlogs tracing on every run (extract call, verifier call, JSON validation)

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

Open http://localhost:3000, paste a transcript, and extract.
