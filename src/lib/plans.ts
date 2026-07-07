import type { Plan } from "@/generated/prisma/client";

export const PLAN_LIMITS = {
  FREE: {
    maxForms: 1,
    maxSubmissionsPerMonth: 50,
    customWebhook: false,
    logoUpload: false,
    customTags: false,
    eventDaySelector: false,
    customTheme: false,
    questionsPerForm: 5,
  },
  PAID: {
    maxForms: Infinity,
    maxSubmissionsPerMonth: Infinity,
    customWebhook: true,
    logoUpload: true,
    customTags: true,
    eventDaySelector: true,
    customTheme: true,
    questionsPerForm: Infinity,
  },
} as const;

export type PlanLimit = typeof PLAN_LIMITS.FREE;
export type Capability = keyof PlanLimit;

export function limitsFor(plan: Plan) {
  return PLAN_LIMITS[plan];
}

export function can(plan: Plan, capability: Capability): boolean {
  const limit = limitsFor(plan)[capability];
  if (typeof limit === "boolean") return limit;
  if (typeof limit === "number") return limit !== 0;
  return limit === Infinity;
}

export function remaining(plan: Plan, capability: Capability, used: number): number {
  const limit = limitsFor(plan)[capability];
  if (typeof limit === "number") return Math.max(0, limit - used);
  return Infinity;
}

export function isWithinLimit(plan: Plan, capability: Capability, used: number): boolean {
  const limit = limitsFor(plan)[capability];
  if (typeof limit === "boolean") return limit;
  if (typeof limit === "number") return used < limit;
  return true; // Infinity
}
