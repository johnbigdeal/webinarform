import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard");

  return (
    <div className="min-h-dvh bg-gray-50">
      <DashboardNav
        user={{
          name: session.user.name ?? session.user.email ?? "",
          role: session.user.role,
          plan: session.user.plan,
        }}
      />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
