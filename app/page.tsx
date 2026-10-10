"use client";

import { useEffect, useRef, useState } from "react";
import type { Task } from "@/lib/types";
import { SAMPLES } from "@/lib/samples";

function buildMarkdown(tasks: Task[]): string {
  const lines = ["## Debrief — tasks", ""];
  for (const t of tasks) {
    const owner = t.ownerStatus === "stated" ? t.owner : "_missing_";
    const due = t.deadlineStatus === "stated" ? t.deadline : "_missing_";
    const flag = t.verified ? "" : " _(unverified)_";
    lines.push(`- **${t.task}**${flag}`);
    lines.push(`  - Owner: ${owner} · Due: ${due}`);
    lines.push(`  - > "${t.quote}"`);
    lines.push("");
  }
  return lines.join("\n").trim() + "\n";
}

// Locate a quote inside the transcript, tolerating whitespace and smart-quote
// differences, so clicking a quote can highlight the real sentence.
function findMatch(
  transcript: string,
  quote: string
): { start: number; end: number } | null {
  const exact = transcript.indexOf(quote);
  if (exact >= 0) return { start: exact, end: exact + quote.length };

  let pattern = "";
  for (const ch of quote) {
    if (/\s/.test(ch)) pattern += "\\s+";
    else if (/['’‘ʼ]/.test(ch)) pattern += "['’‘ʼ]";
    else if (/["”“]/.test(ch)) pattern += "[\"”“]";
    else pattern += ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  pattern = pattern.replace(/(?:\\s\+)+/g, "\\s+");
  try {
    const m = new RegExp(pattern).exec(transcript);
    if (m) return { start: m.index, end: m.index + m[0].length };
  } catch {
    /* bad pattern — fall through */
  }
  return null;
}

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeQuote, setActiveQuote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const markRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (activeQuote && markRef.current) {
      markRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeQuote]);

  async function handleExtract() {
    setLoading(true);
    setError(null);
    setTasks(null);
    setActiveQuote(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Extraction failed.");
      setTasks(data.tasks as Task[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!tasks) return;
    await navigator.clipboard.writeText(buildMarkdown(tasks));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function renderTranscript() {
    if (!activeQuote) return transcript;
    const m = findMatch(transcript, activeQuote);
    if (!m) return transcript;
    return (
      <>
        {transcript.slice(0, m.start)}
        <mark ref={markRef as React.RefObject<HTMLElement>} className="quote-hit">
          {transcript.slice(m.start, m.end)}
        </mark>
        {transcript.slice(m.end)}
      </>
    );
  }
  // PLACEHOLDER_RETURN
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-10">
        <span className="inline-block border border-rule-strong px-2.5 py-1 text-xs uppercase tracking-[0.18em] text-ink-soft">
          Traced with Neatlogs
        </span>
        <h1 className="mt-6 text-5xl leading-[1.05] sm:text-6xl">
          Meetings in. Tasks out.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-ink-soft">
          Paste a transcript. Get every commitment, with an owner, a date, and
          the exact words behind it.
        </p>
      </header>

      <section>
        <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-ink-soft">Try a sample:</span>
          {SAMPLES.map((s) => (
            <button
              key={s.label}
              onClick={() => {
                setTranscript(s.text);
                setTasks(null);
                setActiveQuote(null);
              }}
              className="border border-rule-strong px-3 py-1 text-ink-soft hover:text-ink"
            >
              {s.label}
            </button>
          ))}
        </div>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste your meeting transcript here…"
          rows={12}
          className="w-full resize-y border border-rule bg-paper p-4 text-base leading-relaxed text-ink outline-none focus:border-rule-strong"
        />
        <div className="mt-4">
          <button
            onClick={handleExtract}
            disabled={loading || transcript.trim().length === 0}
            className="border border-ink bg-ink px-5 py-2.5 text-sm uppercase tracking-wider text-cream transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Extracting…" : "Extract tasks"}
          </button>
        </div>
      </section>

      {error && (
        <p className="mt-6 border-l-2 border-accent pl-3 text-accent">{error}</p>
      )}

      {tasks && (
        <Results
          tasks={tasks}
          activeQuote={activeQuote}
          onQuote={setActiveQuote}
          onCopy={handleCopy}
          copied={copied}
          transcriptNode={renderTranscript()}
        />
      )}
    </main>
  );
}

function FieldCell({
  value,
  status,
}: {
  value: string | null;
  status: "stated" | "missing";
}) {
  if (status === "missing") {
    return <span className="text-missing italic">missing</span>;
  }
  return <span className="text-ink">{value}</span>;
}

function TaskRow({
  task: t,
  active,
  onQuote,
}: {
  task: Task;
  active: boolean;
  onQuote: (q: string) => void;
}) {
  const [nudge, setNudge] = useState<string | null>(null);
  const [nudging, setNudging] = useState(false);
  const [nudgeCopied, setNudgeCopied] = useState(false);
  const [nudgeErr, setNudgeErr] = useState<string | null>(null);

  async function draft() {
    setNudging(true);
    setNudgeErr(null);
    try {
      const res = await fetch("/api/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: t.task, quote: t.quote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Nudge failed.");
      setNudge(data.message as string);
    } catch (e) {
      setNudgeErr(e instanceof Error ? e.message : "Nudge failed.");
    } finally {
      setNudging(false);
    }
  }

  async function copyNudge() {
    if (!nudge) return;
    await navigator.clipboard.writeText(nudge);
    setNudgeCopied(true);
    setTimeout(() => setNudgeCopied(false), 1800);
  }

  return (
    <tr className="border-b border-rule align-top">
      <td className="py-3 pr-4">
        <div className="flex flex-wrap items-center gap-2">
          <span>{t.task}</span>
          {!t.verified && (
            <span
              title={t.verifyReason}
              className="border border-accent px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-accent"
            >
              Unverified
            </span>
          )}
        </div>
        {!t.verified && t.verifyReason && (
          <p className="mt-1 text-xs text-accent/80">{t.verifyReason}</p>
        )}
        {/* PLACEHOLDER_NUDGE */}
        {t.ownerStatus === "missing" && (
          <div className="mt-2">
            {!nudge && (
              <button
                onClick={draft}
                disabled={nudging}
                className="border border-rule-strong px-2.5 py-1 text-xs text-ink-soft hover:text-ink disabled:opacity-50"
              >
                {nudging ? "Drafting…" : "Draft the nudge"}
              </button>
            )}
            {nudgeErr && <p className="mt-1 text-xs text-accent">{nudgeErr}</p>}
            {nudge && (
              <div className="mt-2 border-l-2 border-rule-strong bg-paper p-3">
                <p className="whitespace-pre-wrap text-sm text-ink">{nudge}</p>
                <button
                  onClick={copyNudge}
                  className="mt-2 border border-rule-strong px-2 py-0.5 text-[11px] uppercase tracking-wider text-ink-soft hover:text-ink"
                >
                  {nudgeCopied ? "Copied" : "Copy"}
                </button>
              </div>
            )}
          </div>
        )}
      </td>
      {/* PLACEHOLDER_CELLS */}
      <td className="py-3 pr-4">
        <FieldCell value={t.owner} status={t.ownerStatus} />
      </td>
      <td className="py-3 pr-4">
        <FieldCell value={t.deadline} status={t.deadlineStatus} />
      </td>
      <td className="py-3 pr-4">
        <button
          onClick={() => onQuote(t.quote)}
          className={`text-left italic underline decoration-rule-strong underline-offset-2 hover:decoration-ink ${
            active ? "text-ink" : "text-ink-soft"
          }`}
        >
          “{t.quote}”
        </button>
      </td>
      <td className="py-3">
        <span
          title={t.verifyReason}
          className={`tabular-nums ${t.verified ? "text-verified" : "text-accent"}`}
        >
          {t.confidence}
          <span className="text-ink-soft">/100</span>
        </span>
      </td>
    </tr>
  );
}

function Results({
  tasks,
  activeQuote,
  onQuote,
  onCopy,
  copied,
  transcriptNode,
}: {
  tasks: Task[];
  activeQuote: string | null;
  onQuote: (q: string) => void;
  onCopy: () => void;
  copied: boolean;
  transcriptNode: React.ReactNode;
}) {
  if (tasks.length === 0) {
    return (
      <p className="mt-10 text-ink-soft italic">
        No commitments found in this transcript.
      </p>
    );
  }
  const verifiedCount = tasks.filter((t) => t.verified).length;
  return (
    <section className="mt-12">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-2xl">
          {tasks.length} {tasks.length === 1 ? "commitment" : "commitments"}
          <span className="ml-2 text-sm text-ink-soft">
            {verifiedCount}/{tasks.length} verified
          </span>
        </h2>
        <button
          onClick={onCopy}
          className="border border-ink px-3 py-1.5 text-xs uppercase tracking-wider text-ink hover:bg-ink hover:text-cream"
        >
          {copied ? "Copied" : "Copy as Markdown"}
        </button>
      </div>

      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-rule-strong text-xs uppercase tracking-wider text-ink-soft">
            <th className="py-2 pr-4 font-medium">Task</th>
            <th className="py-2 pr-4 font-medium">Owner</th>
            <th className="py-2 pr-4 font-medium">Deadline</th>
            <th className="py-2 pr-4 font-medium">Quote</th>
            <th className="py-2 font-medium">Verifier</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t, i) => (
            <TaskRow
              key={i}
              task={t}
              active={activeQuote === t.quote}
              onQuote={onQuote}
            />
          ))}
        </tbody>
      </table>

      <div className="mt-10">
        <h3 className="mb-2 text-sm uppercase tracking-wider text-ink-soft">
          Transcript{" "}
          <span className="normal-case tracking-normal">
            — click a quote above to find it here
          </span>
        </h3>
        <div className="whitespace-pre-wrap border border-rule bg-paper p-4 text-sm leading-relaxed text-ink">
          {transcriptNode}
        </div>
      </div>
    </section>
  );
}
