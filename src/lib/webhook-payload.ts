import type { Submission } from "@/generated/prisma/client";

export type WebhookPayload = {
  event: "form.submitted";
  formId: string;
  formSlug: string;
  submissionId: string;
  submittedAt: string;
  language: string;
  eventDayId: string | null;
  answers: Record<string, unknown>;
  tags: string[];
  totalPoints: number;
};

/** Pure payload builder — no DB, safe to unit test. */
export function buildPayload(submission: Submission, formSlug: string): WebhookPayload {
  return {
    event: "form.submitted",
    formId: submission.formId,
    formSlug,
    submissionId: submission.id,
    submittedAt: submission.createdAt.toISOString(),
    language: submission.language,
    eventDayId: submission.eventDayId,
    answers: submission.answers as Record<string, unknown>,
    tags: submission.tags,
    totalPoints: submission.totalPoints,
  };
}

export const MAX_ATTEMPTS = 5;
export const BACKOFF_MS = [1_000, 5_000, 30_000, 300_000, 1_800_000]; // 1s, 5s, 30s, 5m, 30m

export function nextBackoff(attempt: number): number {
  return BACKOFF_MS[attempt - 2] ?? 30 * 60_000;
}
