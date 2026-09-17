import en from './en.json';
import fr from './fr.json';

export type Locale = 'en' | 'fr';

const dictionaries: Record<Locale, Record<string, string>> = { en, fr };

export function getLocale(Astro: { cookies: { get: (name: string) => { value?: string } | undefined } }): Locale {
  return Astro.cookies.get('lang')?.value === 'fr' ? 'fr' : 'en';
}

// t('key', { name: 'value' }) looks up the string and replaces {name}
// placeholders. Falls back to the English string, then the raw key, if a
// translation is missing.
export function useTranslations(locale: Locale) {
  const dict = dictionaries[locale] ?? dictionaries.en;

  return (key: string, vars?: Record<string, string | number>): string => {
    let str = dict[key] ?? dictionaries.en[key] ?? key;
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        str = str.split(`{${name}}`).join(String(value));
      }
    }
    return str;
  };
}
