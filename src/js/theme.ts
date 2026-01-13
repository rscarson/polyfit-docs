// Check cookies for theme preference
const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const savedTheme = document.cookie.split('; ').find(row => row.startsWith('theme='))?.split('=')[1];
const theme = savedTheme || (userPrefersDark ? 'dark' : 'light');

const themeMap: { [key: string]: string } = {
    'light': 'default.min.css',
    'dark': 'atom-one-dark.min.css'
};

export function getThemePreference(): string {
    if (theme) {
        return theme;
    } else {
        return userPrefersDark ? 'dark' : 'light';
    }
}

export function setTheme(theme: string) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    const themeStylesheet = document.getElementById('highlight-css') as HTMLLinkElement;
    themeStylesheet.href = `/node_modules/highlight.js/styles/${themeMap[theme]}`;
}

export function saveThemePreference(theme: string) {
    document.cookie = `theme=${theme}; path=/; max-age=31536000`; // 1 year
}

document.addEventListener('DOMContentLoaded', () => {
    const btns = document.getElementsByClassName('theme-btn');
    for (let i = 0; i < btns.length; i++) {
        const element = btns[i];

        element.addEventListener('click', (e) => {
            const target = e.target as HTMLButtonElement;
            const selectedTheme = target.getAttribute('data-theme');
            if (!selectedTheme) return;

            setTheme(selectedTheme);
            saveThemePreference(selectedTheme);
        });
    }

    setTheme(getThemePreference());
});