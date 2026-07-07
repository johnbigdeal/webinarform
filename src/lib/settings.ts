import { prisma } from "@/lib/prisma";
import {
  normalizeEnabledLocales,
  ENABLED_LOCALES_DEFAULT,
  type Locale,
} from "@/lib/i18n";

export const ENABLED_LOCALES_KEY = "enabledLocales";

/** Read the admin-configured enabled locales from the DB, with sensible fallback. */
export async function getEnabledLocales(): Promise<Locale[]> {
  try {
    const row = await prisma.setting.findUnique({
      where: { key: ENABLED_LOCALES_KEY },
    });
    if (!row) return ENABLED_LOCALES_DEFAULT;
    return normalizeEnabledLocales(row.value);
  } catch {
    return ENABLED_LOCALES_DEFAULT;
  }
}
