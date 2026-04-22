import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import PresenceTracker from '@/components/layout/PresenceTracker'
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

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name, role')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <html lang="es">
      <body className={`${inter.className} flex bg-gray-50 h-screen overflow-hidden`}>
        {user && <PresenceTracker />}
        {user ? (
          <>
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
              <Header user={profile} />
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
          </>
        ) : (
          <main className="flex-1 h-full overflow-y-auto">
            {children}
          </main>
        )}
      </body>
    </html>
  )
}
