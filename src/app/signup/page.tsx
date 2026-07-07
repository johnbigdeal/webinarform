import { SignupForm } from "@/components/auth/signup-form";

export const metadata = { title: "Sign up — WebinarForm" };

export default function SignupPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">Create your account</h1>
        <SignupForm />
      </div>
    </main>
  );
}
