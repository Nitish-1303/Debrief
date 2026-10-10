import { getClient, MODEL } from "./llm";

const SYSTEM_PROMPT = `You write a short, friendly follow-up message for a team chat. You are given a task from a meeting that has no clear owner. Write a brief message (2-3 sentences, under 60 words) that asks who will own this task and by when.

Rules:
- Reference the specific commitment naturally.
- Be polite and direct.
- Do NOT invent an owner or a deadline.
- Output only the message text — no preamble, no quotes around it.`;

/** Draft a nudge asking who owns a task and by when. One traced LLM call. */
export async function draftNudge(task: string, quote: string): Promise<string> {
  const completion = await getClient().chat.completions.create({
    model: MODEL,
    temperature: 0.4,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Task: ${task}\nSource quote: "${quote}"\n\nWrite the follow-up message.`,
      },
    ],
  });

  return (completion.choices[0]?.message?.content ?? "").trim();
}
