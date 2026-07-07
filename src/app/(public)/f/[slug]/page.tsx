import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PublicForm } from "@/components/public/public-form";
import { getEnabledLocales } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const form = await prisma.form.findUnique({
    where: { slug },
    include: {
      questions: { orderBy: { order: "asc" } },
      eventDays: { orderBy: { order: "asc" } },
      tags: true,
    },
  });
  if (!form) return notFound();

  const enabledLocales = await getEnabledLocales();

  return <PublicForm form={JSON.parse(JSON.stringify(form))} enabledLocales={enabledLocales} />;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const form = await prisma.form.findUnique({ where: { slug }, select: { title: true } });
  const title = form ? (form.title as { en?: string; es?: string })?.en ?? "Form" : "Form";
  return { title: `${title} — WebinarForm` };
}
