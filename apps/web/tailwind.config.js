/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F5F5F2',
        surface: '#FFFFFF',
        'surface-muted': '#F0EFEC',
        'surface-border': '#E7E5E4',
        'primary-text': '#292524',
        'secondary-text': '#78716C',
        'muted-text': '#A8A29E',
        primary: {
          50: '#F2F5F4',
          100: '#E2E9E6',
          200: '#C5D3CE',
          300: '#A4B9B1',
          400: '#759489',
          500: '#4F6F64', // Main Primary Sage Green
          600: '#435E55',
          700: '#364D45',
          800: '#2A3C36',
          900: '#1F2C27',
        },
        success: {
          DEFAULT: '#16A36A',
          light: '#E7F7EF',
          dark: '#0E7A4E',
        },
        warning: {
          DEFAULT: '#D97736',
          light: '#FDF1E8',
          dark: '#B35A22',
        },
        danger: {
          DEFAULT: '#DC6464',
          light: '#FDEEEE',
          dark: '#B84545',
        },
        info: {
          DEFAULT: '#6489A6',
          light: '#EEF3F7',
          dark: '#486A84',
        },
        dept: {
          ops: '#F2C9A5',
          tech: '#B8DDE3',
          eng: '#C4DEC5',
          res: '#D6C9E8',
          qa: '#EBC8D3',
          exec: '#E9DCA9',
        },
        // Modern Studio Mission Control Design System Tokens
        studio: {
          bg: 'var(--studio-bg)',
          panel: 'var(--studio-panel)',
          elevated: 'var(--studio-elevated)',
          border: 'var(--studio-border)',
          'border-subtle': 'var(--studio-border-subtle)',
          text: 'var(--studio-text)',
          'text-muted': 'var(--studio-text-muted)',
          status: {
            active: '#34D399',
            waiting: '#FBBF24',
            error: '#F87171',
            thinking: '#60A5FA',
            idle: '#6B7280',
          },
          role: {
            coo: '#F59E0B',
            cto: '#06B6D4',
            swe: '#10B981',
            research: '#6366F1',
            qa: '#EC4899',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
