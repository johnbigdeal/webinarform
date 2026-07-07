import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ formId: string }> },
) {
  const { formId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: {
      ownerId: true,
      questions: { orderBy: { order: "asc" } },
      submissions: {
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { deliveries: { orderBy: { attempt: "asc" } } },
      },
    },
  });
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (form.ownerId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    questions: form.questions,
    submissions: form.submissions,
  });
}
