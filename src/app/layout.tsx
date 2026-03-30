import type { Metadata, Viewport } from 'next'
import { Cairo } from 'next/font/google'
import { Providers } from '@/components/Providers'
import './globals.css'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'مساري — نظام تشغيل الحياة',
  description: 'نظام متكامل لإدارة حياتك اليومية',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#050A18',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.variable} font-[family-name:var(--font-cairo)] antialiased bg-[#050A18] text-white`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
