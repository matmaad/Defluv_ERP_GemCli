'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Files, 
  Users, 
  ShieldCheck, 
  History, 
  Settings, 
  Bot,
  LogOut
} from 'lucide-react'
import { createClient } from '@/utils/supabase/cliente'

const navItems = [
  { name: 'Panel de Control', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Matriz Documentos', href: '/documentos', icon: Files },
  { name: 'Registro Personal', href: '/personal', icon: Users },
  { name: 'Control Acceso', href: '/acceso', icon: ShieldCheck },
  { name: 'Auditoría', href: '/auditoria', icon: History },
]

export default function Sidebar() {
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <aside className="w-64 bg-[#0a2d4d] flex flex-col h-full shrink-0 z-50">
      <div className="h-20 flex items-center px-6">
        <img src="/logo-defluv.png" alt="Logo" className="h-8 brightness-0 invert" />
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-white text-[#0a2d4d]' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
            >
              <item.icon size={18} />
              <span className="text-sm font-bold">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-6 border-t border-white/10 space-y-1">
        <Link
          href="/auditoria"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-green-400 hover:bg-white/10 transition-all"
        >
          <Bot size={18} />
          <span className="text-sm font-bold">DEFLUVOT (IA)</span>
        </Link>
        <Link
          href="/opciones"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${pathname === '/opciones' ? 'bg-white text-[#0a2d4d]' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
        >
          <Settings size={18} />
          <span className="text-sm font-bold">Opciones</span>
        </Link>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={18} />
          <span className="text-sm font-bold">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}
