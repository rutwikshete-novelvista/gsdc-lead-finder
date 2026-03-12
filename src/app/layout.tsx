import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GSDC Lead Finder - Partner Research Tool',
  description: 'Automated partner research tool for GSDC marketing team',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
