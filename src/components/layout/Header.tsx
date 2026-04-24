'use client'

import React, { useState } from 'react'
import { Bell, Settings, User, Menu, LogOut, Shield } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/cliente'

interface Props {
  user: {
    first_name: string
    last_name: string
    role: string
    department_id?: string | null
  } | null
  onMenuClick?: () => void
}

const routeNames: Record<string, string> = {
  '/dashboard': 'Panel de Control',
  '/documentos': 'Matriz de Documentos',
  '/personal': 'REGISTRO DE PERSONAL',
  '/acceso': 'Control de Acceso',
  '/auditoria': 'Registro de Auditoría',
  '/opciones': 'Opciones de Cuenta',
  '/defluvot': 'ASISTENTE INTELIGENTE',
}

const routeSubtitles: Record<string, string> = {
  '/dashboard': 'GESTIÓN DE PROCESOS OPERATIVOS',
  '/documentos': 'GESTIÓN Y CONTROL DE DOCUMENTOS',
  '/personal': 'CONTROL CENTRALIZADO DE EMPLEADOS',
  '/acceso': 'GESTIÓN Y CONTROL DE USUARIOS',
  '/auditoria': 'TRAZABILIDAD TÉCNICA Y CUMPLIMIENTO',
  '/opciones': 'Configuración de Perfil',
  '/defluvot': 'CONSULTAS Y SOPORTE IA',
}

export default function Header({ user, onMenuClick }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  
  const title = routeNames[pathname] || 'Sistema de Gestión'
  const subtitle = routeSubtitles[pathname] || 'Gestión de Procesos Corporativos'

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 shrink-0 z-40 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 text-[#0a2d4d] hover:bg-gray-50 rounded-xl lg:hidden transition-all"
        >
          <Menu size={24} />
        </button>
        
        <div className="flex flex-col">
          <h2 className="text-sm md:text-xl font-black text-[#0a2d4d] uppercase tracking-tighter truncate max-w-[200px] md:max-w-none">{title}</h2>
          <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        <div className="flex items-center gap-1 md:gap-2">
          <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-all relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-all hidden sm:flex">
            <Settings size={20} />
          </button>
        </div>

        <div className="h-8 w-px bg-gray-100 mx-1 md:mx-2"></div>

        <div className="relative">
          <div 
            className="flex items-center gap-3 md:gap-4 cursor-pointer group p-1 rounded-2xl hover:bg-gray-50 transition-all"
            onMouseEnter={() => setShowProfileMenu(true)}
            onMouseLeave={() => setShowProfileMenu(false)}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-[#0a2d4d] uppercase tracking-tight">
                {user ? `${user.first_name} ${user.last_name}` : 'Invitado'}
              </p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">
                {user?.role === 'admin' ? 'ADMINISTRADOR GENERAL' : user?.role.toUpperCase() || 'USUARIO'}
              </p>
            </div>
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#0a2d4d] text-white flex items-center justify-center font-black text-sm shadow-lg shadow-blue-900/20 border-2 border-white overflow-hidden group-hover:scale-105 transition-transform">
              {user ? (
                 <img src={`https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=0a2d4d&color=fff`} alt="Avatar" />
              ) : (
                 <User size={20} />
              )}
            </div>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 animate-in fade-in zoom-in duration-200 z-[100]">
                 <Link 
                  href="/opciones"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#0a2d4d] hover:bg-blue-50 transition-colors"
                 >
                   <Shield size={16} className="text-blue-500" />
                   Mi Cuenta
                 </Link>
                 <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors"
                 >
                   <LogOut size={16} />
                   Cerrar Sesión
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
