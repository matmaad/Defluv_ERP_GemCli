'use client'

import React, { useState, useEffect } from 'react'
import { 
  Users, 
  ShieldCheck, 
  Check, 
  Box, 
  Loader2,
  AlertCircle,
  ChevronRight,
  UserPlus
} from 'lucide-react'
import { Profile, Department, Permission } from '@/app/types/database'
import { createClient } from '@/utils/supabase/cliente'
import { useRouter } from 'next/navigation'
import RegisterUserModal from './RegisterUserModal'

interface Props {
  profiles: Profile[]
  departments: Department[]
  permissions: Permission[]
  currentUserRole: string
}

export default function AccessControlClient({ profiles, departments, permissions: initialPermissions, currentUserRole }: Props) {
  const [selectedUser, setSelectedUser] = useState(profiles[0] || null)
  const [localPermissions, setLocalPermissions] = useState<Permission[]>(initialPermissions)
  const [loading, setLoading] = useState(false)
  const [changed, setChanged] = useState(false)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  const handleCheckboxChange = (deptId: string, type: 'can_view' | 'can_edit' | 'can_approve') => {
    if (!selectedUser) return

    setLocalPermissions(prev => {
      const existing = prev.find(p => p.user_id === selectedUser.id && p.department_id === deptId)
      
      if (existing) {
        return prev.map(p => 
          (p.user_id === selectedUser.id && p.department_id === deptId)
            ? { ...p, [type]: !p[type] }
            : p
        )
      } else {
        const newPerm: any = {
          user_id: selectedUser.id,
          department_id: deptId,
          can_view: type === 'can_view',
          can_edit: type === 'can_edit',
          can_approve: type === 'can_approve',
        }
        return [...prev, newPerm]
      }
    })
    setChanged(true)
  }

  const handleSave = async () => {
    if (!selectedUser) return
    setLoading(true)

    try {
      const userPerms = localPermissions.filter(p => p.user_id === selectedUser.id)
      
      const { error } = await supabase
        .from('permissions')
        .upsert(userPerms, { onConflict: 'user_id, department_id' })

      if (error) throw error

      setChanged(false)
      alert('Permisos actualizados correctamente.')
      router.refresh()
    } catch (error) {
      console.error('Error saving permissions:', error)
      alert('Error al guardar los permisos.')
    } finally {
      setLoading(false)
    }
  }

  const getUserPerm = (deptId: string) => {
    return localPermissions.find(p => p.user_id === selectedUser?.id && p.department_id === deptId)
  }

  return (
    <div className="flex-1 p-8 space-y-8 bg-gray-50 overflow-y-auto font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* User Selection */}
        <div className="lg:col-span-3 space-y-6">
           <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                 <Users className="text-gray-400" size={18} />
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-[#0a2d4d]">Usuarios del Sistema</h3>
              </div>
              <div className="p-4 space-y-2">
                 {profiles.map((p) => (
                   <button 
                    key={p.id}
                    onClick={() => {
                      if (changed) {
                        if (!confirm('Tiene cambios sin guardar. ¿Desea cambiar de usuario?')) return
                        setChanged(false)
                      }
                      setSelectedUser(p)
                    }}
                    className={`w-full p-4 rounded-xl flex items-center justify-between transition-all border-2 ${selectedUser?.id === p.id ? 'bg-blue-50 border-[#0a2d4d] shadow-sm' : 'bg-white border-transparent hover:bg-gray-50'}`}
                   >
                      <div className="flex items-center gap-3 text-left">
                         <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-xs ${selectedUser?.id === p.id ? 'bg-[#0a2d4d] text-white' : 'bg-gray-100 text-gray-400'}`}>
                            {p.first_name[0]}{p.last_name[0]}
                         </div>
                         <div>
                            <p className="text-xs font-black uppercase">{p.first_name} {p.last_name}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{p.role}</p>
                         </div>
                      </div>
                      {selectedUser?.id === p.id && <Check size={12} className="text-[#0a2d4d]" />}
                   </button>
                 ))}
              </div>
           </div>

           {currentUserRole === 'admin' && (
              <button 
                onClick={() => setIsRegisterModalOpen(true)}
                className="w-full py-4 bg-white border border-gray-200 rounded-xl flex items-center justify-center gap-3 text-xs font-bold text-[#0a2d4d] uppercase tracking-widest hover:bg-[#0a2d4d] hover:text-white transition-all group shadow-sm"
              >
                <UserPlus className="text-gray-400 group-hover:text-white transition-colors" size={18} />
                Registrar Nuevo Operador
              </button>
           )}
        </div>

        {/* Permission Matrix */}
        <div className="lg:col-span-9 space-y-6">
           <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
                 <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl bg-[#0a2d4d] text-white flex items-center justify-center shadow-lg shadow-blue-900/20">
                       <ShieldCheck size={24} />
                    </div>
                    <div>
                       <h3 className="text-sm font-black uppercase tracking-widest text-[#0a2d4d]">Matriz de Permisos</h3>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                          Editando derechos de: <span className="text-blue-600 font-black">{selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}` : '...'}</span>
                       </p>
                    </div>
                 </div>
                 {changed && (
                    <button 
                      onClick={handleSave}
                      disabled={loading}
                      className="px-8 py-3 bg-[#0a2d4d] rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/20 flex items-center gap-2"
                    >
                       {loading ? <Loader2 size={14} className="animate-spin" /> : 'Guardar Cambios'}
                    </button>
                 )}
              </div>

              <div className="flex-1 overflow-x-auto">
                 <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                       <tr className="bg-gray-50/50 border-b border-gray-100">
                          <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Departamento / Unidad</th>
                          <th className="px-4 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Ver</th>
                          <th className="px-4 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Editar</th>
                          <th className="px-4 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Aprobar</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-medium">
                       {departments.map((d) => {
                         const perm = getUserPerm(d.id)
                         return (
                           <tr key={d.id} className="hover:bg-gray-50/50 transition-colors group">
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-4">
                                    <Box className="text-gray-300 group-hover:text-blue-600 transition-colors" size={20} />
                                    <span className="text-xs font-black uppercase text-[#0a2d4d] tracking-wide">{d.name}</span>
                                 </div>
                              </td>
                              <td className="px-4 py-6 text-center">
                                 <input 
                                  type="checkbox" 
                                  checked={perm?.can_view || false} 
                                  onChange={() => handleCheckboxChange(d.id, 'can_view')}
                                  className="w-5 h-5 rounded-lg border-gray-200 text-[#0a2d4d] focus:ring-[#0a2d4d]/20 cursor-pointer" 
                                 />
                              </td>
                              <td className="px-4 py-6 text-center">
                                 <input 
                                  type="checkbox" 
                                  checked={perm?.can_edit || false} 
                                  onChange={() => handleCheckboxChange(d.id, 'can_edit')}
                                  className="w-5 h-5 rounded-lg border-gray-200 text-[#0a2d4d] focus:ring-[#0a2d4d]/20 cursor-pointer" 
                                 />
                              </td>
                              <td className="px-4 py-6 text-center">
                                 <input 
                                  type="checkbox" 
                                  checked={perm?.can_approve || false} 
                                  onChange={() => handleCheckboxChange(d.id, 'can_approve')}
                                  className="w-5 h-5 rounded-lg border-gray-200 text-[#0a2d4d] focus:ring-[#0a2d4d]/20 cursor-pointer" 
                                 />
                              </td>
                           </tr>
                         )
                       })}
                    </tbody>
                 </table>
              </div>

              <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mostrando {departments.length} departamentos</span>
                 <div className="flex items-center gap-4">
                    <button className="p-1 text-gray-400 hover:text-[#0a2d4d] transition-colors"><ChevronRight size={18} /></button>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <RegisterUserModal 
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
    </div>
  )
}
