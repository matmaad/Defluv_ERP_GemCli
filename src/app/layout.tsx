import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import SidebarWrapper from '@/components/layout/SidebarWrapper'
import { createClient } from '@/utils/supabase/server'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DEFLUV - Sistema de Gestión de Calidad',
  description: 'ERP y Repositorio Central de Documentos',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} bg-gray-50 h-full overflow-hidden`}>
        {user ? (
          <SidebarWrapper user={user}>
            {children}
          </SidebarWrapper>
        ) : (
          <main className="flex-1 h-full overflow-y-auto">
            {children}
          </main>
        )}
      </body>
    </html>
  )
}
