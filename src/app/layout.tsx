import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FutLegionnaires — Dual-Heritage Football Player Database',
  description:
    'The global database of dual-heritage football players. Built for scouts and federations to discover diaspora talent.',
  openGraph: {
    title: 'FutLegionnaires',
    description: 'Discover dual-heritage football players worldwide.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
