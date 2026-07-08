import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import { isWithinLimit } from "@/lib/plans";

export async function POST(req: Request) {
  try {
    const user = await auth();
    if (!user?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const titleEn = (body.titleEn || "").trim() || "Untitled form";

    const count = await prisma.form.count({ where: { ownerId: user.user.id } });
    if (!isWithinLimit(user.user.plan, "maxForms", count)) {
      return NextResponse.json({ error: "You've reached the form limit for your plan. Upgrade to create more." }, { status: 403 });
    }

    const slug = generateSlug(titleEn);
    const form = await prisma.form.create({
      data: {
        slug,
        ownerId: user.user.id,
        title: { en: titleEn, es: titleEn },
        submitLabel: { en: "Submit", es: "Enviar" },
      },
    });

    return NextResponse.json({ id: form.id, slug: form.slug });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
