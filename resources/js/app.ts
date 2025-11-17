import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/vue3';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createApp, DefineComponent, h } from 'vue';
import { createPinia } from 'pinia';
import { ZiggyVue } from '../../vendor/tightenco/ziggy';
import i18n from './i18n';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
const pinia = createPinia();

// Initialisiere Dark Mode vor dem App-Start
const initDarkMode = () => {
    const STORAGE_KEY = 'darkMode';
    const stored = localStorage.getItem(STORAGE_KEY);
    let isDark = false;
    
    if (stored !== null) {
        isDark = stored === 'true';
    } else {
        // Fallback: System-Präferenz verwenden
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    const html = document.documentElement;
    if (isDark) {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
};

// Initialisiere Dark Mode sofort
initDarkMode();

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.vue`,
            import.meta.glob<DefineComponent>('./Pages/**/*.vue')
        ),
    setup({ el, App, props, plugin }) {
        createApp({ render: () => h(App, props) })
            .use(plugin)
            .use(pinia)
            .use(i18n)
            .use(ZiggyVue)
            .mount(el);
    },
    progress: {
        color: '#4B5563',
    },
});
