import { describe, it, expect } from "vitest";
import { signInSchema, signUpSchema, localizedTextSchema, formSchema, questionSchema, submitFormSchema } from "@/lib/validations";

describe("auth schemas", () => {
  it("validates a good signin", () => {
    const r = signInSchema.safeParse({ email: "a@b.co", password: "12345678" });
    expect(r.success).toBe(true);
  });
  it("rejects short password", () => {
    const r = signInSchema.safeParse({ email: "a@b.co", password: "short" });
    expect(r.success).toBe(false);
  });
  it("rejects bad email", () => {
    const r = signInSchema.safeParse({ email: "not-email", password: "12345678" });
    expect(r.success).toBe(false);
  });
  it("validates signup", () => {
    const r = signUpSchema.safeParse({ name: "A", email: "a@b.co", password: "12345678" });
    expect(r.success).toBe(true);
  });
});

describe("localizedTextSchema", () => {
  it("requires at least one language", () => {
    expect(localizedTextSchema.safeParse({ en: "Hi" }).success).toBe(true);
    expect(localizedTextSchema.safeParse({ es: "Hola" }).success).toBe(true);
    expect(localizedTextSchema.safeParse({}).success).toBe(false);
    expect(localizedTextSchema.safeParse({ en: "  " }).success).toBe(false);
  });
});

describe("formSchema", () => {
  it("validates a minimal form", () => {
    const r = formSchema.safeParse({
      slug: "my-form",
      title: { en: "My Form" },
    });
    expect(r.success).toBe(true);
  });
  it("rejects bad slug", () => {
    const r = formSchema.safeParse({ slug: "My Form!", title: { en: "T" } });
    expect(r.success).toBe(false);
  });
  it("rejects bad hex color", () => {
    const r = formSchema.safeParse({ slug: "x", title: { en: "T" }, accentColor: "red" });
    expect(r.success).toBe(false);
  });
});

describe("questionSchema", () => {
  it("validates a choice question with options", () => {
    const r = questionSchema.safeParse({
      type: "CHOICE",
      label: { en: "Pick one" },
      options: [{ id: "o1", label: { en: "One" }, points: 1 }],
    });
    expect(r.success).toBe(true);
  });
  it("validates a scale with scaleConfig", () => {
    const r = questionSchema.safeParse({
      type: "SCALE",
      label: { en: "Rate" },
      scaleConfig: { min: 1, max: 10, step: 1, pointsPerUnit: 1 },
    });
    expect(r.success).toBe(true);
  });
});

describe("submitFormSchema", () => {
  it("validates answers", () => {
    const r = submitFormSchema.safeParse({
      language: "es",
      eventDayId: "d1",
      answers: { q1: { value: "hi", optionIds: [], points: 0 } },
    });
    expect(r.success).toBe(true);
  });
  it("rejects unknown language", () => {
    const r = submitFormSchema.safeParse({ language: "fr", answers: {} });
    expect(r.success).toBe(false);
  });
});
