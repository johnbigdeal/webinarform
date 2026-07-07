export const SUPPORTED_LOCALES = ["en", "es"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/**
 * A multilanguage string value stored in the DB as JSON.
 * e.g. { en: "Submit", es: "Enviar" }
 */
export type LocalizedText = Partial<Record<Locale, string>> & { en?: string; es?: string };

/**
 * Resolve a LocalizedText into a plain string for the requested locale,
 * falling back to the first available locale, then to the provided fallback.
 */
export function t(
  value: LocalizedText | string | null | undefined,
  locale: Locale,
  fallback = "",
): string {
  if (value == null) return fallback;
  if (typeof value === "string") return value;
  if (value[locale]) return value[locale] as string;
  for (const l of SUPPORTED_LOCALES) {
    if (value[l]) return value[l] as string;
  }
  return fallback;
}

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function parseLocale(value: string | null | undefined): Locale {
  if (value && isLocale(value)) return value;
  return DEFAULT_LOCALE;
}

/** UI strings for the dashboard / chrome (not form content). */
export const uiStrings = {
  en: {
    "nav.dashboard": "Dashboard",
    "nav.forms": "Forms",
    "nav.admin": "Admin",
    "nav.signout": "Sign out",
    "nav.signin": "Sign in",
    "nav.signup": "Sign up",
    "form.new": "New form",
    "form.builder": "Builder",
    "form.submissions": "Submissions",
    "form.publish": "Publish",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.add": "Add",
    "plan.free": "Free",
    "plan.paid": "Paid",
  },
  es: {
    "nav.dashboard": "Panel",
    "nav.forms": "Formularios",
    "nav.admin": "Admin",
    "nav.signout": "Cerrar sesión",
    "nav.signin": "Iniciar sesión",
    "nav.signup": "Registrarse",
    "form.new": "Nuevo formulario",
    "form.builder": "Editor",
    "form.submissions": "Respuestas",
    "form.publish": "Publicar",
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.delete": "Eliminar",
    "common.add": "Añadir",
    "plan.free": "Gratis",
    "plan.paid": "De pago",
  },
} as const;

export function ui(key: keyof (typeof uiStrings)["en"], locale: Locale): string {
  return (uiStrings[locale] as Record<string, string>)[key] ?? (uiStrings.en as Record<string, string>)[key] ?? key;
}
