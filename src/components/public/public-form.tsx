"use client";

import { useMemo, useState } from "react";
import { Button, Input, Label, Textarea, Card } from "@/components/ui";
import { t, type Locale } from "@/lib/i18n";
import type { SubmitFormInput } from "@/lib/validations";

type Option = { id: string; label: Record<string, string>; points: number };
type Question = {
  id: string;
  type: "TEXT" | "TEXTAREA" | "CHOICE" | "MULTI" | "SCALE" | "RATING";
  label: Record<string, string>;
  helpText: Record<string, string> | null;
  required: boolean;
  options: Option[];
  scaleConfig: { min: number; max: number; step: number; minLabel: Record<string, string> | null; maxLabel: Record<string, string> | null; pointsPerUnit: number } | null;
  logic: { id: string; action: "show" | "hide" | "skip_to"; targetQuestionId: string; condition: { optionId?: string; value?: string | number; op: string } }[];
  points: number;
  order: number;
};
type EventDay = { id: string; date: string; label: Record<string, string>; autoTag: string; order: number };

type Form = {
  id: string;
  slug: string;
  title: Record<string, string>;
  description: Record<string, string> | null;
  submitLabel: Record<string, string>;
  thankYou: Record<string, string> | null;
  logoUrl: string | null;
  accentColor: string;
  questions: Question[];
  eventDays: EventDay[];
};

type AnswerMap = Record<string, { value?: string | number | null; optionIds: string[]; points: number }>;

export function PublicForm({ form, enabledLocales }: { form: Form; enabledLocales: Locale[] }) {
  const [locale, setLocale] = useState<Locale>(enabledLocales[0] ?? "en");
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [eventDayId, setEventDayId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const accent = form.accentColor || "#2563eb";

  // Evaluate logic to determine visible questions
  const visibleQuestions = useMemo(() => {
    const visible = new Set<string>();
    let skipTo: string | null = null;
    for (const q of form.questions) {
      if (skipTo && q.id !== skipTo) continue;
      if (skipTo && q.id === skipTo) skipTo = null;

      if (q.logic.length > 0) {
        let matched = false;
        for (const rule of q.logic) {
          const a = answers[q.id];
          if (matchesCondition(rule.condition, a)) {
            if (rule.action === "hide") { matched = true; break; }
            if (rule.action === "show") { matched = false; break; }
            if (rule.action === "skip_to") { skipTo = rule.targetQuestionId; matched = false; break; }
          }
        }
        if (matched) continue;
      }
      visible.add(q.id);
    }
    return form.questions.filter((q) => visible.has(q.id));
  }, [form.questions, answers]);

  function setAnswer(qid: string, value: string | number | null, optionIds: string[] = [], points = 0) {
    setAnswers((prev) => ({ ...prev, [qid]: { value, optionIds, points } }));
    setValidationErrors((prev) => { const n = { ...prev }; delete n[qid]; return n; });
  }

  function toggleOption(q: Question, optId: string) {
    const prev = answers[q.id]?.optionIds ?? [];
    if (q.type === "MULTI") {
      const next = prev.includes(optId) ? prev.filter((x) => x !== optId) : [...prev, optId];
      const pts = q.options.filter((o) => next.includes(o.id)).reduce((s, o) => s + o.points, 0);
      setAnswer(q.id, null, next, pts);
    } else {
      const opt = q.options.find((o) => o.id === optId);
      setAnswer(q.id, null, [optId], opt?.points ?? 0);
    }
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    for (const q of visibleQuestions) {
      if (!q.required) continue;
      const a = answers[q.id];
      const empty =
        !a ||
        (a.optionIds.length === 0 && (a.value === null || a.value === undefined || a.value === ""));
      if (empty) errs[q.id] = locale === "es" ? "Obligatorio" : "Required";
    }
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) {
      const first = document.querySelector("[data-error='true']");
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true);
    try {
      const payload: SubmitFormInput = {
        language: locale,
        eventDayId,
        answers: Object.fromEntries(
          Object.entries(answers).filter(([qid]) => visibleQuestions.some((q) => q.id === qid)),
        ),
      };
      const res = await fetch(`/api/submit/${form.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.error ?? "Submission failed");
        setSubmitting(false);
        return;
      }
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Network error");
    }
    setSubmitting(false);
  }

  if (done) {
    return (
      <Shell form={form} locale={locale} setLocale={setLocale} accent={accent} enabledLocales={enabledLocales}>
        <Card className="mx-auto max-w-xl p-8 text-center">
          <div className="mb-3 text-4xl">✅</div>
          <h2 className="text-xl font-bold text-gray-900">
            {t(form.thankYou, locale, locale === "es" ? "¡Gracias!" : "Thank you!")}
          </h2>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell form={form} locale={locale} setLocale={setLocale} accent={accent} enabledLocales={enabledLocales}>
      <form onSubmit={submit} className="mx-auto flex max-w-xl flex-col gap-6 pb-12">
        {/* Event day selector */}
        {form.eventDays.length > 0 && (
          <Card className="p-5">
            <Label className="mb-2 block">
              {locale === "es" ? "Selecciona el día del evento" : "Select event day"}
            </Label>
            <div className="grid gap-2">
              {form.eventDays.map((d) => (
                <button
                  type="button"
                  key={d.id}
                  onClick={() => setEventDayId(d.id)}
                  className={
                    "flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors " +
                    (eventDayId === d.id
                      ? "border-2 font-medium"
                      : "border-gray-200 hover:bg-gray-50")
                  }
                  style={eventDayId === d.id ? { borderColor: accent, color: accent } : undefined}
                >
                  <span>{t(d.label, locale, t(d.label, "en"))}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(d.date).toLocaleDateString(locale === "es" ? "es-ES" : "en-US", { month: "short", day: "numeric" })}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Questions */}
        {visibleQuestions.map((q) => (
          <Card key={q.id} className="p-5" data-error={validationErrors[q.id] ? "true" : undefined}>
            <Label className="mb-1 block">
              {t(q.label, locale, t(q.label, "en"))}
              {q.required && <span style={{ color: accent }}> *</span>}
            </Label>
            {q.helpText && (q.helpText.en || q.helpText.es) && (
              <p className="mb-3 text-sm text-gray-500">{t(q.helpText, locale)}</p>
            )}

            {renderQuestion(q, answers[q.id], (v, ids, pts) => setAnswer(q.id, v, ids, pts), (optId) => toggleOption(q, optId), accent, locale)}

            {validationErrors[q.id] && (
              <p className="mt-2 text-xs text-red-600">{validationErrors[q.id]}</p>
            )}
          </Card>
        ))}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" size="lg" disabled={submitting} style={{ backgroundColor: accent, borderColor: accent }}>
          {submitting
            ? locale === "es" ? "Enviando…" : "Submitting…"
            : t(form.submitLabel, locale, locale === "es" ? "Enviar" : "Submit")}
        </Button>
      </form>
    </Shell>
  );
}

function Shell({
  form,
  locale,
  setLocale,
  accent,
  enabledLocales,
  children,
}: {
  form: Form;
  locale: Locale;
  setLocale: (l: Locale) => void;
  accent: string;
  enabledLocales: Locale[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Locale switcher */}
      {enabledLocales.length > 1 && (
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/80 px-4 py-2 backdrop-blur">
          <span className="text-xs font-medium text-gray-400">WebinarForm</span>
          <div className="flex gap-1">
            {enabledLocales.map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={
                  "rounded px-2 py-0.5 text-xs font-medium uppercase " +
                  (locale === l ? "text-white" : "text-gray-500 hover:text-gray-900")
                }
                style={locale === l ? { backgroundColor: accent } : undefined}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      )}
      {enabledLocales.length <= 1 && (
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-xs font-medium text-gray-400">WebinarForm</span>
        </div>
      )}

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {/* Logo + title */}
        <div className="mb-6 text-center">
          {form.logoUrl && (
            <img src={form.logoUrl} alt="logo" className="mx-auto mb-4 max-h-16 w-auto" />
          )}
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{t(form.title, locale, t(form.title, "en"))}</h1>
          {form.description && (form.description.en || form.description.es) && (
            <p className="mt-2 text-sm text-gray-600">{t(form.description, locale)}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

function renderQuestion(
  q: Question,
  answer: AnswerMap[string] | undefined,
  setValue: (v: string | number | null, ids?: string[], pts?: number) => void,
  toggleOpt: (optId: string) => void,
  accent: string,
  locale: Locale,
) {
  switch (q.type) {
    case "TEXT":
      return <Input value={answer?.value ?? ""} onChange={(e) => setValue(e.target.value)} />;
    case "TEXTAREA":
      return <Textarea rows={4} value={answer?.value ?? ""} onChange={(e) => setValue(e.target.value)} />;
    case "CHOICE":
      return (
        <div className="flex flex-col gap-2">
          {q.options.map((o) => (
            <button
              type="button"
              key={o.id}
              onClick={() => toggleOpt(o.id)}
              className={
                "flex items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors " +
                (answer?.optionIds.includes(o.id) ? "border-2 font-medium" : "border-gray-200 hover:bg-gray-50")
              }
              style={answer?.optionIds.includes(o.id) ? { borderColor: accent, color: accent } : undefined}
            >
              <span className="h-4 w-4 rounded-full border-2" style={answer?.optionIds.includes(o.id) ? { borderColor: accent, backgroundColor: accent } : undefined} />
              {t(o.label, locale, t(o.label, "en"))}
            </button>
          ))}
        </div>
      );
    case "MULTI":
      return (
        <div className="flex flex-col gap-2">
          {q.options.map((o) => {
            const checked = answer?.optionIds.includes(o.id);
            return (
              <button
                type="button"
                key={o.id}
                onClick={() => toggleOpt(o.id)}
                className={
                  "flex items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors " +
                  (checked ? "border-2 font-medium" : "border-gray-200 hover:bg-gray-50")
                }
                style={checked ? { borderColor: accent, color: accent } : undefined}
              >
                <span className="h-4 w-4 rounded border-2" style={checked ? { borderColor: accent, backgroundColor: accent } : undefined} />
                {t(o.label, locale, t(o.label, "en"))}
              </button>
            );
          })}
        </div>
      );
    case "SCALE":
      if (!q.scaleConfig) return null;
      return (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {scaleValues(q.scaleConfig.min, q.scaleConfig.max, q.scaleConfig.step).map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setValue(n, [], 0)}
                className={
                  "h-10 w-10 rounded-lg border text-sm font-medium transition-colors " +
                  (answer?.value === n ? "text-white" : "border-gray-200 hover:bg-gray-50")
                }
                style={answer?.value === n ? { backgroundColor: accent, borderColor: accent } : undefined}
              >
                {n}
              </button>
            ))}
          </div>
          {(q.scaleConfig.minLabel || q.scaleConfig.maxLabel) && (
            <div className="flex justify-between text-xs text-gray-400">
              <span>{q.scaleConfig.minLabel ? t(q.scaleConfig.minLabel, locale) : q.scaleConfig.min}</span>
              <span>{q.scaleConfig.maxLabel ? t(q.scaleConfig.maxLabel, locale) : q.scaleConfig.max}</span>
            </div>
          )}
        </div>
      );
    case "RATING":
      return (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setValue(n, [], 0)}
              className="text-2xl transition-transform hover:scale-110"
              style={{ color: Number(answer?.value ?? 0) >= n ? accent : "#d1d5db" }}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
              ★
            </button>
          ))}
        </div>
      );
    default:
      return null;
  }
}

function scaleValues(min: number, max: number, step: number): number[] {
  const vals: number[] = [];
  for (let n = min; n <= max; n += step) vals.push(n);
  return vals;
}

function matchesCondition(
  condition: { optionId?: string; value?: string | number; op: string },
  answer: AnswerMap[string] | undefined,
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
