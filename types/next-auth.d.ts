import { DefaultSession } from "next-auth";
import { Role, Plan } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      plan: Plan;
    } & DefaultSession["user"];
  }
  interface User {
    role: Role;
    plan: Plan;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    plan?: Plan;
  }
}
