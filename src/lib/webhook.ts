import { prisma } from "@/lib/prisma";
import type { Submission, WebhookDelivery } from "@/generated/prisma/client";
import { buildPayload, MAX_ATTEMPTS, nextBackoff } from "@/lib/webhook-payload";

export { buildPayload } from "@/lib/webhook-payload";
export type { WebhookPayload } from "@/lib/webhook-payload";

/**
 * Deliver the webhook for a submission. Records every attempt to WebhookDelivery.
 * First attempt runs synchronously so we can report success to the respondent;
 * retries are scheduled via setTimeout (ok for low-volume; swap for a queue later).
 */
export async function deliverWebhook(
  submission: Submission,
  formSlug: string,
  url: string,
): Promise<WebhookDelivery> {
  const payload = buildPayload(submission, formSlug);
  const body = JSON.stringify(payload);
  const attempt = 1;

  const result = await postOnce(url, body);

  const delivery = await prisma.webhookDelivery.create({
    data: {
      submissionId: submission.id,
      url,
      status: result.status,
      attempt,
      success: result.success,
      responseBody: result.body?.slice(0, 2000),
      error: result.error,
    },
  });

  if (!result.success && attempt < MAX_ATTEMPTS) {
    scheduleRetry(submission.id, formSlug, url, attempt + 1);
  }

  return delivery;
}

async function postOnce(
  url: string,
  body: string,
): Promise<{ status: number; success: boolean; body?: string; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "WebinarForm-Webhook/1.0",
      },
      body,
      signal: controller.signal,
    });
    const text = await res.text();
    clearTimeout(timeout);
    return { status: res.status, success: res.ok, body: text };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: 0, success: false, error: message };
  }
}

async function scheduleRetry(
  submissionId: string,
  formSlug: string,
  url: string,
  attempt: number,
): Promise<void> {
  if (attempt > MAX_ATTEMPTS) return;
  const delay = nextBackoff(attempt);
  setTimeout(async () => {
    const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission) return;
    const payload = buildPayload(submission, formSlug);
    const result = await postOnce(url, JSON.stringify(payload));
    await prisma.webhookDelivery.create({
      data: {
        submissionId,
        url,
        status: result.status,
        attempt,
        success: result.success,
        responseBody: result.body?.slice(0, 2000),
        error: result.error,
      },
    });
    if (!result.success && attempt < MAX_ATTEMPTS) {
      await scheduleRetry(submissionId, formSlug, url, attempt + 1);
    }
  }, delay);
}
