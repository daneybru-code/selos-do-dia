import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#CC0000',
          orange: '#FF6600',
          yellow: '#FFC200',
          gold: '#F5C518',
          dark: '#0D0D0D',
          card: '#1A1A1A',
        },
      },
    },
  },
  plugins: [],
};

export default config;
