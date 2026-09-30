// Sistema de diseño AIForge — "tinta y papel"
// Un único acento (carmesí) y una única familia de neutros cálidos.
// Las clases blue-* / gray-* / slate-* existentes se remapean aquí para que
// toda la web adopte la nueva paleta sin tocar la lógica de las páginas.

const ink = {
  50: '#F7F6F3',
  100: '#EFEDE8',
  200: '#E2DFD8',
  300: '#CBC7BE',
  400: '#A29D93',
  500: '#7A756C',
  600: '#5C5850',
  700: '#45423C',
  800: '#2B2926',
  900: '#1B1A18',
  950: '#100F0E',
}

const crimson = {
  50: '#FDF2F3',
  100: '#FBE3E6',
  200: '#F6C6CD',
  300: '#EE9AA6',
  400: '#E26577',
  500: '#D23B51',
  600: '#B8263D',
  700: '#9A1D32',
  800: '#7D1A2C',
  900: '#661827',
  950: '#3A0A13',
}

module.exports = {
  // Los hover: solo se aplican en dispositivos con ratón (evita el hover "pegado" tras tocar en móvil)
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Acento de marca y alias heredados
        brand: crimson,
        blue: crimson,
        primary: crimson,
        accent: crimson,
        // Neutros unificados
        ink,
        gray: ink,
        slate: ink,
        secondary: ink,
        paper: '#F6F4EF',
      },
      fontFamily: {
        sans: ['"Geist Variable"', 'Geist', 'system-ui', 'sans-serif'],
        display: ['"Archivo Variable"', 'Archivo', '"Geist Variable"', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono Variable"', '"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        lg: '0.625rem',
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(43 41 38 / 0.06)',
        DEFAULT: '0 1px 3px 0 rgb(43 41 38 / 0.08), 0 1px 2px -1px rgb(43 41 38 / 0.06)',
        md: '0 4px 12px -2px rgb(43 41 38 / 0.08), 0 2px 4px -2px rgb(43 41 38 / 0.05)',
        lg: '0 12px 28px -8px rgb(43 41 38 / 0.12), 0 4px 8px -4px rgb(43 41 38 / 0.06)',
        xl: '0 24px 48px -16px rgb(43 41 38 / 0.18), 0 8px 16px -8px rgb(43 41 38 / 0.08)',
        '2xl': '0 32px 64px -20px rgb(43 41 38 / 0.25)',
        brand: '0 10px 24px -8px rgb(184 38 61 / 0.45)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
