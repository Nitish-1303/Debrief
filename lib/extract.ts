import { trace } from "neatlogs";
import { getClient, MODEL } from "./llm";
import type { Task } from "./types";

const SYSTEM_PROMPT = `You extract action items from meeting transcripts. An action item is a concrete commitment someone makes to do something.

For each action item return:
- "task": a short imperative description (e.g. "Send the Q3 budget to Priya").
- "quote": the EXACT, VERBATIM sentence from the transcript this came from. Copy it character for character, including punctuation. It MUST appear verbatim in the transcript. Do not paraphrase, trim, translate, or merge sentences.
- "owner": the name of the person responsible, ONLY if explicitly stated in the transcript. If no owner is explicitly named, use null. Never guess or infer an owner.
- "deadline": the due date or time, ONLY if explicitly stated. If none is stated, use null. Never guess or infer a deadline.

Rules:
- Only include real commitments / action items. Ignore chit-chat, opinions, and questions that carry no commitment.
- Prefer fewer, accurate items over many speculative ones.
- Output STRICT JSON only, matching: {"tasks":[{"task":string,"quote":string,"owner":string|null,"deadline":string|null}]}
- If there are no action items, return {"tasks":[]}.`;

interface RawTask {
  task?: unknown;
  quote?: unknown;
  owner?: unknown;
  deadline?: unknown;
}

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Parse + shape the model's JSON into validated Task[]. Runs in its own span. */
function validateExtraction(rawContent: string): Task[] {
  // Tolerate accidental ```json fences.
  const stripped = rawContent
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();

  const parsed = JSON.parse(stripped) as { tasks?: RawTask[] };
  if (!parsed || !Array.isArray(parsed.tasks)) {
    throw new Error("Model output missing a `tasks` array.");
  }

  const tasks: Task[] = [];
  for (const raw of parsed.tasks) {
    const task = cleanString(raw.task);
    const quote = cleanString(raw.quote);
    // A task with no description or no source quote is unusable — drop it.
    if (!task || !quote) continue;

    const owner = cleanString(raw.owner);
    const deadline = cleanString(raw.deadline);

    tasks.push({
      task,
      quote,
      owner,
      ownerStatus: owner ? "stated" : "missing",
      deadline,
      deadlineStatus: deadline ? "stated" : "missing",
      // Verifier pass fills these in; defaults are overwritten there.
      verified: true,
      confidence: 0,
      verifyReason: "",
    });
  }
  return tasks;
}

/** Extraction pass: one traced LLM call, then a traced JSON-validation step. */
export async function extractTasks(transcript: string): Promise<Task[]> {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Transcript:\n<<<\n${transcript}\n>>>` },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "";

  return await trace(
    { name: "validate-extraction-json", kind: "GUARDRAIL" },
    async () => validateExtraction(content)
  );
}
