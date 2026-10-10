import { NextResponse } from "next/server";
import { span } from "neatlogs";
import { draftNudge } from "@/lib/nudge";
import { flushIfServerless } from "@/lib/flush";
import { toUserError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CHARS = 2000;

// Its own WORKFLOW root so each nudge is a self-contained trace.
const runNudge = span(
  { kind: "WORKFLOW", name: "debrief-nudge" },
  async (task: string, quote: string) => {
    return await draftNudge(task, quote);
  }
);

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { task, quote } = (body ?? {}) as { task?: unknown; quote?: unknown };
  if (typeof task !== "string" || task.trim().length === 0) {
    return NextResponse.json({ error: "`task` is required." }, { status: 400 });
  }
  if (typeof quote !== "string" || quote.trim().length === 0) {
    return NextResponse.json({ error: "`quote` is required." }, { status: 400 });
  }
  if (task.length > MAX_CHARS || quote.length > MAX_CHARS) {
    return NextResponse.json({ error: "Input too long." }, { status: 413 });
  }

  try {
    const message = await runNudge(task, quote);
    await flushIfServerless();
    return NextResponse.json({ message });
  } catch (err) {
    console.error("nudge failed:", err);
    await flushIfServerless();
    const { status, message } = toUserError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
