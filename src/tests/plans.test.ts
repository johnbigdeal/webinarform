import { describe, it, expect } from "vitest";
import { PLAN_LIMITS, limitsFor, can, remaining, isWithinLimit } from "@/lib/plans";

describe("plans", () => {
  it("free plan limits", () => {
    expect(PLAN_LIMITS.FREE.maxForms).toBe(1);
    expect(PLAN_LIMITS.FREE.customWebhook).toBe(false);
    expect(PLAN_LIMITS.FREE.eventDaySelector).toBe(false);
    expect(PLAN_LIMITS.FREE.questionsPerForm).toBe(5);
  });

  it("paid plan limits", () => {
    expect(PLAN_LIMITS.PAID.maxForms).toBe(Infinity);
    expect(PLAN_LIMITS.PAID.customWebhook).toBe(true);
    expect(PLAN_LIMITS.PAID.eventDaySelector).toBe(true);
  });

  it("limitsFor returns the right table", () => {
    expect(limitsFor("FREE").maxForms).toBe(1);
    expect(limitsFor("PAID").maxForms).toBe(Infinity);
  });

  it("can() checks boolean capabilities", () => {
    expect(can("FREE", "customWebhook")).toBe(false);
    expect(can("PAID", "customWebhook")).toBe(true);
    expect(can("FREE", "eventDaySelector")).toBe(false);
    expect(can("PAID", "eventDaySelector")).toBe(true);
  });

  it("remaining() computes numeric headroom", () => {
    expect(remaining("FREE", "maxForms", 0)).toBe(1);
    expect(remaining("FREE", "maxForms", 1)).toBe(0);
    expect(remaining("PAID", "maxForms", 99)).toBe(Infinity);
  });

  it("isWithinLimit enforces numeric limits", () => {
    expect(isWithinLimit("FREE", "maxForms", 0)).toBe(true);
    expect(isWithinLimit("FREE", "maxForms", 1)).toBe(false);
    expect(isWithinLimit("PAID", "maxForms", 1000)).toBe(true);
    expect(isWithinLimit("FREE", "questionsPerForm", 4)).toBe(true);
    expect(isWithinLimit("FREE", "questionsPerForm", 5)).toBe(false);
  });

  it("boolean capabilities via isWithinLimit are always allowed for paid, denied for free false", () => {
    expect(isWithinLimit("FREE", "customWebhook", 0)).toBe(false);
    expect(isWithinLimit("PAID", "customWebhook", 0)).toBe(true);
  });
});
