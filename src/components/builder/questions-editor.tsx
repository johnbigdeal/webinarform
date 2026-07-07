"use client";

import { Button, Input, Label, Card, Badge } from "@/components/ui";
import type { QuestionInput } from "@/lib/validations";
import type { Plan } from "@/generated/prisma/client";
import type { Locale } from "@/lib/i18n";

const LOCALE_LABELS: Record<Locale, string> = { en: "EN", es: "ES" };

const TYPES: { value: QuestionInput["type"]; label: string; hint: string }[] = [
  { value: "TEXT", label: "Short text", hint: "Single-line answer" },
  { value: "TEXTAREA", label: "Long text", hint: "Paragraph answer" },
  { value: "CHOICE", label: "Single choice", hint: "Radio / select — one option" },
  { value: "MULTI", label: "Multiple choice", hint: "Checkboxes — many options" },
  { value: "SCALE", label: "Scale", hint: "Numeric range (e.g. 1–5)" },
  { value: "RATING", label: "Rating", hint: "Stars 1–5" },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function QuestionsEditor({
  questions,
  setQuestions,
  userPlan,
  enabledLocales,
}: {
  questions: QuestionInput[];
  setQuestions: (q: QuestionInput[]) => void;
  userPlan: Plan;
  enabledLocales: Locale[];
}) {
  const limit = userPlan === "PAID" ? Infinity : 5;
  const canAdd = questions.length < limit;

  function add(type: QuestionInput["type"]) {
    if (!canAdd) return;
    const q: QuestionInput = {
      id: uid(),
      type,
      label: { en: "", es: "" },
      helpText: null,
      required: true,
      options: type === "CHOICE" || type === "MULTI" ? [{ id: uid(), label: { en: "", es: "" }, points: 0 }] : [],
      scaleConfig:
        type === "SCALE"
          ? { min: 1, max: 5, step: 1, minLabel: null, maxLabel: null, pointsPerUnit: 0 }
          : undefined,
      logic: [],
      points: 0,
      order: questions.length,
    };
    setQuestions([...questions, q]);
  }

  function update(id: string, patch: Partial<QuestionInput>) {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function remove(id: string) {
    setQuestions(questions.filter((q) => q.id !== id));
  }

  function move(id: string, dir: -1 | 1) {
    const i = questions.findIndex((q) => q.id === id);
    const j = i + dir;
    if (j < 0 || j >= questions.length) return;
    const copy = [...questions];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setQuestions(copy);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {TYPES.map((tp) => (
          <Button
            key={tp.value}
            variant="secondary"
            size="sm"
            disabled={!canAdd}
            onClick={() => add(tp.value)}
            title={tp.hint}
          >
            + {tp.label}
          </Button>
        ))}
      </div>
      {!canAdd && (
        <Badge className="w-fit bg-amber-100 text-amber-800">
          Free plan allows up to {limit} questions — upgrade for unlimited.
        </Badge>
      )}

      {questions.length === 0 && (
        <Card className="p-8 text-center text-sm text-gray-500">
          No questions yet. Add a field above to start building your form.
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            index={i}
            question={q}
            enabledLocales={enabledLocales}
            onChange={(patch) => update(q.id!, patch)}
            onRemove={() => remove(q.id!)}
            onMoveUp={() => move(q.id!, -1)}
            onMoveDown={() => move(q.id!, 1)}
            canMoveUp={i > 0}
            canMoveDown={i < questions.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function QuestionCard({
  index,
  question,
  enabledLocales,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  index: number;
  question: QuestionInput;
  enabledLocales: Locale[];
  onChange: (patch: Partial<QuestionInput>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const hasOptions = question.type === "CHOICE" || question.type === "MULTI";
  const isScale = question.type === "SCALE";

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
            {index + 1}
          </span>
          <Badge className="bg-gray-100 text-gray-700">{question.type}</Badge>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onMoveUp} disabled={!canMoveUp} className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-30" aria-label="Move up">▲</button>
          <button onClick={onMoveDown} disabled={!canMoveDown} className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-30" aria-label="Move down">▼</button>
          <button onClick={onRemove} className="ml-2 text-sm text-red-500 hover:text-red-700">Delete</button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {enabledLocales.map((locale) => (
          <LocalizedInput
            key={locale}
            label={`Label (${LOCALE_LABELS[locale]})`}
            value={question.label[locale] ?? ""}
            onChange={(v) => onChange({ label: { ...question.label, [locale]: v } })}
          />
        ))}
        {enabledLocales.map((locale) => (
          <LocalizedInput
            key={`help-${locale}`}
            label={`Help text (${LOCALE_LABELS[locale]})`}
            value={question.helpText?.[locale] ?? ""}
            onChange={(v) => onChange({ helpText: v ? { ...question.helpText, [locale]: v } : null })}
          />
        ))}
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={question.required} onChange={(e) => onChange({ required: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
        Required
      </label>

      {/* Points */}
      <div className="mt-4 flex items-center gap-3">
        <Label htmlFor={`pts-${question.id}`} className="whitespace-nowrap">Points awarded on answer</Label>
        <Input id={`pts-${question.id}`} type="number" min={0} value={question.points} onChange={(e) => onChange({ points: Number(e.target.value) })} className="w-24" />
      </div>

      {/* Options */}
      {hasOptions && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <Label>Options</Label>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onChange({ options: [...question.options, { id: uid(), label: { en: "", es: "" }, points: 0 }] })}
            >
              + Add option
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {question.options.map((opt, oi) => (
              <div key={opt.id} className="grid grid-cols-1 items-center gap-2 rounded-lg border border-gray-200 p-2 sm:grid-cols-2">
                {enabledLocales.map((locale) => (
                  <Input
                    key={locale}
                    placeholder={`Option (${LOCALE_LABELS[locale]})`}
                    value={opt.label[locale] ?? ""}
                    onChange={(e) => {
                      const options = [...question.options];
                      options[oi] = { ...opt, label: { ...opt.label, [locale]: e.target.value } };
                      onChange({ options });
                    }}
                  />
                ))}
                <Input type="number" placeholder="pts" value={opt.points} onChange={(e) => {
                  const options = [...question.options];
                  options[oi] = { ...opt, points: Number(e.target.value) };
                  onChange({ options });
                }} />
                <button onClick={() => onChange({ options: question.options.filter((o) => o.id !== opt.id) })} className="text-sm text-red-500 hover:text-red-700">Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scale config */}
      {isScale && question.scaleConfig && (
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-gray-200 p-3 sm:grid-cols-4">
          <div>
            <Label>Min</Label>
            <Input type="number" value={question.scaleConfig.min} onChange={(e) => onChange({ scaleConfig: { ...question.scaleConfig!, min: Number(e.target.value) } })} />
          </div>
          <div>
            <Label>Max</Label>
            <Input type="number" value={question.scaleConfig.max} onChange={(e) => onChange({ scaleConfig: { ...question.scaleConfig!, max: Number(e.target.value) } })} />
          </div>
          <div>
            <Label>Step</Label>
            <Input type="number" value={question.scaleConfig.step} onChange={(e) => onChange({ scaleConfig: { ...question.scaleConfig!, step: Number(e.target.value) } })} />
          </div>
          <div>
            <Label>Points/unit</Label>
            <Input type="number" value={question.scaleConfig.pointsPerUnit} onChange={(e) => onChange({ scaleConfig: { ...question.scaleConfig!, pointsPerUnit: Number(e.target.value) } })} />
          </div>
        </div>
      )}
    </Card>
  );
}

function LocalizedInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
