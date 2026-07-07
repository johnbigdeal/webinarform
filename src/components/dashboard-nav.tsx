"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Badge } from "@/components/ui";
import type { Role, Plan } from "@/generated/prisma/client";

export function DashboardNav({
  user,
}: {
  user: { name: string; role: Role; plan: Plan };
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-gray-900">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M7 8h10M7 12h6M7 16h4" />
            </svg>
            WebinarForm
          </Link>
          <nav className="hidden items-center gap-4 text-sm sm:flex">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Forms</Link>
            {user.role === "ADMIN" && (
              <Link href="/admin" className="text-gray-600 hover:text-gray-900">Admin</Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            className={
              user.plan === "PAID"
                ? "bg-purple-100 text-purple-700"
                : "bg-gray-100 text-gray-600"
            }
          >
            {user.plan === "PAID" ? "Paid" : "Free"}
          </Badge>
          <span className="hidden text-sm text-gray-600 sm:inline">{user.name}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
