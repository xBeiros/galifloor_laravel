import { ref, watch, onMounted, computed } from 'vue';

const STORAGE_KEY = 'darkMode';

// Wende Dark Mode auf das HTML-Element an
const applyDarkMode = (dark: boolean) => {
    if (typeof document !== 'undefined') {
        const html = document.documentElement;
        if (dark) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
    }
};

// Lese Dark Mode aus Local Storage oder System-Präferenz
const getInitialDarkMode = (): boolean => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return false;
    }
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
        return stored === 'true';
    }
    
    // Fallback: System-Präferenz verwenden
    if (typeof window.matchMedia !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    return false;
};

// Erstelle eine reaktive Variable für Dark Mode
const isDark = ref<boolean>(getInitialDarkMode());

// Initialisiere Dark Mode sofort
applyDarkMode(isDark.value);

// Toggle Dark Mode
const toggleDarkMode = () => {
    isDark.value = !isDark.value;
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, String(isDark.value));
    }
    applyDarkMode(isDark.value);
};

// Setze Dark Mode explizit
const setDarkMode = (dark: boolean) => {
    isDark.value = dark;
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, String(dark));
    }
    applyDarkMode(dark);
};

export const useDarkMode = () => {
    onMounted(() => {
        // Synchronisiere mit dem aktuellen Zustand
        const currentDark = getInitialDarkMode();
        if (isDark.value !== currentDark) {
            isDark.value = currentDark;
            applyDarkMode(currentDark);
        }
        
        // Höre auf System-Präferenz-Änderungen (nur wenn keine manuelle Einstellung gespeichert ist)
        if (typeof window !== 'undefined' && typeof window.matchMedia !== 'undefined') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e: MediaQueryListEvent) => {
                if (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === null) {
                    setDarkMode(e.matches);
                }
            };
            mediaQuery.addEventListener('change', handleChange);
            
            return () => {
                mediaQuery.removeEventListener('change', handleChange);
            };
        }
    });

    // Watch für Änderungen
    watch(isDark, (newValue) => {
        applyDarkMode(newValue);
    });

    return {
        isDark: computed(() => isDark.value),
        toggleDarkMode,
        setDarkMode,
    };
};

