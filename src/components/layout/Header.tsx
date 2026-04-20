'use client'

import React from 'react'
import { Bell, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/utils/supabase/cliente'
import { useRouter, usePathname } from 'next/navigation'

interface Props {
  user: {
    first_name: string
    last_name: string
    role: string
  } | null
}

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Panel de Control', subtitle: 'Resumen operativo del SGC.' },
  '/documentos': { title: 'Matriz de Documentos', subtitle: 'Gestión y control de documentos.' },
  '/personal': { title: 'Registro Personal', subtitle: 'Control centralizado de colaboradores.' },
  '/acceso': { title: 'Control de Acceso', subtitle: 'Gestión de privilegios por departamento.' },
  '/auditoria': { title: 'Registro de Auditoría', subtitle: 'Trazabilidad técnica y cumplimiento.' },
  '/opciones': { title: 'Opciones de Cuenta', subtitle: 'Gestión de seguridad y acceso.' },
}

export default function Header({ user }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const currentPage = pageTitles[pathname] || { title: 'Sistema SGC', subtitle: 'DEFLUV SA' }

  return (
    <header className="flex justify-between items-center px-8 py-6 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-[90]">
      <div>
        <h1 className="text-xl font-black text-[#0a2d4d] uppercase tracking-tight leading-none mb-1">
          {currentPage.title}
        </h1>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {currentPage.subtitle}
        </p>
      </div>
      
      <div className="flex items-center gap-6">
        <button className="relative p-2 text-gray-400 hover:text-[#0a2d4d] transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <button 
          onClick={() => router.push('/opciones')}
          className="p-2 text-gray-400 hover:text-[#0a2d4d] transition-colors"
        >
          <Settings size={20} />
        </button>

        <div className="h-8 w-px bg-gray-200 mx-2"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-[#0a2d4d] uppercase tracking-tighter leading-none mb-0.5">
              {user ? `${user.first_name} ${user.last_name}` : 'Invitado'}
            </p>
            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest text-right">
              {user?.role || 'Visitante'}
            </p>
          </div>
          <div className="group relative">
            <div 
              onClick={() => router.push('/opciones')}
              className="w-10 h-10 rounded-xl bg-[#0a2d4d] flex items-center justify-center overflow-hidden cursor-pointer hover:ring-4 hover:ring-blue-50 transition-all shadow-md"
            >
              <img 
                src={`https://ui-avatars.com/api/?name=${user?.first_name}+${user?.last_name}&background=0a2d4d&color=fff`} 
                alt="Avatar" 
              />
            </div>
            
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2 overflow-hidden translate-y-2 group-hover:translate-y-0">
              <div className="px-4 py-3 border-b border-gray-50 mb-1">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Sesión activa</p>
                 <p className="text-xs font-bold text-[#0a2d4d] truncate">{user?.first_name} {user?.last_name}</p>
              </div>
              <button 
                onClick={() => router.push('/opciones')}
                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-[#0a2d4d] hover:bg-gray-50 rounded-xl transition-colors uppercase tracking-widest"
              >
                <Settings size={16} className="text-gray-400" />
                Mi Perfil
              </button>
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors uppercase tracking-widest"
              >
                <LogOut size={16} />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
