import { createI18n } from 'vue-i18n';
import de from './locales/de.json';
import tr from './locales/tr.json';

const savedLocale = typeof window !== 'undefined' ? localStorage.getItem('locale') : null;

const i18n = createI18n({
    legacy: false,
    locale: savedLocale || 'de',
    fallbackLocale: 'de',
    messages: {
        de,
        tr,
    },
});

export default i18n;

