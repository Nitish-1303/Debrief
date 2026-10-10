// Shared task shape across the extraction and verifier passes.

export type FieldStatus = "stated" | "missing";

export interface Task {
  /** Short imperative description of the commitment. */
  task: string;
  /** Exact verbatim sentence from the transcript that this task came from. */
  quote: string;
  /** Owner's name if explicitly stated in the transcript, else null. */
  owner: string | null;
  /** "stated" when owner is explicit, "missing" when absent — never guessed. */
  ownerStatus: FieldStatus;
  /** Deadline if explicitly stated, else null. */
  deadline: string | null;
  /** "stated" when deadline is explicit, "missing" when absent. */
  deadlineStatus: FieldStatus;
  /**
   * Verifier verdict (set by the verifier pass):
   * - true  : quote found verbatim in transcript AND supports the task
   * - false : failed verification ("unverified")
   */
  verified: boolean;
  /** Short human-readable reason from the verifier. */
  verifyReason: string;
}

export interface ExtractResponse {
  tasks: Task[];
}
