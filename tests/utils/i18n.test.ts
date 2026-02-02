import { describe, it, expect, beforeEach } from "vitest";
import { t, initI18n, getLocale, getSupportedLocales, resetI18n } from "../../src/utils/i18n/index.js";

describe("i18n", () => {
  beforeEach(() => {
    resetI18n();
    initI18n("pt-BR", true);
  });

  describe("initI18n", () => {
    it("deve usar pt-BR como padrão", () => {
      expect(getLocale()).toBe("pt-BR");
    });

    it("deve mudar para en", () => {
      initI18n("en", true);
      expect(getLocale()).toBe("en");
    });

    it("deve fazer prefix match (pt → pt-BR)", () => {
      initI18n("pt", true);
      expect(getLocale()).toBe("pt-BR");
    });

    it("deve fallback para en com locale desconhecido", () => {
      initI18n("fr", true);
      expect(getLocale()).toBe("en");
    });
  });

  describe("getSupportedLocales", () => {
    it("deve retornar en e pt-BR", () => {
      const locales = getSupportedLocales();
      expect(locales).toContain("en");
      expect(locales).toContain("pt-BR");
    });
  });

  describe("t()", () => {
    it("deve traduzir key simples em pt-BR", () => {
      initI18n("pt-BR", true);
      expect(t("cli.done")).toBe("Concluído.");
    });

    it("deve traduzir key simples em en", () => {
      initI18n("en", true);
      expect(t("cli.done")).toBe("Done.");
    });

    it("deve interpolar parâmetros", () => {
      initI18n("en", true);
      expect(t("cli.run.agent", { agent: "feature-developer" })).toBe(
        "Agent: feature-developer",
      );
    });

    it("deve interpolar parâmetros em pt-BR", () => {
      initI18n("pt-BR", true);
      expect(t("cli.run.agent", { agent: "feature-developer" })).toBe(
        "Agente: feature-developer",
      );
    });

    it("deve interpolar múltiplos parâmetros", () => {
      initI18n("en", true);
      expect(t("cli.workflow.initialized", { name: "test", scale: "medium" })).toBe(
        "Workflow 'test' initialized with scale medium.",
      );
    });

    it("deve interpolar números", () => {
      initI18n("en", true);
      expect(t("cli.review.findings", { count: 5 })).toBe("5 issue(s) found.");
    });

    it("deve retornar key como fallback se não encontrada", () => {
      // Force a cast to test fallback behavior
      const result = t("nonexistent.key" as never);
      expect(result).toBe("nonexistent.key");
    });
  });
});
