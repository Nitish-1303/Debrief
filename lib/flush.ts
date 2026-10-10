import { flush } from "neatlogs";

// On Vercel the function process can freeze right after the response is sent —
// before Neatlogs' background batch interval (5s) fires — which drops spans
// still buffered in memory, so the trace never reaches the dashboard. On
// serverless we therefore flush synchronously before returning. On a
// long-running server we skip this and let interval batching do the work
// (flushing per request there would just add overhead).
export async function flushIfServerless(): Promise<void> {
  if (!process.env.VERCEL) return;
  try {
    await flush();
  } catch {
    // Telemetry delivery must never break the request.
  }
}
