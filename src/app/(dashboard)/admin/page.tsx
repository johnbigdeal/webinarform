import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Card, Badge, Button } from "@/components/ui";
import { AdminUserActions } from "@/components/admin/admin-user-actions";
import { LanguageSettings } from "@/components/admin/language-settings";
import { getEnabledLocales } from "@/lib/settings";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { forms: true } } },
  });

  const auditLogs = await prisma.auditLog.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  const enabledLocales = await getEnabledLocales();

  const stats = {
    users: users.length,
    paid: users.filter((u) => u.plan === "PAID").length,
    admins: users.filter((u) => u.role === "ADMIN").length,
    forms: users.reduce((s, u) => s + u._count.forms, 0),
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
        <p className="text-sm text-gray-600">Manage users, plans, and roles.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Users", value: stats.users },
          { label: "Paid plans", value: stats.paid },
          { label: "Admins", value: stats.admins },
          { label: "Forms", value: stats.forms },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Language settings */}
      <LanguageSettings enabled={enabledLocales} />

      {/* Users table */}
      <Card className="overflow-hidden">
        <div className="border-b border-gray-200 px-5 py-3">
          <h2 className="font-semibold text-gray-900">Users</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {users.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-gray-900">{u.name ?? u.email}</span>
                  {u.role === "ADMIN" && <Badge className="bg-purple-100 text-purple-700">Admin</Badge>}
                  <Badge className={u.plan === "PAID" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                    {u.plan}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">
                  {u.email} · {u._count.forms} form{u._count.forms === 1 ? "" : "s"} · joined {formatDate(u.createdAt)}
                </p>
              </div>
              <AdminUserActions userId={u.id} plan={u.plan} role={u.role} isSelf={u.id === session.user.id} />
            </div>
          ))}
        </div>
      </Card>

      {/* Audit log */}
      {auditLogs.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b border-gray-200 px-5 py-3">
            <h2 className="font-semibold text-gray-900">Recent activity</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {auditLogs.map((log) => (
              <div key={log.id} className="px-5 py-2 text-xs text-gray-600">
                <span className="font-medium text-gray-900">{log.action}</span>{" "}
                on <span className="font-mono">{log.target}</span>
                <span className="ml-2 text-gray-400">{formatDate(log.createdAt)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
