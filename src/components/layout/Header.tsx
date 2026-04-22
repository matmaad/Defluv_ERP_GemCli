'use client'

import React from 'react'
import { Bell, Settings, User } from 'lucide-react'
import { usePathname } from 'next/navigation'

interface Props {
  user: {
    first_name: string
    last_name: string
    role: string
    department_id?: string | null
  } | null
}

const routeNames: Record<string, string> = {
  '/dashboard': 'Panel de Control',
  '/documentos': 'Matriz de Documentos',
  '/personal': 'Gestión de Personal',
  '/acceso': 'Control de Acceso',
  '/auditoria': 'Registro de Auditoría',
  '/opciones': 'Opciones de Cuenta',
}

export default function Header({ user }: Props) {
  const pathname = usePathname()
  const title = routeNames[pathname] || 'Sistema de Gestión'

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0 z-40">
      <div className="flex flex-col">
        <h2 className="text-xl font-black text-[#0a2d4d] uppercase tracking-tighter">{title}</h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">Gestión de Procesos Corporativos</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-all relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-all">
            <Settings size={20} />
          </button>
        </div>

        <div className="h-8 w-px bg-gray-100 mx-2"></div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-[#0a2d4d] uppercase tracking-tight">
              {user ? `${user.first_name} ${user.last_name}` : 'Invitado'}
            </p>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">
              {user?.role === 'admin' ? 'ADMINISTRADOR GENERAL' : user?.role.toUpperCase() || 'USUARIO'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#0a2d4d] text-white flex items-center justify-center font-black text-sm shadow-lg shadow-blue-900/20 border-2 border-white overflow-hidden">
            {user ? (
               <img src={`https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=0a2d4d&color=fff`} alt="Avatar" />
            ) : (
               <User size={20} />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
