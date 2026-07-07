"use client";

import { Button, Input, Label, Card, Badge } from "@/components/ui";
import type { EventDayInput } from "@/lib/validations";
import type { Plan } from "@/generated/prisma/client";
import type { Locale } from "@/lib/i18n";

const LOCALE_LABELS: Record<Locale, string> = { en: "EN", es: "ES" };

export function EventDaysEditor({
  eventDays,
  setEventDays,
  userPlan,
  enabledLocales,
}: {
  eventDays: EventDayInput[];
  setEventDays: (d: EventDayInput[]) => void;
  userPlan: Plan;
  enabledLocales: Locale[];
}) {
  const allowed = userPlan === "PAID";

  function add() {
    if (!allowed) return;
    const id = crypto.randomUUID();
    setDays([
      ...eventDays,
      { id, date: new Date().toISOString().slice(0, 10), label: { en: "", es: "" }, autoTag: "", order: eventDays.length },
    ]);
  }
  function setDays(d: EventDayInput[]) {
    if (!allowed) return;
    setEventDays(d);
  }
  function update(id: string, patch: Partial<EventDayInput>) {
    setDays(eventDays.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }
  function remove(id: string) {
    setDays(eventDays.filter((d) => d.id !== id));
  }

  return (
    <Card className="max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Event days</h2>
          <p className="mt-1 text-sm text-gray-600">
            Respondents pick a day. The day&apos;s auto-tag is appended to the webhook payload.
          </p>
        </div>
        <Button size="sm" onClick={add} disabled={!allowed}>+ Add day</Button>
      </div>

      {!allowed && (
        <Badge className="mt-3 bg-amber-100 text-amber-800">
          Event-day selector requires a paid plan — ask an admin to upgrade.
        </Badge>
      )}

      {eventDays.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No event days configured.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {eventDays.map((d) => (
            <div key={d.id} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Date</Label>
                <Input type="date" value={d.date.slice(0, 10)} onChange={(e) => update(d.id!, { date: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Auto-tag (webhook)</Label>
                <Input placeholder="day-1" value={d.autoTag} onChange={(e) => update(d.id!, { autoTag: e.target.value })} />
              </div>
              {enabledLocales.map((locale) => (
                <div key={locale} className="flex flex-col gap-1.5">
                  <Label>Label ({LOCALE_LABELS[locale]})</Label>
                  <Input
                    placeholder={locale === "es" ? "Día 1 — 10 julio" : "Day 1 — July 10"}
                    value={d.label[locale] ?? ""}
                    onChange={(e) => update(d.id!, { label: { ...d.label, [locale]: e.target.value } })}
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <button onClick={() => remove(d.id!)} className="text-sm text-red-500 hover:text-red-700">Remove day</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
