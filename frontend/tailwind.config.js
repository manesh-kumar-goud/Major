/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#137fec',
        'primary-dark': '#0b5cb5',
        'accent-lstm': '#10b981',
        'accent-rnn': '#f97316',
        'accent-green': '#00E396',
        'accent-red': '#FF4560',
        'background-light': '#f6f7f8',
        'background-dark': '#101922',
        'surface-dark': '#192633',
        'surface-darker': '#111a22',
        'border-dark': '#233648',
        'text-secondary': '#92adc9',
        'glass-border': 'rgba(255, 255, 255, 0.08)',
        'glass-bg': 'rgba(30, 41, 59, 0.4)',
        'neon-green': '#00ff9d',
        'neon-red': '#ff2a6d',
        'neon-blue': '#00d2ff',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Noto Sans', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(19, 127, 236, 0.15)',
        'glow-green': '0 0 15px rgba(0, 255, 157, 0.3)',
        'glow-red': '0 0 15px rgba(255, 42, 109, 0.3)',
        'glow-blue': '0 0 15px rgba(0, 210, 255, 0.3)',
      },
      backgroundImage: {
        'aura-gradient': 'radial-gradient(circle at top left, rgba(19,127,236,0.15), transparent 40%), radial-gradient(circle at bottom right, rgba(0,227,150,0.05), transparent 40%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #137fec 0deg, #a855f7 180deg, #06b6d4 360deg)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'scroll': 'scroll 40s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}
