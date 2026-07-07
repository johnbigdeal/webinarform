"use client";

import { useTransition } from "react";
import { Card } from "@/components/ui";
import { setEnabledLocalesAction } from "@/server/actions";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español (Spanish)",
};

export function LanguageSettings({ enabled }: { enabled: Locale[] }) {
  const [pending, startTransition] = useTransition();

  function toggle(locale: Locale, checked: boolean) {
    let next: Locale[];
    if (checked) {
      next = [...enabled, locale];
    } else {
      next = enabled.filter((l) => l !== locale);
      if (next.length === 0) return; // keep at least one
    }
    startTransition(async () => {
      await setEnabledLocalesAction(next);
    });
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-gray-200 px-5 py-3">
        <h2 className="font-semibold text-gray-900">Languages</h2>
        <p className="text-xs text-gray-500">
          Enable or disable languages. Disabled languages are hidden from form creators and respondents.
        </p>
      </div>
      <div className="divide-y divide-gray-100">
        {SUPPORTED_LOCALES.map((locale) => {
          const checked = enabled.includes(locale);
          const disabled = checked && enabled.length <= 1;
          return (
            <label
              key={locale}
              className="flex cursor-pointer items-center justify-between px-5 py-3"
            >
              <span className="text-sm text-gray-800">{LOCALE_LABELS[locale]}</span>
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled || pending}
                onChange={(e) => toggle(locale, e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600"
              />
            </label>
          );
        })}
      </div>
      {pending && <div className="px-5 py-2 text-xs text-gray-400">Saving…</div>}
    </Card>
  );
}
