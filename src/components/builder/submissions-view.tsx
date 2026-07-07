"use client";

import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";

type Submission = {
  id: string;
  createdAt: string;
  language: string;
  tags: string[];
  totalPoints: number;
  eventDayId: string | null;
  answers: Record<string, { type: string; value: string | number | null; optionIds: string[]; points: number }>;
  deliveries: { id: string; status: number; attempt: number; success: boolean; error: string | null; createdAt: string }[];
};

type Question = { id: string; type: string; label: Record<string, string> | string; options?: { id: string; label: Record<string, string> | string }[] };

export function SubmissionsView({ formId }: { formId: string }) {
  const [submissions, setSubmissions] = useState<Submission[] | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/forms/${formId}/submissions`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => {
        if (cancelled) return;
        setSubmissions(d.submissions ?? []);
        setQuestions(d.questions ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load submissions");
          setSubmissions([]);
        }
      });
    return () => { cancelled = true; };
  }, [formId]);

  if (error) return <Card className="p-6 text-sm text-red-600">{error}</Card>;
  if (submissions === null) return <Card className="p-6 text-sm text-gray-500">Loading submissions…</Card>;
  if (submissions.length === 0)
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-gray-600">No submissions yet. Share your public form link to start collecting.</p>
      </Card>
    );

  return (
    <div className="flex flex-col gap-3">
      {submissions.map((s) => (
        <Card key={s.id} className="p-4">
          <button
            onClick={() => setExpanded(expanded === s.id ? null : s.id)}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-900">
                {new Date(s.createdAt).toLocaleString()}
              </span>
              <Badge className="bg-gray-100 text-gray-600">{s.language}</Badge>
              <Badge className="bg-blue-50 text-blue-700">{s.totalPoints} pts</Badge>
              {s.deliveries.length > 0 && (
                <Badge
                  className={
                    s.deliveries.some((d) => d.success)
                      ? "bg-green-50 text-green-700"
                      : "bg-amber-50 text-amber-700"
                  }
                >
                  webhook {s.deliveries.some((d) => d.success) ? "delivered" : "retrying"}
                </Badge>
              )}
            </div>
            <span className="text-xs text-gray-400">{expanded === s.id ? "▲" : "▼"}</span>
          </button>

          {expanded === s.id && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              {/* Tags */}
              {s.tags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {s.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{tag}</span>
                  ))}
                </div>
              )}

              {/* Answers */}
              <div className="flex flex-col gap-2">
                {questions.map((q) => {
                  const a = s.answers[q.id];
                  if (!a) return null;
                  const label = typeof q.label === "string" ? q.label : (q.label.en || q.label.es || q.id);
                  const display = answerDisplay(a, q);
                  return (
                    <div key={q.id} className="grid grid-cols-3 gap-2 text-sm">
                      <span className="text-gray-500">{label}</span>
                      <span className="col-span-2 text-gray-900">{display || "—"}</span>
                    </div>
                  );
                })}
              </div>

              {/* Webhook deliveries */}
              {s.deliveries.length > 0 && (
                <div className="mt-4 rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-500">Webhook deliveries</p>
                  <div className="mt-2 flex flex-col gap-1">
                    {s.deliveries.map((d) => (
                      <div key={d.id} className="flex items-center gap-2 text-xs text-gray-700">
                        <span className={d.success ? "text-green-600" : "text-amber-600"}>
                          {d.success ? "✓" : "↻"} HTTP {d.status}
                        </span>
                        <span>attempt {d.attempt}</span>
                        <span className="text-gray-400">{new Date(d.createdAt).toLocaleString()}</span>
                        {d.error && <span className="text-red-500">{d.error}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function answerDisplay(
  a: Submission["answers"][string],
  q: Question,
): string {
  if (a.optionIds.length > 0) {
    const opts = q.options ?? [];
    return a.optionIds
      .map((id) => {
        const o = opts.find((x) => x.id === id);
        if (!o) return id;
        return typeof o.label === "string" ? o.label : (o.label.en || o.label.es || id);
      })
      .join(", ");
  }
  if (a.value !== null && a.value !== undefined) return String(a.value);
  return "";
}
