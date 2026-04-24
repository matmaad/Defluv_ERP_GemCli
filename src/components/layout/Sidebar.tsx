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
  LogOut,
  X
} from 'lucide-react'
import { createClient } from '@/utils/supabase/cliente'

const navItems = [
  { name: 'PANEL DE CONTROL', href: '/dashboard', icon: LayoutDashboard },
  { name: 'MATRIZ DE DOCUMENTOS', href: '/documentos', icon: Files },
  { name: 'REGISTRO DE PERSONAL', href: '/personal', icon: Users },
  { name: 'CONTROL DE ACCESO', href: '/acceso', icon: ShieldCheck },
  { name: 'REGISTRO AUDITORÍA', href: '/auditoria', icon: History },
]

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: Props) {
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <aside className={`
      fixed inset-y-0 left-0 w-64 bg-[#0a2d4d] flex flex-col h-full shrink-0 z-50 transition-transform duration-300 transform
      lg:relative lg:translate-x-0 
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* Brand Header */}
      <div className="pt-8 pb-6 px-6 flex flex-col items-center relative">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-white/50 hover:text-white lg:hidden"
        >
          <X size={20} />
        </button>
        <img src="/logo-defluv.png" alt="Logo" className="w-full h-auto brightness-0 invert" />
        <p className="text-[10px] font-black text-[#BEDBFF] uppercase tracking-[0.3em] mt-3 text-center">GESTIÓN DE CALIDAD</p>
      </div>

      {/* Divider */}
      <div className="px-4">
        <div className="h-px bg-white/10 w-full mb-6"></div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => { if (window.innerWidth < 1024) onClose() }}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group ${
                isActive 
                  ? 'bg-[#155DFC] shadow-lg text-white' 
                  : 'text-[#BEDBFF] hover:bg-[#0F3271] hover:text-white'
              }`}
            >
              <item.icon size={18} className="text-[#50A2FF]" />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-white' : 'text-[#BEDBFF]'}`}>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Support and System Section */}
      <div className="px-4 py-6 border-t border-white/10 space-y-1">
        <Link
          href="/defluvot"
          onClick={() => { if (window.innerWidth < 1024) onClose() }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${pathname === '/defluvot' ? 'bg-[#155DFC] text-white shadow-lg' : 'text-green-400 hover:bg-white/10'}`}
        >
          <Bot size={20} className={`${pathname === '/defluvot' ? 'text-white' : 'text-green-400'} group-hover:scale-110 transition-transform`} />
          <span className={`text-[10px] font-bold uppercase tracking-widest ${pathname === '/defluvot' ? 'text-white' : 'text-green-400'}`}>DEFLUVOT (IA)</span>
        </Link>
        <Link
          href="/opciones"
          onClick={() => { if (window.innerWidth < 1024) onClose() }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            pathname === '/opciones' 
              ? 'bg-[#155DFC] text-white shadow-lg' 
              : 'text-[#BEDBFF] hover:bg-[#0F3271] hover:text-white'
          }`}
        >
          <Settings size={20} className={pathname === '/opciones' ? 'text-white' : 'text-[#50A2FF]'} />
          <span className={`text-[10px] font-bold uppercase tracking-widest ${pathname === '/opciones' ? 'text-white' : 'text-[#BEDBFF]'}`}>Opciones</span>
        </Link>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-all group"
        >
          <LogOut size={20} className="text-red-400/40 group-hover:text-red-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}
