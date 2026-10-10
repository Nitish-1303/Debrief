// Neatlogs is initialized once here, at server startup — never per request.
// Next.js calls register() a single time when the server process boots.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { init } = await import("neatlogs");

  await init({
    apiKey: process.env.NEATLOGS_API_KEY,
    endpoint: "https://ingest.neatlogs.com",
    // One label all Debrief traces appear under; each request opens its own
    // WORKFLOW root (see app/api/extract/route.ts) so concurrent requests
    // never share a trace.
    workflowName: "debrief-extract",
  });
  // registerShutdownHandlers defaults to true when Neatlogs owns the provider,
  // so beforeExit/SIGTERM/SIGINT flush + shutdown are wired automatically for
  // this long-running server. We never flush per request.
}
