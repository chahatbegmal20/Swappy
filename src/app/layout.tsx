import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers/Providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Swappy - Global Creative Platform',
  description: 'Showcase your art, fashion, body art, and tattoos to the world',
  keywords: ['art', 'fashion', 'tattoos', 'body art', 'creative', 'portfolio'],
  authors: [{ name: 'Swappy' }],
  openGraph: {
    title: 'Swappy - Global Creative Platform',
    description: 'Showcase your art, fashion, body art, and tattoos to the world',
    type: 'website',
    locale: 'en_US',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

