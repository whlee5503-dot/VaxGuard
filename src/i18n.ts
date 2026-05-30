import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import ko from "./locales/ko.json";
import fr from "./locales/fr.json";
import sw from "./locales/sw.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English",   flag: "🇬🇧" },
  { code: "ko", label: "한국어",     flag: "🇰🇷" },
  { code: "fr", label: "Français",  flag: "🇫🇷" },
  { code: "sw", label: "Kiswahili", flag: "🇹🇿" },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]["code"];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ko: { translation: ko },
      fr: { translation: fr },
      sw: { translation: sw },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "ko", "fr", "sw"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "vaxguard-language",
    },
  });

export default i18n;
