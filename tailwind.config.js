/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        'bg': '#F8F7F4',
        'surface': '#FFFFFF',
        'card': '#FFFFFF',
        'panel': '#F2F0EB',
        'hover': '#EDEAE3',
        'border': '#E0DAD0',
        'border2': '#C8BFA8',
        'gold': '#A8841C',
        'gold-l': '#C9A227',
        'gold-d': '#7A5E10',
        'gold-bg': 'rgba(168,132,28,0.07)',
        'gold-bg2': 'rgba(168,132,28,0.13)',
        'text1': '#1A1714',
        'text2': '#4A4035',
        'text3': '#8A7D68',
        'text4': '#B8AD9A',
        'red': '#B83232',
        'green': '#2D7D4F',
        'blue': '#2358A0',
        'red-bg': 'rgba(184,50,50,0.07)',
        'green-bg': 'rgba(45,125,79,0.07)',
        'blue-bg': 'rgba(35,88,160,0.07)',
        'red-border': 'rgba(184,50,50,0.25)',
        'green-border': 'rgba(45,125,79,0.25)',
        'blue-border': 'rgba(35,88,160,0.25)',
        'red-text': '#7A1A1A',
        'green-text': '#1A5535',
        'blue-text': '#103070',

        // Compatibility aliases for existing calendar and layout components
        'primary': '#7A5E10',
        'primary-gold': '#A8841C',
        'on-primary': '#FFFFFF',
        'on-surface': '#1A1714',
        'on-surface-variant': '#4A4035',
        'outline-variant': '#D1C5B0',
        'surface-container-low': '#F2F0EB',
        'surface-container-lowest': '#FFFFFF',
        'secondary-container': '#FCDCA3',
        'on-secondary-container': '#775F32',
        'agenda-green': '#2D7D4F',
        'agenda-red': '#B83232',
      },
      spacing: {
        'xs': '0.25rem',
        'sm': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.5rem',
        '2xl': '2rem',
        '3xl': '3rem',
      },
      borderRadius: {
        'xs': '2px',
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        'full': '9999px',
      },
      fontFamily: {
        'display': ['EB Garamond', 'Georgia', 'serif'],
        'body': ['DM Sans', 'Manrope', 'sans-serif'],
        'ui': ['Manrope', 'DM Sans', 'sans-serif'],
        'mono': ['Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        'display': '1.5rem',    // 24px
        'h1': '1.25rem',      // 20px
        'h2': '1rem',         // 16px
        'h3': '0.875rem',     // 14px
        'body': '0.8125rem',  // 13px
        'small': '0.75rem',   // 12px
        'xs': '0.6875rem',    // 11px
        'label': '0.625rem',  // 10px
      },
      fontWeight: {
        'light': '300',
        'regular': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
      },
      lineHeight: {
        'tight': '1.2',
        'snug': '1.4',
        'normal': '1.6',
        'relaxed': '1.75',
      },
      letterSpacing: {
        'tight': '-0.01em',
        'normal': '0',
        'wide': '0.05em',
        'wider': '0.08em',
        'widest': '0.14em',
        'label': '0.12em',
        'nav': '0.05em',
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(26,23,20,0.06)',
        'sm': '0 2px 6px rgba(26,23,20,0.08)',
        'md': '0 4px 12px rgba(26,23,20,0.10)',
        'lg': '0 8px 24px rgba(26,23,20,0.12)',
        'xl': '0 16px 48px rgba(26,23,20,0.14)',
        'gold': '0 4px 16px rgba(168,132,28,0.20)',
      },
      zIndex: {
        '1': '1',
        '10': '100', // dropdown
        '20': '200', // sticky
        '30': '300', // modal
        '40': '400', // toast
        '50': '500', // tooltip
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
