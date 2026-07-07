"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui";
import { togglePlanAction, toggleRoleAction } from "@/server/actions";
import type { Role, Plan } from "@/generated/prisma/client";

export function AdminUserActions({
  userId,
  plan,
  role,
  isSelf,
}: {
  userId: string;
  plan: Plan;
  role: Role;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function togglePlan() {
    startTransition(async () => {
      await togglePlanAction(userId);
    });
  }

  function toggleRole() {
    startTransition(async () => {
      await toggleRoleAction(userId);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={plan === "PAID" ? "secondary" : "primary"}
        disabled={pending || isSelf}
        onClick={togglePlan}
      >
        {plan === "PAID" ? "Downgrade to Free" : "Upgrade to Paid"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={pending || isSelf}
        onClick={toggleRole}
        title={isSelf ? "You cannot change your own role" : undefined}
      >
        {role === "ADMIN" ? "Make User" : "Make Admin"}
      </Button>
    </div>
  );
}
