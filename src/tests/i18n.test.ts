import { describe, it, expect } from "vitest";
import { t, parseLocale, isLocale, ui, SUPPORTED_LOCALES, DEFAULT_LOCALE, normalizeEnabledLocales } from "@/lib/i18n";

describe("i18n", () => {
  it("resolves localized text for the requested locale", () => {
    expect(t({ en: "Submit", es: "Enviar" }, "es")).toBe("Enviar");
    expect(t({ en: "Submit", es: "Enviar" }, "en")).toBe("Submit");
  });

  it("falls back to another locale if requested is missing", () => {
    expect(t({ en: "Submit" }, "es")).toBe("Submit");
    expect(t({ es: "Enviar" }, "en")).toBe("Enviar");
  });

  it("returns fallback string when nothing available", () => {
    expect(t({}, "en", "fallback")).toBe("fallback");
    expect(t(null, "en", "x")).toBe("x");
    expect(t(undefined, "en")).toBe("");
  });

  it("passes through plain strings", () => {
    expect(t("plain", "en")).toBe("plain");
    expect(t("plain", "es")).toBe("plain");
  });

  it("isLocale guards", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("es")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("")).toBe(false);
  });

  it("parseLocale returns default for invalid", () => {
    expect(parseLocale("fr")).toBe(DEFAULT_LOCALE);
    expect(parseLocale(null)).toBe(DEFAULT_LOCALE);
    expect(parseLocale("es")).toBe("es");
  });

  it("exposes supported locales", () => {
    expect(SUPPORTED_LOCALES).toEqual(["en", "es"]);
  });

  it("ui() resolves chrome strings", () => {
    expect(ui("common.save", "en")).toBe("Save");
    expect(ui("common.save", "es")).toBe("Guardar");
    expect(ui("nav.signin", "es")).toBe("Iniciar sesión");
  });

  it("normalizeEnabledLocales filters to known locales", () => {
    expect(normalizeEnabledLocales(["en", "es"])).toEqual(["en", "es"]);
    expect(normalizeEnabledLocales(["es"])).toEqual(["es"]);
    expect(normalizeEnabledLocales(["en", "fr", "xx"])).toEqual(["en"]);
  });

  it("normalizeEnabledLocales falls back when empty/invalid", () => {
    expect(normalizeEnabledLocales([])).toEqual([DEFAULT_LOCALE]);
    expect(normalizeEnabledLocales(["fr"])).toEqual([DEFAULT_LOCALE]);
    expect(normalizeEnabledLocales(null)).toEqual([...SUPPORTED_LOCALES]);
    expect(normalizeEnabledLocales(undefined)).toEqual([...SUPPORTED_LOCALES]);
  });
});
