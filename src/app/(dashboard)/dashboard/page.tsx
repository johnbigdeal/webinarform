import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWithinLimit } from "@/lib/plans";
import { formatDate } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { Button, Card, Badge } from "@/components/ui";
import { NewFormButton } from "@/components/new-form-button";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard");

  const forms = await prisma.form.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { submissions: true } } },
  });

  const formCount = forms.length;
  const canCreate = isWithinLimit(session.user.plan, "maxForms", formCount);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your forms</h1>
          <p className="text-sm text-gray-600">
            {formCount} form{formCount === 1 ? "" : "s"} ·{" "}
            {session.user.plan === "PAID" ? "Unlimited" : `1 max`}
          </p>
        </div>
        {canCreate ? (
          <NewFormButton />
        ) : (
          <div className="flex items-center gap-2">
            <Badge className="bg-gray-100 text-gray-600">Free plan limit reached</Badge>
          </div>
        )}
      </div>

      {forms.length === 0 ? (
        <Card className="p-12 text-center">
          <h2 className="text-lg font-semibold text-gray-900">No forms yet</h2>
          <p className="mt-1 text-sm text-gray-600">Create your first webinar registration form.</p>
          <div className="mt-4 flex justify-center">
            <NewFormButton />
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <Link key={form.id} href={`/dashboard/forms/${form.id}`}>
              <Card className="flex h-full flex-col gap-2 p-5 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">
                    {t(form.title as never, "en", "Untitled")}
                  </h3>
                  <Badge className="bg-blue-50 text-blue-700">{form._count.submissions}</Badge>
                </div>
                <p className="text-xs text-gray-500">/f/{form.slug}</p>
                <p className="mt-auto text-xs text-gray-500">Updated {formatDate(form.updatedAt)}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
