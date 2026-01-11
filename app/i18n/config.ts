export const locales = ['en', 'ta', 'hi'] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = 'en';
