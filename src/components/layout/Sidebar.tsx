'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  ShieldCheck, 
  History, 
  Settings, 
  LifeBuoy,
  Menu,
  X
} from 'lucide-react'

const menuItems = [
  { name: 'Panel de Control', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'MATRIZ DE DOCUMENTOS', icon: FileText, href: '/documentos' },
  { name: 'REGISTRO PERSONAL', icon: Users, href: '/personal' },
  { name: 'CONTROL ACCESO', icon: ShieldCheck, href: '/acceso' },
  { name: 'REGISTRO AUDITORÍA', icon: History, href: '/auditoria' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-8 left-4 z-[110] p-2 bg-[#0a2d4d] text-white rounded-lg shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
        ></div>
      )}

      <aside className={`fixed lg:sticky top-0 left-0 z-[105] w-64 bg-[#0a2d4d] text-white flex flex-col h-screen transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-blue-900/50">
           <div className="mb-3 flex items-center justify-center overflow-hidden h-20">
              <img src="/logo-defluv.png" alt="DEFLUV" className="max-h-full max-w-full object-contain" />
           </div>
           <p className="text-[10px] text-blue-300 font-bold tracking-[0.3em] uppercase opacity-60">Gestión de Calidad</p>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
           {menuItems.map((item) => {
             const isActive = pathname === item.href
             return (
               <Link 
                key={item.name} 
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-5 py-4 rounded-xl text-[10px] font-black tracking-widest transition-all ${isActive ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 translate-x-1' : 'text-blue-200 hover:bg-blue-800/40 hover:text-white hover:translate-x-1'}`}
               >
                 <item.icon size={18} className={isActive ? 'text-white' : 'text-blue-400'} />
                 {item.name}
               </Link>
             )
           })}
        </nav>

        <div className="p-6 border-t border-blue-900/50 space-y-1 bg-blue-950/20">
          <Link 
            href="/opciones"
            className={`flex items-center gap-3 px-5 py-4 text-[10px] font-black text-blue-300 hover:text-white w-full tracking-widest transition-all hover:bg-white/5 rounded-xl ${pathname === '/opciones' ? 'bg-blue-600 text-white shadow-lg' : ''}`}
          >
             <Settings size={18} /> OPCIONES
          </Link>
          <button className="flex items-center gap-3 px-5 py-4 text-[10px] font-black text-blue-300 hover:text-white w-full tracking-widest transition-all hover:bg-white/5 rounded-xl">
             <LifeBuoy size={18} /> SOPORTE
          </button>
        </div>
      </aside>
    </>
  )
}
