import { trace } from "neatlogs";
import { getClient, MODEL } from "./llm";
import type { Task } from "./types";

const SYSTEM_PROMPT = `You are a strict verifier. For each item you receive a "task" and a "quote" that was supposedly taken from a meeting transcript. Decide whether that quote genuinely SUPPORTS the task — i.e. someone reading only that quote would agree the task is a real commitment it describes.

Be strict. If the quote is unrelated to the task, contradicts it, or does not actually describe this commitment, it does NOT support the task.

Return STRICT JSON only: {"results":[{"index":number,"supportsTask":boolean,"reason":string}]}
- One entry per input item, in the same order, using the item's index.
- Keep "reason" under 12 words.`;

/** Normalize for a tolerant-but-honest verbatim check (smart quotes, whitespace). */
function normalize(s: string): string {
  return s
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

interface VerifierResult {
  index?: unknown;
  supportsTask?: unknown;
  reason?: unknown;
}

function parseVerifier(rawContent: string, count: number): Map<number, { supportsTask: boolean; reason: string }> {
  const stripped = rawContent
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();

  const parsed = JSON.parse(stripped) as { results?: VerifierResult[] };
  const map = new Map<number, { supportsTask: boolean; reason: string }>();
  if (!parsed || !Array.isArray(parsed.results)) return map;

  for (const r of parsed.results) {
    const index = typeof r.index === "number" ? r.index : NaN;
    if (!Number.isInteger(index) || index < 0 || index >= count) continue;
    map.set(index, {
      supportsTask: r.supportsTask === true,
      reason: typeof r.reason === "string" ? r.reason.trim() : "",
    });
  }
  return map;
}

/**
 * Verifier pass. Two independent checks per task:
 *  1. Deterministic: does the quote appear verbatim in the transcript?
 *     (catches a fabricated quote with certainty — the live demo moment)
 *  2. A second LLM call: does the quote actually support the task?
 * A task is verified only if BOTH pass; otherwise it is flagged "unverified".
 */
export async function verifyTasks(
  transcript: string,
  tasks: Task[]
): Promise<Task[]> {
  if (tasks.length === 0) return tasks;

  const haystack = normalize(transcript);

  // Second LLM call — one batched verifier request for all tasks.
  const completion = await getClient().chat.completions.create({
    model: MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content:
          `Transcript:\n<<<\n${transcript}\n>>>\n\nItems to verify:\n` +
          tasks
            .map((t, i) => `${i}. task: ${t.task}\n   quote: ${t.quote}`)
            .join("\n"),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "";

  return await trace(
    { name: "validate-verifier-json", kind: "GUARDRAIL" },
    async () => {
      const verdicts = parseVerifier(content, tasks.length);

      return tasks.map((t, i) => {
        const quoteFound = haystack.includes(normalize(t.quote));
        const verdict = verdicts.get(i);
        const supportsTask = verdict?.supportsTask ?? false;
        const verified = quoteFound && supportsTask;

        let verifyReason: string;
        if (!quoteFound) {
          verifyReason = "Quote not found verbatim in the transcript.";
        } else if (!supportsTask) {
          verifyReason = verdict?.reason || "Quote does not support this task.";
        } else {
          verifyReason = "Quote found verbatim and supports the task.";
        }

        return { ...t, verified, verifyReason };
      });
    }
  );
}
