import type { Question, EventDay } from "@/generated/prisma/client";
import type { SubmitFormInput } from "@/lib/validations";

type LogicRule = {
  id: string;
  action: "show" | "hide" | "skip_to";
  targetQuestionId: string;
  condition: { optionId?: string; value?: string | number; op: string };
};

type Option = { id: string; label: unknown; points: number };

type Answer = {
  value?: string | number | null;
  optionIds?: string[];
  points?: number;
};

/** Compute points for a single question given the answer. */
export function scoreQuestion(question: Question, answer: Answer | undefined): number {
  if (!answer) return 0;
  let pts = 0;
  // option-based points (CHOICE / MULTI)
  const options = (question.options as Option[]) ?? [];
  const selected = answer.optionIds ?? [];
  for (const opt of options) {
    if (selected.includes(opt.id)) pts += opt.points;
  }
  // scale points-per-unit
  if (question.type === "SCALE" && question.scaleConfig) {
    const cfg = question.scaleConfig as {
      min: number;
      max: number;
      pointsPerUnit: number;
    };
    const v = typeof answer.value === "number" ? answer.value : Number(answer.value ?? 0);
    pts += Math.max(0, v - cfg.min) * (cfg.pointsPerUnit ?? 0);
  }
  // fixed points awarded when answered
  if (answer.value !== null && answer.value !== undefined && answer.value !== "") {
    pts += question.points;
  }
  return pts;
}

/** Total points across all answers. */
export function scoreSubmission(questions: Question[], answers: Record<string, Answer>): number {
  return questions.reduce((sum, q) => sum + scoreQuestion(q, answers[q.id]), 0);
}

/** Evaluate a question's logic rules against current answers to decide visibility. */
export function evaluateLogic(
  question: Question,
  answers: Record<string, Answer>,
): { visible: boolean; skipTo?: string } {
  const rules = (question.logic as LogicRule[]) ?? [];
  if (rules.length === 0) return { visible: true };
  // Default visible; first matching rule wins
  for (const rule of rules) {
    const answer = answers[question.id];
    if (matchesCondition(rule.condition, answer)) {
      if (rule.action === "hide") return { visible: false };
      if (rule.action === "show") return { visible: true };
      if (rule.action === "skip_to") return { visible: true, skipTo: rule.targetQuestionId };
    }
  }
  return { visible: true };
}

function matchesCondition(
  condition: LogicRule["condition"],
  answer: Answer | undefined,
): boolean {
  if (!answer) return false;
  const op = condition.op ?? "eq";
  if (condition.optionId) {
    const selected = answer.optionIds ?? [];
    const hit = selected.includes(condition.optionId);
    return op === "ne" ? !hit : hit;
  }
  if (condition.value !== undefined) {
    const v = answer.value;
    if (v === undefined || v === null) return false;
    switch (op) {
      case "eq": return String(v) === String(condition.value);
      case "ne": return String(v) !== String(condition.value);
      case "gt": return Number(v) > Number(condition.value);
      case "lt": return Number(v) < Number(condition.value);
      case "gte": return Number(v) >= Number(condition.value);
      case "lte": return Number(v) <= Number(condition.value);
      case "contains": return String(v).includes(String(condition.value));
      default: return false;
    }
  }
  return false;
}

/** Resolve final tags for a submission: form tags + selected event-day autoTag. */
export function resolveTags(
  formTags: string[],
  eventDays: EventDay[],
  eventDayId: string | null | undefined,
): string[] {
  const tags = [...formTags];
  if (eventDayId) {
    const day = eventDays.find((d) => d.id === eventDayId);
    if (day && !tags.includes(day.autoTag)) tags.push(day.autoTag);
  }
  return tags;
}

/** Order answers into a presentable structure for webhook payload. */
export function buildAnswersPayload(
  questions: Question[],
  input: SubmitFormInput,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const q of questions) {
    const a = input.answers[q.id];
    if (!a) continue;
    out[q.id] = {
      type: q.type,
      value: a.value ?? null,
      optionIds: a.optionIds ?? [],
      points: a.points ?? 0,
    };
  }
  return out;
}
