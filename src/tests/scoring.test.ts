import { describe, it, expect } from "vitest";
import { scoreQuestion, scoreSubmission, evaluateLogic, resolveTags, buildAnswersPayload } from "@/lib/scoring";
import type { Question, EventDay } from "@/generated/prisma/client";
import type { SubmitFormInput } from "@/lib/validations";

function q(partial: Partial<Question> & { id: string }): Question {
  return {
    formId: "f1",
    type: "TEXT",
    label: { en: "Q" },
    helpText: null,
    required: true,
    options: [],
    scaleConfig: null,
    logic: [],
    points: 0,
    order: 0,
    ...partial,
  } as Question;
}

describe("scoreQuestion", () => {
  it("awards option points for CHOICE", () => {
    const question = q({
      id: "q1",
      type: "CHOICE",
      options: [
        { id: "a", label: { en: "A" }, points: 5 },
        { id: "b", label: { en: "B" }, points: 10 },
      ] as never,
    });
    expect(scoreQuestion(question, { optionIds: ["a"], points: 0 })).toBe(5);
    expect(scoreQuestion(question, { optionIds: ["a", "b"], points: 0 })).toBe(15);
    expect(scoreQuestion(question, undefined)).toBe(0);
  });

  it("awards option points for MULTI and sums them", () => {
    const question = q({
      id: "q2",
      type: "MULTI",
      options: [
        { id: "x", label: { en: "X" }, points: 2 },
        { id: "y", label: { en: "Y" }, points: 3 },
      ] as never,
    });
    expect(scoreQuestion(question, { optionIds: ["x", "y"], points: 0 })).toBe(5);
  });

  it("awards scale points-per-unit above min", () => {
    const question = q({
      id: "q3",
      type: "SCALE",
      scaleConfig: { min: 1, max: 5, step: 1, pointsPerUnit: 2 } as never,
    });
    expect(scoreQuestion(question, { value: 5, points: 0 })).toBe(8); // (5-1)*2
    expect(scoreQuestion(question, { value: 1, points: 0 })).toBe(0);
    expect(scoreQuestion(question, { value: 0, points: 0 })).toBe(0); // clamped
  });

  it("awards fixed points when answered", () => {
    const question = q({ id: "q4", type: "TEXT", points: 3 });
    expect(scoreQuestion(question, { value: "hello", points: 0 })).toBe(3);
    expect(scoreQuestion(question, { value: "", points: 0 })).toBe(0);
  });
});

describe("scoreSubmission", () => {
  it("sums across questions", () => {
    const questions = [
      q({ id: "a", type: "TEXT", points: 2 }),
      q({
        id: "b",
        type: "CHOICE",
        options: [{ id: "o", label: { en: "O" }, points: 5 }] as never,
      }),
    ];
    const answers = {
      a: { value: "hi", points: 0 },
      b: { optionIds: ["o"], points: 0 },
    };
    expect(scoreSubmission(questions, answers)).toBe(7);
  });
});

describe("evaluateLogic", () => {
  it("hides a question when condition matches an option", () => {
    const question = q({
      id: "q",
      type: "CHOICE",
      logic: [
        {
          id: "r1",
          action: "hide",
          targetQuestionId: "next",
          condition: { optionId: "skip", op: "eq" },
        },
      ] as never,
    });
    expect(evaluateLogic(question, { q: { optionIds: ["skip"], points: 0 } })).toEqual({ visible: false });
    expect(evaluateLogic(question, { q: { optionIds: ["other"], points: 0 } })).toEqual({ visible: true });
  });

  it("skip_to returns skipTo id", () => {
    const question = q({
      id: "q",
      type: "CHOICE",
      logic: [
        {
          id: "r1",
          action: "skip_to",
          targetQuestionId: "q5",
          condition: { optionId: "fast", op: "eq" },
        },
      ] as never,
    });
    expect(evaluateLogic(question, { q: { optionIds: ["fast"], points: 0 } })).toEqual({ visible: true, skipTo: "q5" });
  });

  it("no rules = always visible", () => {
    const question = q({ id: "q", type: "TEXT" });
    expect(evaluateLogic(question, {})).toEqual({ visible: true });
  });

  it("value comparisons work", () => {
    const question = q({
      id: "q",
      type: "SCALE",
      logic: [
        {
          id: "r1",
          action: "hide",
          targetQuestionId: "next",
          condition: { value: 3, op: "lt" },
        },
      ] as never,
    });
    expect(evaluateLogic(question, { q: { value: 2, points: 0 } })).toEqual({ visible: false });
    expect(evaluateLogic(question, { q: { value: 5, points: 0 } })).toEqual({ visible: true });
  });
});

describe("resolveTags", () => {
  const eventDays: EventDay[] = [
    {
      id: "d1",
      formId: "f1",
      date: new Date("2026-07-10"),
      label: { en: "Day 1" },
      autoTag: "day-1",
      order: 0,
    } as EventDay,
    {
      id: "d2",
      formId: "f1",
      date: new Date("2026-07-11"),
      label: { en: "Day 2" },
      autoTag: "day-2",
      order: 1,
    } as EventDay,
  ];

  it("appends autoTag when event day selected", () => {
    expect(resolveTags(["webinar"], eventDays, "d1")).toEqual(["webinar", "day-1"]);
  });

  it("leaves tags unchanged when no event day", () => {
    expect(resolveTags(["webinar"], eventDays, null)).toEqual(["webinar"]);
  });

  it("does not duplicate existing autoTag", () => {
    expect(resolveTags(["webinar", "day-1"], eventDays, "d1")).toEqual(["webinar", "day-1"]);
  });
});

describe("buildAnswersPayload", () => {
  it("produces keyed answer objects", () => {
    const questions = [q({ id: "q1", type: "TEXT" }), q({ id: "q2", type: "CHOICE" })];
    const input: SubmitFormInput = {
      language: "en",
      eventDayId: null,
      answers: {
        q1: { value: "Alice", optionIds: [], points: 0 },
        q2: { value: null, optionIds: ["o1"], points: 0 },
      },
    };
    const out = buildAnswersPayload(questions, input);
    expect(out.q1).toEqual({ type: "TEXT", value: "Alice", optionIds: [], points: 0 });
    expect(out.q2).toEqual({ type: "CHOICE", value: null, optionIds: ["o1"], points: 0 });
  });
});
