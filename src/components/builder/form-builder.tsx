"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button, Input, Label, Card, Badge } from "@/components/ui";
import { QuestionsEditor } from "@/components/builder/questions-editor";
import { EventDaysEditor } from "@/components/builder/event-days-editor";
import { FormSettingsEditor } from "@/components/builder/form-settings-editor";
import { SubmissionsView } from "@/components/builder/submissions-view";
import { updateFormAction, deleteFormAction } from "@/server/actions";
import type { FormInput, QuestionInput, EventDayInput } from "@/lib/validations";
import type { Plan } from "@/generated/prisma/client";
import type { Locale } from "@/lib/i18n";

type Form = {
  id: string;
  slug: string;
  title: unknown;
  description: unknown;
  submitLabel: unknown;
  thankYou: unknown;
  logoUrl: string | null;
  accentColor: string;
  webhookUrl: string | null;
  webhookEnabled: boolean;
  questions: QuestionInput[];
  eventDays: EventDayInput[];
  tags: { id: string; tag: string }[];
};

type Tab = "questions" | "events" | "design" | "webhook" | "submissions";

const tabs: { id: Tab; label: string }[] = [
  { id: "questions", label: "Questions" },
  { id: "events", label: "Event days" },
  { id: "design", label: "Design & text" },
  { id: "webhook", label: "Webhook" },
  { id: "submissions", label: "Submissions" },
];

export function FormBuilder({ form, userPlan, enabledLocales }: { form: Form; userPlan: Plan; enabledLocales: Locale[] }) {
  const [tab, setTab] = useState<Tab>("questions");
  const [saving, startSave] = useTransition();
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // form-level editable state
  const [slug, setSlug] = useState(form.slug);
  const [title, setTitle] = useState<Record<string, string>>(form.title as Record<string, string>);
  const [description, setDescription] = useState<Record<string, string>>(
    (form.description as Record<string, string>) ?? { en: "", es: "" },
  );
  const [submitLabel, setSubmitLabel] = useState<Record<string, string>>(
    (form.submitLabel as Record<string, string>) ?? { en: "Submit", es: "Enviar" },
  );
  const [thankYou, setThankYou] = useState<Record<string, string>>(
    (form.thankYou as Record<string, string>) ?? { en: "", es: "" },
  );
  const [logoUrl, setLogoUrl] = useState(form.logoUrl ?? "");
  const [accentColor, setAccentColor] = useState(form.accentColor);
  const [webhookUrl, setWebhookUrl] = useState(form.webhookUrl ?? "");
  const [webhookEnabled, setWebhookEnabled] = useState(form.webhookEnabled);
  const [tags, setTags] = useState<string[]>(form.tags.map((t) => t.tag));
  const [questions, setQuestions] = useState<QuestionInput[]>(form.questions);
  const [eventDays, setEventDays] = useState<EventDayInput[]>(form.eventDays);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function buildInput(): FormInput {
    const clean = (v: Record<string, string>) =>
      Object.fromEntries(Object.entries(v).filter(([, s]) => s && s.trim())) as Record<string, string>;
    return {
      slug,
      title: clean(title) as never,
      description: clean(description) || undefined,
      submitLabel: clean(submitLabel) as never,
      thankYou: clean(thankYou) || undefined,
      logoUrl: logoUrl || undefined,
      accentColor,
      webhookUrl: webhookUrl || undefined,
      webhookEnabled,
      questions: questions.map((q, i) => ({ ...q, order: i })),
      eventDays: eventDays.map((d, i) => ({ ...d, order: i })),
      tags,
    };
  }

  function save() {
    setSavedMsg(null);
    setError(null);
    startSave(async () => {
      const res = await updateFormAction(form.id, buildInput());
      if ("error" in res && res.error) {
        setError(res.error);
      } else {
        setSavedMsg("Saved");
        setTimeout(() => setSavedMsg(null), 2500);
      }
    });
  }

  function del() {
    startSave(async () => {
      await deleteFormAction(form.id);
      window.location.href = "/dashboard";
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/dashboard" className="hover:text-gray-900">Forms</Link>
            <span>/</span>
            <span className="truncate">{title.en || "Untitled"}</span>
          </div>
          <h1 className="mt-1 truncate text-2xl font-bold text-gray-900">Form builder</h1>
          <a
            href={`/f/${slug}`}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            Open public form →
          </a>
        </div>
        <div className="flex items-center gap-2">
          {savedMsg && <span className="text-sm text-green-600">{savedMsg}</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors " +
              (tab === tb.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-900")
            }
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "questions" && (
        <QuestionsEditor questions={questions} setQuestions={setQuestions} userPlan={userPlan} enabledLocales={enabledLocales} />
      )}
      {tab === "events" && (
        <EventDaysEditor eventDays={eventDays} setEventDays={setEventDays} userPlan={userPlan} enabledLocales={enabledLocales} />
      )}
      {tab === "design" && (
        <FormSettingsEditor
          slug={slug} setSlug={setSlug}
          title={title} setTitle={setTitle}
          description={description} setDescription={setDescription}
          submitLabel={submitLabel} setSubmitLabel={setSubmitLabel}
          thankYou={thankYou} setThankYou={setThankYou}
          logoUrl={logoUrl} setLogoUrl={setLogoUrl}
          accentColor={accentColor} setAccentColor={setAccentColor}
          tags={tags} setTags={setTags}
          userPlan={userPlan}
          enabledLocales={enabledLocales}
        />
      )}
      {tab === "webhook" && (
        <Card className="max-w-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900">Webhook delivery</h2>
          <p className="mt-1 text-sm text-gray-600">
            Every submission is POSTed to this URL as JSON. Retries use exponential backoff
            (1s, 5s, 30s, 5m, 30m), up to 5 attempts.
          </p>
          {userPlan !== "PAID" && (
            <Badge className="mt-3 bg-amber-100 text-amber-800">
              Custom webhook requires a paid plan — ask an admin to upgrade.
            </Badge>
          )}
          <div className="mt-4 flex flex-col gap-1.5">
            <Label htmlFor="webhookUrl">Webhook URL</Label>
            <Input
              id="webhookUrl"
              type="url"
              placeholder="https://your-app.com/hooks/webinarform"
              value={webhookUrl}
              disabled={userPlan !== "PAID"}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={webhookEnabled}
              onChange={(e) => setWebhookEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Enable webhook delivery
          </label>

          <div className="mt-6 rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500">Example payload</p>
            <pre className="mt-2 overflow-x-auto text-xs text-gray-700">{`{
  "event": "form.submitted",
  "formId": "${form.id}",
  "formSlug": "${slug}",
  "submissionId": "sub_...",
  "submittedAt": "2026-07-07T12:00:00.000Z",
  "language": "es",
  "eventDayId": "ed_...",
  "answers": { "q_...": { "type": "CHOICE", "value": null, "optionIds": ["o1"], "points": 5 } },
  "tags": ["webinar", "day-1"],
  "totalPoints": 42
}`}</pre>
          </div>
        </Card>
      )}
      {tab === "submissions" && <SubmissionsView formId={form.id} />}

      {/* Danger zone */}
      <Card className="max-w-2xl border-red-200 p-6">
        <h2 className="text-lg font-semibold text-red-700">Delete form</h2>
        <p className="mt-1 text-sm text-gray-600">This permanently removes the form and all submissions.</p>
        {confirmDelete ? (
          <div className="mt-3 flex gap-2">
            <Button variant="danger" onClick={del} disabled={saving}>
              {saving ? "Deleting…" : "Confirm delete"}
            </Button>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
          </div>
        ) : (
          <Button variant="danger" className="mt-3" onClick={() => setConfirmDelete(true)}>
            Delete form
          </Button>
        )}
      </Card>
    </div>
  );
}
