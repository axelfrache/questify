import { useTranslation } from 'react-i18next';
import { fr, type Locale } from 'date-fns/locale';

export function useDateLocale(): Locale | undefined {
  const { i18n } = useTranslation();
  return i18n.language === 'fr' ? fr : undefined;
}
