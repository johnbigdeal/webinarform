import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FormBuilder } from "@/components/builder/form-builder";

export default async function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return notFound();

  const form = await prisma.form.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } }, eventDays: { orderBy: { order: "asc" } }, tags: true },
  });
  if (!form) return notFound();
  if (form.ownerId !== session.user.id && session.user.role !== "ADMIN") return notFound();

  return <FormBuilder form={JSON.parse(JSON.stringify(form))} userPlan={session.user.plan} />;
}
