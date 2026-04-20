'use client'

import React from 'react'
import { Bell, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/utils/supabase/cliente'
import { useRouter } from 'next/navigation'

interface Props {
  user: {
    first_name: string
    last_name: string
    role: string
  } | null
}

export default function Header({ user }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="flex justify-between items-center p-8 bg-gray-50">
      <div>
        {/* Este espacio puede variar según la página, lo dejamos para el título de la página */}
      </div>
      
      <div className="flex items-center gap-6">
        <button className="relative p-2 text-gray-400 hover:text-[#0a2d4d]">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <button className="p-2 text-gray-400 hover:text-[#0a2d4d]">
          <Settings size={20} />
        </button>

        <div className="h-8 w-px bg-gray-200 mx-2"></div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-[#0a2d4d]">
              {user ? `${user.first_name} ${user.last_name}` : 'Invitado'}
            </p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">
              {user?.role || 'Visitante'}
            </p>
          </div>
          <div className="group relative">
            <div className="w-10 h-10 rounded-lg bg-[#0a2d4d] flex items-center justify-center overflow-hidden cursor-pointer">
              <img 
                src={`https://ui-avatars.com/api/?name=${user?.first_name}+${user?.last_name}&background=0a2d4d&color=fff`} 
                alt="Avatar" 
              />
            </div>
            
            {/* Dropdown Logout */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut size={16} />
                CERRAR SESIÓN
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
