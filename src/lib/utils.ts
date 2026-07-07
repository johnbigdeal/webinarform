import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function generateSlug(base: string): string {
  const slug = slugify(base);
  const random = Math.random().toString(36).slice(2, 8);
  return slug ? `${slug}-${random}` : random;
}

export function formatDate(date: Date | string, locale = "en"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}
