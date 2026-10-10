// Map raw provider/SDK errors to a safe, friendly HTTP status + message.
// Keeps provider internals and giant error blobs out of the UI.
export function toUserError(err: unknown): { status: number; message: string } {
  const e = err as { status?: number; message?: string };
  const status = typeof e?.status === "number" ? e.status : 0;
  const msg = e?.message ?? "";

  if (status === 429 || /quota|resource_exhausted|rate limit/i.test(msg)) {
    return {
      status: 429,
      message:
        "The Gemini free-tier quota is used up right now. Please try again later.",
    };
  }
  if (status === 404 || /no longer available|not found/i.test(msg)) {
    return {
      status: 502,
      message: "The model is temporarily unavailable. Please try again later.",
    };
  }
  return { status: 500, message: "Something went wrong. Please try again." };
}
