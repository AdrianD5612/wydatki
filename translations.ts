import en from './locales/en.json';
import pl from './locales/pl.json';

const translations = {
  en,
  pl,
};

/**
 * Retrieves the translation for a given key.
 *
 * @param {string} key - The key for the translation to retrieve.
 * @return {string} The translation corresponding to the key.
 */
export function getTranslation(lang: "en" | "pl", key: string): string {
  if (lang == undefined) {
    // check if we're in the browser
    if (typeof window !== 'undefined' && navigator) {
      // check and set polish or in any other case english
      lang = navigator.language.slice(0, 2)==="pl" ? "pl" : "en";
    } else {
      // in server-side case set lang to english
      lang = "en";
    }
  }
  if (!translations.hasOwnProperty(lang)) {
    throw new Error(`Unknown locale: ${lang}`);
  }
  const localeData: Record<string, string> = translations[lang];
  if (!localeData.hasOwnProperty(key)) {
    throw new Error(`Unknown translation key: ${key}`);
  }
  return localeData[key];
}