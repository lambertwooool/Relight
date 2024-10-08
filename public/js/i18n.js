import { getDefaultLanguage } from './utils.js';
import { languages } from './languages.js';

let i18nInstance = null;

export async function initI18n() {
    if (i18nInstance) {
        return i18nInstance;
    }

    return new Promise((resolve) => {
        const checkI18next = () => {
            if (window.i18next) {
                i18nInstance = window.i18next.createInstance();
                i18nInstance.init({
                    lng: getDefaultLanguage(),
                    fallbackLng: 'en',
                    resources: Object.entries(languages).reduce((acc, [lang, translations]) => {
                        acc[lang] = { translation: translations };
                        return acc;
                    }, {}),
                    interpolation: {
                        escapeValue: false
                    }
                }, (err, t) => {
                    if (err) {
                        console.error('i18next initialization error:', err);
                    }
                    console.log('i18next initialized');
                    resolve(i18nInstance);
                });
            } else {
                setTimeout(checkI18next, 100);
            }
        };
        checkI18next();
    });
}

export async function updateLanguage(lang) {
    if (!i18nInstance) {
        await initI18n();
    }
    return i18nInstance.changeLanguage(lang);
}

export function translate(key) {
    if (!i18nInstance) {
        console.warn('i18next not initialized');
        return key;
    }
    const translation = i18nInstance.t(key);
    if (translation === key) {
        console.warn(`Translation not found for key: ${key}`);
    }
    return translation;
}