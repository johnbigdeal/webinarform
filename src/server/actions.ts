"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import { isWithinLimit, limitsFor } from "@/lib/plans";
import { formSchema } from "@/lib/validations";
import type { FormInput } from "@/lib/validations";
import { ENABLED_LOCALES_KEY } from "@/lib/settings";
import { isLocale, type Locale } from "@/lib/i18n";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

// ─────────────── Create ───────────────

export async function createFormAction(formData: FormData) {
  const user = await requireUser();
  const titleEn = (formData.get("titleEn") as string)?.trim() || "Untitled form";

  const count = await prisma.form.count({ where: { ownerId: user.id } });
  if (!isWithinLimit(user.plan, "maxForms", count)) {
    return { error: "You've reached the form limit for your plan. Upgrade to create more." };
  }

  const slug = generateSlug(titleEn);
  const form = await prisma.form.create({
    data: {
      slug,
      ownerId: user.id,
      title: { en: titleEn, es: titleEn },
      submitLabel: { en: "Submit", es: "Enviar" },
    },
  });

  revalidatePath("/dashboard");
  return { id: form.id, slug: form.slug };
}

// ─────────────── Update ───────────────

export async function updateFormAction(formId: string, input: FormInput) {
  const user = await requireUser();
  const parsed = formSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form data" };
  }
  const data = parsed.data;

  // Ownership + plan-gated fields
  const form = await prisma.form.findUnique({ where: { id: formId } });
  if (!form || (form.ownerId !== user.id && user.role !== "ADMIN")) {
    return { error: "Not found" };
  }

  // Enforce plan limits on paid-only fields
  const webhookUrl = data.webhookUrl ?? null;
  if (webhookUrl && !isWithinLimit(user.plan, "customWebhook", 0)) {
    return { error: "Custom webhook requires a paid plan." };
  }
  const tags = user.plan === "PAID" || isWithinLimit(user.plan, "customTags", 0) ? data.tags : [];
  const logoUrl = data.logoUrl && isWithinLimit(user.plan, "logoUpload", 0) ? data.logoUrl : null;
  const accentColor = isWithinLimit(user.plan, "customTheme", 0) ? data.accentColor : form.accentColor;
  const eventDays =
    data.eventDays.length > 0 && !isWithinLimit(user.plan, "eventDaySelector", 0)
      ? []
      : data.eventDays;

  // Question count limit
  const questionLimit = limitsFor(user.plan).questionsPerForm;
  if (data.questions.length > questionLimit) {
    return { error: `Your plan allows up to ${questionLimit} questions.` };
  }

  // Slug uniqueness
  if (data.slug !== form.slug) {
    const clash = await prisma.form.findUnique({ where: { slug: data.slug } });
    if (clash) return { error: "That slug is already taken." };
  }

  await prisma.form.update({
    where: { id: formId },
    data: {
      slug: data.slug,
      title: data.title,
      description: data.description ?? undefined,
      submitLabel: data.submitLabel,
      thankYou: data.thankYou ?? undefined,
      logoUrl,
      accentColor,
      webhookUrl,
      webhookEnabled: data.webhookEnabled,
      webinarEnabled: data.webinarEnabled,
      youtubeVideoId: data.youtubeVideoId ?? null,
      chatEnabled: data.chatEnabled,
      tags: {
        deleteMany: {},
        create: tags.map((tag) => ({ tag })),
      },
      eventDays: {
        deleteMany: {},
        create: eventDays.map((d) => ({
          date: new Date(d.date),
          label: d.label,
          autoTag: d.autoTag,
          order: d.order,
        })),
      },
      questions: {
        deleteMany: {},
        create: data.questions.map((q) => ({
          type: q.type,
          label: q.label,
          helpText: q.helpText ?? undefined,
          required: q.required,
          options: q.options,
          scaleConfig: q.scaleConfig ?? undefined,
          logic: q.logic,
          points: q.points,
          order: q.order,
        })),
      },
    },
  });

  revalidatePath(`/dashboard/forms/${formId}`);
  revalidatePath("/dashboard");
  revalidatePath(`/f/${data.slug}`);
  return { ok: true };
}

// ─────────────── Delete ───────────────

export async function deleteFormAction(formId: string) {
  const user = await requireUser();
  const form = await prisma.form.findUnique({ where: { id: formId } });
  if (!form || (form.ownerId !== user.id && user.role !== "ADMIN")) {
    return { error: "Not found" };
  }
  await prisma.form.delete({ where: { id: formId } });
  revalidatePath("/dashboard");
  return { ok: true };
}

// ─────────────── Admin: toggle plan ───────────────

export async function togglePlanAction(userId: string) {
  const user = await requireUser();
  if (user.role !== "ADMIN") return { error: "Admin only" };
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "User not found" };
  await prisma.user.update({
    where: { id: userId },
    data: { plan: target.plan === "FREE" ? "PAID" : "FREE" },
  });
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "plan.toggle",
      target: userId,
      meta: { from: target.plan, to: target.plan === "FREE" ? "PAID" : "FREE" },
    },
  });
  revalidatePath("/admin");
  return { ok: true };
}

export async function toggleRoleAction(userId: string) {
  const user = await requireUser();
  if (user.role !== "ADMIN") return { error: "Admin only" };
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "User not found" };
  if (target.id === user.id) return { error: "You cannot change your own role" };
  await prisma.user.update({
    where: { id: userId },
    data: { role: target.role === "ADMIN" ? "USER" : "ADMIN" },
  });
  revalidatePath("/admin");
  return { ok: true };
}

// ─────────────── Admin: toggle enabled locales ───────────────

export async function setEnabledLocalesAction(locales: string[]) {
  const user = await requireUser();
  if (user.role !== "ADMIN") return { error: "Admin only" };

  const clean = locales.filter((l): l is Locale => isLocale(l));
  if (clean.length === 0) return { error: "At least one language must be enabled" };

  await prisma.setting.upsert({
    where: { key: ENABLED_LOCALES_KEY },
    update: { value: clean },
    create: { key: ENABLED_LOCALES_KEY, value: clean },
  });
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "locales.update",
      target: ENABLED_LOCALES_KEY,
      meta: { locales: clean },
    },
  });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { ok: true };
}
