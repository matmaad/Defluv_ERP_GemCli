// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Sidebar from '@/components/layout/Sidebar'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DEFLUV - Sistema de Gestión de Calidad',
  description: 'ERP y Repositorio Central de Documentos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} flex bg-gray-50 min-h-screen`}>
        <Sidebar />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  )
}