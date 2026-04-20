// src/components/layout/Sidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  ShieldCheck, 
  History, 
  Settings, 
  LifeBuoy 
} from 'lucide-react'

const menuItems = [
  { name: 'PANEL CONTROL', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'MATRIZ DE DOCUMENTOS', icon: FileText, href: '/documentos' },
  { name: 'REGISTRO PERSONAL', icon: Users, href: '/personal' },
  { name: 'CONTROL ACCESO', icon: ShieldCheck, href: '/acceso' },
  { name: 'REGISTRO AUDITORÍA', icon: History, href: '/auditoria' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-[#0a2d4d] text-white flex flex-col h-screen sticky top-0">
      {/* Logo Area */}
      <div className="p-6 border-b border-blue-900/50">
        <div className="bg-white p-2 rounded-sm mb-2">
          <h1 className="text-[#0a2d4d] font-black text-xl tracking-tighter">DEFLUV</h1>
        </div>
        <p className="text-[10px] text-blue-300 font-bold tracking-widest uppercase">
          Gestión de Calidad
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-md text-xs font-bold transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-blue-200 hover:bg-blue-800/50 hover:text-white'
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-blue-900/50 space-y-1">
        <button className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-blue-300 hover:text-white w-full">
          <Settings size={18} /> OPCIONES
        </button>
        <button className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-blue-300 hover:text-white w-full">
          <LifeBuoy size={18} /> SOPORTE
        </button>
      </div>
    </aside>
  )
}