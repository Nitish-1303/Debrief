import { NextResponse } from "next/server";
import { span } from "neatlogs";
import { extractTasks } from "@/lib/extract";
import { verifyTasks } from "@/lib/verify";

// Node runtime: the OpenAI + Neatlogs SDKs need Node APIs (not Edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TRANSCRIPT_CHARS = 20000;

// One WORKFLOW root per request. span() returns an instrumented function;
// calling it with no surrounding trace opens a fresh root, so concurrent
// requests each get their own isolated trace.
const runWorkflow = span(
  { kind: "WORKFLOW", name: "debrief-extract" },
  async (transcript: string) => {
    const extracted = await extractTasks(transcript);
    // Second pass: verify each quote verbatim + supports its task.
    return await verifyTasks(transcript, extracted);
  }
);

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const transcript = (body as { transcript?: unknown })?.transcript;
  if (typeof transcript !== "string" || transcript.trim().length === 0) {
    return NextResponse.json(
      { error: "`transcript` is required." },
      { status: 400 }
    );
  }
  if (transcript.length > MAX_TRANSCRIPT_CHARS) {
    return NextResponse.json(
      { error: `Transcript too long (max ${MAX_TRANSCRIPT_CHARS} chars).` },
      { status: 413 }
    );
  }

  try {
    const tasks = await runWorkflow(transcript);
    return NextResponse.json({ tasks });
  } catch (err) {
    console.error("extract failed:", err);
    const message = err instanceof Error ? err.message : "Extraction failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
