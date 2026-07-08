import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";

// Improved UI primitives using the corporate brand tokens and smoother motion

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-[color:var(--brand-500)] text-white hover:bg-[color:var(--brand-600)] active:translate-y-[1px] shadow-sm focus-visible:outline-[3px] focus-visible:outline-[color:var(--brand-300)]/60",
  secondary:
    "bg-white text-[color:var(--text)] border border-gray-200 hover:shadow-sm active:translate-y-[1px]",
  ghost: "bg-transparent text-[color:var(--text)] hover:bg-gray-50",
  danger: "bg-[color:var(--danger-500)] text-white hover:bg-[color:var(--danger-700)]",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm rounded-md",
  md: "h-11 px-5 text-sm rounded-lg",
  lg: "h-14 px-6 text-base rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-transform duration-150 ease-out disabled:opacity-60 disabled:pointer-events-none",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// Input & Textarea: cleaner focus, subtle shadows, mobile-friendly padding
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-[color:var(--text)] placeholder:text-gray-400 transition-shadow duration-150 focus:shadow-[0_6px_18px_rgba(37,99,235,0.08)] focus:border-[color:var(--brand-500)] focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[color:var(--text)] placeholder:text-gray-400 transition-shadow duration-150 focus:shadow-[0_6px_18px_rgba(37,99,235,0.08)] focus:border-[color:var(--brand-500)] focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("text-sm font-medium text-[color:var(--muted)]", className)} {...props}>
      {children}
    </label>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-xl border border-gray-100 bg-[color:var(--card)] shadow-md", className)}>{children}</div>
  );
}

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-[color:var(--muted)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
