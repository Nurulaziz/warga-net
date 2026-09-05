/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        brand: {
          50: '#eff4ff',
          100: '#dbe6fe',
          200: '#bfd3fe',
          300: '#93b4fd',
          400: '#6090fa',
          500: '#2563EB',
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#172554',
        },
        warm: {
          50: '#FFF1DD', // background utama landing (oranye krem terang)
          100: '#EFEEE8',
          200: '#E5E4DC',
          300: '#2B2A25', // garis pemisah — solid gelap (neo-brutalism), jelas di atas bg terang & kartu putih
          border: '#2B2A25',
        },
        ink: {
          DEFAULT: '#151515',
          secondary: '#626262',
          strong: '#171717',
          muted: '#8A8A8A',
        },
        accent: {
          green: '#22C55E',
          orange: '#F59E0B',
        },
        divider: {
          subtle: 'rgba(20,20,20,0.25)',
          component: '#2B2A25',
          section: '#171717',
          footer: '#2B2A25',
        },
        // Neo-brutalism: garis pakai warna solid gelap, ketegasan dibedakan lewat KETEBALAN
        // (border-width), bukan opacity. Ini kunci tampilan tegas ala referensi.
        edge: {
          subtle: 'rgba(20,20,20,0.20)', // garis halus (mis. divider di dalam kartu terang)
          DEFAULT: '#171717', // garis struktural solid
          strong: '#171717', // border tombol & elemen utama (dipadukan border-2)
        },
      },
      fontFamily: {
        display: ['"Archivo Variable"', 'Archivo', 'sans-serif'],
        body: [
          '"Geist Variable"',
          'Geist',
          'system-ui',
          'Avenir',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: ['"Geist Mono Variable"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      spacing: {
        section: '6rem',
        'section-lg': '8rem',
      },
    },
  },
  plugins: [],
};
