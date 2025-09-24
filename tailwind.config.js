/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'display': ['Inter', 'system-ui', 'sans-serif'],
        'accent': ['Inter', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#ff0080',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#00ff80',
          foreground: '#000000',
        },
        accent: {
          DEFAULT: '#8000ff',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: 'rgba(255, 255, 255, 0.1)',
          foreground: '#ffffff',
        },
        card: {
          DEFAULT: 'rgba(255, 255, 255, 0.95)',
          foreground: '#000000',
        },
        border: 'rgba(255, 255, 255, 0.3)',
        background: '#000000',
        foreground: '#ffffff',
      },
      boxShadow: {
        'neon-primary': '0 0 30px rgba(255, 0, 128, 0.8), 0 0 60px rgba(255, 0, 128, 0.4)',
        'neon-secondary': '0 0 30px rgba(0, 255, 128, 0.8), 0 0 60px rgba(0, 255, 128, 0.4)',
        'neon-accent': '0 0 30px rgba(128, 0, 255, 0.8), 0 0 60px rgba(128, 0, 255, 0.4)',
        'rainbow': '0 0 40px rgba(255, 0, 128, 0.6), 0 0 80px rgba(0, 255, 128, 0.4), 0 0 120px rgba(128, 0, 255, 0.3)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        'holographic': '0 0 20px rgba(255, 255, 255, 0.5), 0 0 40px rgba(255, 0, 255, 0.3), 0 0 60px rgba(0, 255, 255, 0.2)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'sparkle': 'sparkle 2s ease-in-out infinite',
        'rainbow': 'rainbow 3s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        sparkle: {
          '0%, 100%': { opacity: '0', transform: 'scale(0)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
        rainbow: {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' },
        },
        glow: {
          '0%': { 'box-shadow': '0 0 20px rgba(255, 255, 255, 0.5)' },
          '100%': { 'box-shadow': '0 0 40px rgba(255, 255, 255, 0.8), 0 0 60px rgba(255, 0, 255, 0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}