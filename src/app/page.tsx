import Link from "next/link";
import { Button } from "@/components/ui";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div className="flex items-center gap-2 text-blue-600">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 8h10M7 12h6M7 16h4" />
        </svg>
        <span className="text-2xl font-bold tracking-tight text-gray-900">WebinarForm</span>
      </div>

      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
        Build webinar forms that deliver to your app
      </h1>
      <p className="max-w-xl text-lg text-gray-600">
        Create multilingual registration forms with custom questions, scoring, branching logic,
        and event-day tagging. Every submission is sent to your webhook — automatically.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/signup">
          <Button size="lg">Get started free</Button>
        </Link>
        <Link href="/login">
          <Button size="lg" variant="secondary">Sign in</Button>
        </Link>
      </div>

      <div className="grid w-full gap-4 text-left sm:grid-cols-3 mt-8">
        {[
          { t: "Custom questions", d: "Text, choice, scale, rating — with points and branching logic." },
          { t: "Event-day tagging", d: "Selecting an event day auto-tags the webhook payload." },
          { t: "Multilingual", d: "EN + ES out of the box; respondents pick their language." },
        ].map((f) => (
          <div key={f.t} className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="font-semibold text-gray-900">{f.t}</h3>
            <p className="mt-1 text-sm text-gray-600">{f.d}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
