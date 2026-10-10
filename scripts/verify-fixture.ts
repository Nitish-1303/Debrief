// Fixture: proves the verifier flags a quote that is NOT in the transcript.
// Run:  (load .env first)  npx tsx scripts/verify-fixture.ts
import { init, flush, shutdown } from "neatlogs";
import { verifyTasks } from "../lib/verify";
import type { Task } from "../lib/types";

async function main() {
  await init({
    apiKey: process.env.NEATLOGS_API_KEY,
    endpoint: "https://ingest.neatlogs.com",
    workflowName: "debrief-verify-fixture",
  });

  const transcript = "Alice: I'll email the Q4 report to the board tomorrow.";

  const tasks: Task[] = [
    {
      task: "Email the Q4 report to the board",
      quote: "I'll email the Q4 report to the board tomorrow.",
      owner: "Alice",
      ownerStatus: "stated",
      deadline: "tomorrow",
      deadlineStatus: "stated",
      verified: true,
      confidence: 0,
      verifyReason: "",
    },
    {
      // FABRICATED: this sentence never appears in the transcript.
      task: "Book the conference venue",
      quote: "I'll book the conference venue by Monday.",
      owner: null,
      ownerStatus: "missing",
      deadline: "Monday",
      deadlineStatus: "stated",
      verified: true,
      confidence: 0,
      verifyReason: "",
    },
  ];

  const out = await verifyTasks(transcript, tasks);
  for (const t of out) {
    console.log(
      JSON.stringify({ task: t.task, verified: t.verified, reason: t.verifyReason })
    );
  }

  await flush();
  await shutdown();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
