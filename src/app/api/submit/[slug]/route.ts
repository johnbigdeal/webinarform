import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { submitFormSchema } from "@/lib/validations";
import { resolveTags, scoreSubmission, buildAnswersPayload } from "@/lib/scoring";
import { deliverWebhook } from "@/lib/webhook";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const form = await prisma.form.findUnique({
    where: { slug },
    include: { questions: true, eventDays: true, tags: true },
  });
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const parsed = submitFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid submission" },
      { status: 400 },
    );
  }
  const input = parsed.data;

  // Validate required answers
  const errors: Record<string, string> = {};
  for (const q of form.questions) {
    if (!q.required) continue;
    const a = input.answers[q.id];
    const empty = !a || (a.optionIds.length === 0 && (a.value === null || a.value === undefined || a.value === ""));
    if (empty) errors[q.id] = "Required";
  }
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Missing required fields", fields: errors }, { status: 422 });
  }

  const tags = resolveTags(
    form.tags.map((t) => t.tag),
    form.eventDays,
    input.eventDayId,
  );
  const answersMap = Object.fromEntries(
    Object.entries(input.answers).map(([qid, a]) => [qid, a as { value?: string | number | null; optionIds?: string[]; points?: number }]),
  );
  const totalPoints = scoreSubmission(form.questions, answersMap);
  const answersPayload = buildAnswersPayload(form.questions, input);

  const submission = await prisma.submission.create({
    data: {
      formId: form.id,
      answers: answersPayload as never,
      tags,
      totalPoints,
      eventDayId: input.eventDayId ?? null,
      language: input.language,
    },
  });

  if (form.webhookEnabled && form.webhookUrl) {
    deliverWebhook(submission, form.slug, form.webhookUrl).catch((err) => {
      console.error("[webhook] initial delivery failed:", err);
    });
  }

  return NextResponse.json({ ok: true, submissionId: submission.id });
}
