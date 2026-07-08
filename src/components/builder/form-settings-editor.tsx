"use client";

import { Button, Input, Label, Textarea, Card, Badge } from "@/components/ui";
import type { Plan } from "@/generated/prisma/client";
import { useState } from "react";
import { isWithinLimit } from "@/lib/plans";
import type { Locale } from "@/lib/i18n";

const LOCALE_LABELS: Record<Locale, string> = { en: "English", es: "Español" };

type Props = {
  slug: string;
  setSlug: (v: string) => void;
  title: Record<string, string>;
  setTitle: (v: Record<string, string>) => void;
  description: Record<string, string>;
  setDescription: (v: Record<string, string>) => void;
  submitLabel: Record<string, string>;
  setSubmitLabel: (v: Record<string, string>) => void;
  thankYou: Record<string, string>;
  setThankYou: (v: Record<string, string>) => void;
  logoUrl: string;
  setLogoUrl: (v: string) => void;
  accentColor: string;
  setAccentColor: (v: string) => void;
  tags: string[];
  setTags: (v: string[]) => void;
  userPlan: Plan;
  enabledLocales: Locale[];
};

export function FormSettingsEditor(p: Props) {
  const logoAllowed = p.userPlan === "PAID";
  const themeAllowed = p.userPlan === "PAID";
  const tagsAllowed = isWithinLimit(p.userPlan, "customTags", 0);

  return (
    <div className="flex flex-col gap-4">
      {/* URL slug */}
      <Card className="max-w-3xl p-6">
        <h2 className="text-lg font-semibold text-gray-900">Public URL</h2>
        <p className="mt-1 text-sm text-gray-600">The slug is the last segment of your form&apos;s URL.</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm text-gray-500">/f/</span>
          <Input
            value={p.slug}
            onChange={(e) => p.setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            className="max-w-xs font-mono"
          />
        </div>
      </Card>

      {/* Multilanguage text */}
      <Card className="max-w-3xl p-6">
        <h2 className="text-lg font-semibold text-gray-900">Text content</h2>
        <p className="mt-1 text-sm text-gray-600">Provide content in English and Spanish. Respondents pick the language.</p>
        <div className="mt-4 flex flex-col gap-4">
          <Section title="Title" value={p.title} onChange={p.setTitle} enabledLocales={p.enabledLocales} />
          <Section title="Description" value={p.description} onChange={p.setDescription} enabledLocales={p.enabledLocales} textarea />
          <Section title="Submit button label" value={p.submitLabel} onChange={p.setSubmitLabel} enabledLocales={p.enabledLocales} />
          <Section title="Thank-you message (after submit)" value={p.thankYou} onChange={p.setThankYou} enabledLocales={p.enabledLocales} textarea />
        </div>
      </Card>

      {/* Branding */}
      <Card className="max-w-3xl p-6">
        <h2 className="text-lg font-semibold text-[color:var(--text)]">Branding & frontend</h2>
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="h-16 w-16 rounded-md bg-[color:var(--brand-500)] center text-white font-bold">Logo</div>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                type="url"
                placeholder="https://example.com/logo.png"
                value={p.logoUrl}
                disabled={!logoAllowed}
                onChange={(e) => p.setLogoUrl(e.target.value)}
              />
              {!logoAllowed && <Badge className="mt-1 w-fit bg-amber-100 text-amber-800">Logo upload requires a paid plan</Badge>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="accent">Accent color</Label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  id="accent"
                  type="color"
                  value={p.accentColor}
                  disabled={!themeAllowed}
                  onChange={(e) => p.setAccentColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-gray-300"
                />
                <Input value={p.accentColor} disabled={!themeAllowed} onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9a-fA-F]{0,6}$/.test(v)) p.setAccentColor(v);
                }} className="w-28 font-mono" />
              </div>
              {!themeAllowed && <Badge className="mt-1 w-fit bg-amber-100 text-amber-800">Custom theme requires a paid plan</Badge>}
            </div>

            <div>
              <Label>Frontend style</Label>
              <div className="mt-2 flex gap-2">
                <button className="rounded-lg border border-gray-200 p-2 text-sm">Typeform</button>
                <button className="rounded-lg border border-gray-200 p-2 text-sm">Compact</button>
                <button className="rounded-lg border border-gray-200 p-2 text-sm">Inline</button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tags */}
      <Card className="max-w-3xl p-6">
        <h2 className="text-lg font-semibold text-gray-900">Tags</h2>
        <p className="mt-1 text-sm text-gray-600">Tags are metadata included in the webhook payload, not visible to respondents.</p>
        {!tagsAllowed ? (
          <Badge className="mt-3 bg-amber-100 text-amber-800">Custom tags require a paid plan</Badge>
        ) : (
          <TagsEditor tags={p.tags} setTags={p.setTags} />
        )}
      </Card>
    </div>
  );
}

function Section({
  title,
  value,
  onChange,
  enabledLocales,
  textarea,
}: {
  title: string;
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
  enabledLocales: Locale[];
  textarea?: boolean;
}) {
  const cols = enabledLocales.length === 1 ? "sm:grid-cols-1" : "sm:grid-cols-2";
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">{title}</h3>
      <div className={`grid gap-3 ${cols}`}>
        {enabledLocales.map((locale) => (
          <div key={locale} className="flex flex-col gap-1">
            <Label className="text-xs text-gray-500">{LOCALE_LABELS[locale]}</Label>
            {textarea ? (
              <Textarea
                rows={2}
                value={value[locale] ?? ""}
                onChange={(e) => onChange({ ...value, [locale]: e.target.value })}
              />
            ) : (
              <Input value={value[locale] ?? ""} onChange={(e) => onChange({ ...value, [locale]: e.target.value })} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TagsEditor({ tags, setTags }: { tags: string[]; setTags: (v: string[]) => void }) {
  const [input, setInput] = useState("");
  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            {tag}
            <button onClick={() => setTags(tags.filter((t) => t !== tag))} className="text-blue-400 hover:text-blue-900">×</button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-sm text-gray-400">No tags yet.</span>}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const v = input.trim().toLowerCase().replace(/\s+/g, "-");
          if (v && !tags.includes(v)) setTags([...tags, v]);
          setInput("");
        }}
      >
        <Input placeholder="add-a-tag" value={input} onChange={(e) => setInput(e.target.value)} className="max-w-xs" />
        <Button type="submit" size="sm" variant="secondary">Add</Button>
      </form>
    </div>
  );
}