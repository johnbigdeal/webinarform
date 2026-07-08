import Link from "next/link";
import { Button } from "@/components/ui";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col items-center justify-center gap-8 px-6 py-20 text-center">
      <header className="flex w-full items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-[color:var(--brand-500)] center text-white shadow">WF</div>
          <div>
            <div className="text-sm font-semibold text-[color:var(--muted)]">WebinarForm</div>
            <div className="text-xs text-[color:var(--muted)]">Forms + webhooks • EN/ES</div>
          </div>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link href="/signup"><Button size="sm">Get started</Button></Link>
        </nav>
      </header>

      <section className="typeform-shell w-full">
        <div className="typeform-card">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[color:var(--text)]">Beautiful, mobile-ready webinar forms</h1>
              <p className="mt-2 max-w-2xl text-sm text-[color:var(--muted)]">Create intuitive, Typeform-style flows with branching, scoring, and automatic webhook delivery — designed for conversion, accessible on any device.</p>
            </div>
            <div className="hidden sm:block">
              <Button size="lg" className="cta-lg">Create your first form</Button>
            </div>
          </div>

          <div className="mt-6">
            <div className="progress-outer">
              <div className="progress-inner" style={{ width: "35%" }} />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-[color:var(--muted)]">
              <div>5 steps • 2 mins</div>
              <div>Mobile-first • Corporate-ready</div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { t: "Sleek flows", d: "Question-by-question animations and progress to keep users engaged." },
              { t: "Brandable", d: "Upload logo, set accent colors, and match your corporate identity." },
              { t: "Webhooks", d: "Send submissions to your app with tags and retries." },
            ].map((f) => (
              <div key={f.t} className="rounded-xl border border-gray-100 bg-[color:var(--card)] p-4">
                <h3 className="font-semibold text-[color:var(--text)]">{f.t}</h3>
                <p className="mt-1 text-sm text-[color:var(--muted)]">{f.d}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-3 sm:hidden">
            <Link href="/signup"><Button size="lg" className="w-full">Get started free</Button></Link>
          </div>
        </div>
      </section>

      <section className="w-full">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl p-6 bg-white shadow">
            <h3 className="text-lg font-semibold">Typeform-style interactions</h3>
            <p className="mt-2 text-sm text-[color:var(--muted)]">We show one question at a time with smooth transitions, micro-animations, and a clear progress bar to increase completion rates.</p>
          </div>
          <div className="rounded-xl p-6 bg-white shadow">
            <h3 className="text-lg font-semibold">Powerful admin</h3>
            <p className="mt-2 text-sm text-[color:var(--muted)]">Build questions, event-days, tags, and webhooks — all in a responsive admin panel built for mobile and desktop.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
