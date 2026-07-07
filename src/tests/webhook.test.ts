import { describe, it, expect } from "vitest";
import { buildPayload } from "@/lib/webhook-payload";
import type { Submission } from "@/generated/prisma/client";

function makeSubmission(over: Partial<Submission> = {}): Submission {
  return {
    id: "sub1",
    formId: "form1",
    answers: { name: { value: "Alice" } },
    tags: ["webinar", "day-1"],
    totalPoints: 42,
    eventDayId: "ed1",
    language: "es",
    createdAt: new Date("2026-07-07T12:00:00Z"),
    ...over,
  } as Submission;
}

describe("buildPayload", () => {
  it("builds a complete webhook payload", () => {
    const sub = makeSubmission();
    const payload = buildPayload(sub, "demo-webinar");
    expect(payload.event).toBe("form.submitted");
    expect(payload.formId).toBe("form1");
    expect(payload.formSlug).toBe("demo-webinar");
    expect(payload.submissionId).toBe("sub1");
    expect(payload.submittedAt).toBe("2026-07-07T12:00:00.000Z");
    expect(payload.language).toBe("es");
    expect(payload.eventDayId).toBe("ed1");
    expect(payload.answers).toEqual({ name: { value: "Alice" } });
    expect(payload.tags).toEqual(["webinar", "day-1"]);
    expect(payload.totalPoints).toBe(42);
  });

  it("handles null event day", () => {
    const sub = makeSubmission({ eventDayId: null, tags: [] });
    const payload = buildPayload(sub, "slug");
    expect(payload.eventDayId).toBeNull();
    expect(payload.tags).toEqual([]);
  });
});
