import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gsdc: {
          blue: '#0a66c2',
          dark: '#1b1f23',
          green: '#057642',
          orange: '#e87722',
          light: '#f3f6f8',
        },
      },
    },
  },
  plugins: [],
}
export default config
