'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {children}
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          style: {
            background: '#1F2937',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#fff',
            borderRadius: '12px',
          },
        }}
      />
    </NextThemesProvider>
  )
}
