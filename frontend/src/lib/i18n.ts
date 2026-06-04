import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en/translation.json';
import fr from '../locales/fr/translation.json';

const savedLanguage = localStorage.getItem('questify-language');
const browserLanguage = navigator.language.startsWith('fr') ? 'fr' : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
  lng: savedLanguage ?? browserLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
