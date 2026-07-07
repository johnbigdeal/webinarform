import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Sign in — WebinarForm" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">Sign in</h1>
        <Suspense fallback={<div className="h-40" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
