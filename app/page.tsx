"use client";

import { useState } from "react";
import type { Task } from "@/lib/types";

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExtract() {
    setLoading(true);
    setError(null);
    setTasks(null);
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

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-12">
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
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste your meeting transcript here…"
          rows={12}
          className="w-full resize-y border border-rule bg-paper p-4 text-base leading-relaxed text-ink outline-none focus:border-rule-strong"
        />
        <div className="mt-4 flex items-center gap-4">
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
        <p className="mt-6 border-l-2 border-accent pl-3 text-accent">
          {error}
        </p>
      )}

      {tasks && <ResultsTable tasks={tasks} />}
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

function ResultsTable({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <p className="mt-10 text-ink-soft italic">
        No commitments found in this transcript.
      </p>
    );
  }

  return (
    <section className="mt-12">
      <h2 className="mb-4 text-2xl">
        {tasks.length} {tasks.length === 1 ? "commitment" : "commitments"}
      </h2>
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-rule-strong text-xs uppercase tracking-wider text-ink-soft">
            <th className="py-2 pr-4 font-medium">Task</th>
            <th className="py-2 pr-4 font-medium">Owner</th>
            <th className="py-2 pr-4 font-medium">Deadline</th>
            <th className="py-2 font-medium">Quote</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t, i) => (
            <tr key={i} className="border-b border-rule align-top">
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
              </td>
              <td className="py-3 pr-4">
                <FieldCell value={t.owner} status={t.ownerStatus} />
              </td>
              <td className="py-3 pr-4">
                <FieldCell value={t.deadline} status={t.deadlineStatus} />
              </td>
              <td className="py-3 italic text-ink-soft">“{t.quote}”</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
