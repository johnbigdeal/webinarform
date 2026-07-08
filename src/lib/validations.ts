import { z } from "zod";

// ─────────────── Auth ───────────────

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signUpSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

// ─────────────── Localized text ───────────────

export const localizedTextSchema = z
  .object({
    en: z.string().optional(),
    es: z.string().optional(),
  })
  .refine(
    (v) => Object.values(v).some((s) => s && s.trim().length > 0),
    { message: "At least one language is required" },
  );

export type LocalizedTextInput = z.infer<typeof localizedTextSchema>;

// ─────────────── Form builder ───────────────

export const questionTypeSchema = z.enum([
  "TEXT",
  "TEXTAREA",
  "CHOICE",
  "MULTI",
  "SCALE",
  "RATING",
  "EMAIL",
  "PHONE",
  "DATE",
  "FILE",
]);

const questionOptionSchema = z.object({
  id: z.string(),
  label: localizedTextSchema,
  points: z.number().default(0),
});

const logicConditionSchema = z.object({
  optionId: z.string().optional(),
  value: z.union([z.string(), z.number()]).optional(),
  op: z.enum(["eq", "ne", "gt", "lt", "gte", "lte", "contains"]).default("eq"),
});

const logicRuleSchema = z.object({
  id: z.string(),
  action: z.enum(["show", "hide", "skip_to"]),
  targetQuestionId: z.string(),
  condition: logicConditionSchema,
});

export const questionSchema = z.object({
  id: z.string().optional(),
  type: questionTypeSchema,
  label: localizedTextSchema,
  helpText: localizedTextSchema.nullish(),
  required: z.boolean().default(true),
  options: z.array(questionOptionSchema).default([]),
  scaleConfig: z
    .object({
      min: z.number().default(1),
      max: z.number().default(5),
      step: z.number().default(1),
      minLabel: localizedTextSchema.nullish(),
      maxLabel: localizedTextSchema.nullish(),
      pointsPerUnit: z.number().default(0),
    })
    .nullish(),
  logic: z.array(logicRuleSchema).default([]),
  points: z.number().default(0),
  order: z.number().default(0),
});

export type QuestionInput = z.infer<typeof questionSchema>;

export const eventDaySchema = z.object({
  id: z.string().optional(),
  date: z.string(), // ISO date
  label: localizedTextSchema,
  autoTag: z.string().min(1),
  order: z.number().default(0),
});

export type EventDayInput = z.infer<typeof eventDaySchema>;

export const formSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  title: localizedTextSchema,
  description: localizedTextSchema.nullish(),
  submitLabel: localizedTextSchema.default({ en: "Submit", es: "Enviar" }),
  thankYou: localizedTextSchema.nullish(),
  logoUrl: z.string().url().nullish(),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color")
    .default("#2563eb"),
  webhookUrl: z.string().url().nullish(),
  webhookEnabled: z.boolean().default(true),
  questions: z.array(questionSchema).default([]),
  eventDays: z.array(eventDaySchema).default([]),
  tags: z.array(z.string()).default([]),
});

export type FormInput = z.infer<typeof formSchema>;

// ─────────────── Public form submission ───────────────

export const submissionAnswerSchema = z.object({
  value: z.union([z.string(), z.number()]).nullish(),
  optionIds: z.array(z.string()).default([]),
  points: z.number().default(0),
});

export const submitFormSchema = z.object({
  language: z.enum(["en", "es"]).default("en"),
  eventDayId: z.string().nullish(),
  answers: z.record(z.string(), submissionAnswerSchema),
});

export type SubmitFormInput = z.infer<typeof submitFormSchema>;
