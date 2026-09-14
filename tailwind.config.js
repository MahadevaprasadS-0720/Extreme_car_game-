/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bmw-cyan': '#0099da',
        'bmw-darkblue': '#00205b',
        'bmw-red': '#e0001f',
        'neon-cyan': '#00f2fe',
        'neon-blue': '#4facfe',
        'neon-red': '#ff3366',
        'neon-amber': '#ffaa00',
        'neon-green': '#00ff88',
      },
      fontFamily: {
        racing: ['Chakra Petch', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        redlineFlash: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 16px rgba(255, 0, 51, 0.9))' },
          '50%': { opacity: '0.3', filter: 'drop-shadow(0 0 4px rgba(255, 0, 51, 0.3))' },
        },
        driftPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        }
      },
      animation: {
        redline: 'redlineFlash 0.18s ease-in-out infinite',
        drift: 'driftPulse 0.4s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
