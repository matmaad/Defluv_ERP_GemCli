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
  UserPlus,
  Trash2,
  Edit3,
  History,
  Shield
} from 'lucide-react'
import { Profile, Department, Permission } from '@/app/types/database'
import { createClient } from '@/utils/supabase/cliente'
import { useRouter } from 'next/navigation'
import RegisterUserModal from './RegisterUserModal'
import EditUserModal from './EditUserModal'
import { logAction } from '@/utils/audit-helper'
import { deleteUserAction } from '@/app/actions/auth-actions'

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
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [changed, setChanged] = useState(false)
  
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [editModalUser, setEditModalUser] = useState<Profile | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (profiles.length > 0) {
      if (!selectedUser || !profiles.find(p => p.id === selectedUser.id)) {
        setSelectedUser(profiles[0])
      }
    } else {
      setSelectedUser(null)
    }
  }, [profiles])

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

      await logAction(
        'CAMBIO DE PERMISOS',
        'Permisos',
        selectedUser.id,
        { permissions: userPerms },
        `Se actualizaron los permisos para el usuario ${selectedUser.first_name} ${selectedUser.last_name}`
      )

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

  const handleDeleteUser = async (userId: string, name: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (userId === user?.id) {
      alert('No puedes eliminarte a ti mismo.')
      return
    }

    if (!confirm(`¿Está seguro de que desea eliminar permanentemente a ${name}? Esta acción eliminará su acceso y perfil.`)) {
      return
    }

    setDeletingId(userId)
    try {
      const result = await deleteUserAction(userId, name)
      if (result.error) throw new Error(result.error)

      alert('Usuario eliminado correctamente.')
      router.refresh()
    } catch (error: any) {
      alert('Error al eliminar: ' + error.message)
    } finally {
      setDeletingId(null)
    }
  }

  const getUserPerm = (deptId: string) => {
    return localPermissions.find(p => p.user_id === selectedUser?.id && p.department_id === deptId)
  }

  return (
    <div className="flex-1 p-8 space-y-8 bg-gray-50 overflow-y-auto font-sans text-[#0a2d4d]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: User Selection & Card */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                 <Users className="text-gray-400" size={18} />
                 <h3 className="text-[10px] font-black uppercase tracking-widest">Registro de Personal</h3>
              </div>
              <div className="p-4 space-y-3">
                 {profiles.map((p) => (
                   <div key={p.id} className="relative group">
                     <button 
                      onClick={() => {
                        if (changed) {
                          if (!confirm('Tiene cambios sin guardar. ¿Desea cambiar de usuario?')) return
                          setChanged(false)
                        }
                        setSelectedUser(p)
                      }}
                      className={`w-full p-4 pr-16 rounded-xl flex items-center justify-between transition-all border-2 ${selectedUser?.id === p.id ? 'bg-blue-50 border-[#0a2d4d] shadow-sm' : 'bg-gray-50/30 border-transparent hover:bg-gray-50'}`}
                     >
                        <div className="flex items-center gap-3 text-left">
                           <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-xs ${selectedUser?.id === p.id ? 'bg-[#0a2d4d] text-white' : 'bg-white text-gray-400 shadow-sm border border-gray-100'}`}>
                              {p.first_name[0]}{p.last_name[0]}
                           </div>
                           <div className="overflow-hidden">
                              <p className="text-xs font-black uppercase truncate">{p.first_name} {p.last_name}</p>
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter truncate">{p.role === 'admin' ? 'ADMIN SISTEMA' : p.role.toUpperCase()}</p>
                           </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedUser?.id === p.id ? 'bg-[#0a2d4d] border-[#0a2d4d]' : 'bg-white border-gray-200'}`}>
                           {selectedUser?.id === p.id && <Check size={10} className="text-white" />}
                        </div>
                     </button>

                     {currentUserRole === 'admin' && (
                       <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditModalUser(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 size={14} /></button>
                          <button onClick={() => handleDeleteUser(p.id, `${p.first_name} ${p.last_name}`)} disabled={deletingId === p.id} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">{deletingId === p.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}</button>
                       </div>
                     )}
                   </div>
                 ))}
              </div>
           </div>

           {/* Decorative Card (Matches Image) */}
           <div className="relative h-48 rounded-xl bg-[#0a2d4d] overflow-hidden group shadow-xl">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay group-hover:scale-110 transition-transform duration-700"></div>
              <div className="relative p-8 h-full flex flex-col justify-between text-white">
                 <Shield size={32} className="opacity-80" />
                 <div>
                    <h4 className="text-lg font-black leading-tight uppercase">Protocolos de Seguridad Planta</h4>
                    <p className="text-[9px] font-bold opacity-60 uppercase mt-1 tracking-widest text-blue-300">REV: 2026.04.21</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Side: Permission Matrix */}
        <div className="lg:col-span-8 space-y-6">
           <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
                 <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl bg-[#0a2d4d] text-white flex items-center justify-center shadow-lg shadow-blue-900/20">
                       <ShieldCheck size={24} />
                    </div>
                    <div>
                       <h3 className="text-sm font-black uppercase tracking-widest">Matriz de Permisos por Departamento</h3>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                          Editando derechos de: <span className="text-blue-600 font-black">{selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}` : '...'}</span>
                          <span className="ml-1 opacity-60">({selectedUser?.role.toUpperCase()})</span>
                       </p>
                    </div>
                 </div>
                 <div className="flex gap-3">
                    <button onClick={() => setLocalPermissions(initialPermissions)} className="px-6 py-2.5 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">Resetear</button>
                    <button onClick={handleSave} disabled={loading || !changed} className="px-6 py-2.5 bg-[#0a2d4d] rounded-lg text-[10px] font-black text-white uppercase tracking-widest hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/20 disabled:opacity-50">Confirmar Cambios</button>
                 </div>
              </div>

              <div className="flex-1 overflow-x-auto">
                 <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                       <tr className="bg-gray-50/50 border-b border-gray-100">
                          <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Departamento / Unidad</th>
                          <th className="px-4 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Ver</th>
                          <th className="px-4 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Editar</th>
                          <th className="px-4 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Aprobar</th>
                          <th className="px-4 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-20">Logs</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-medium">
                       {departments.map((d) => {
                         const perm = getUserPerm(d.id)
                         return (
                           <tr key={d.id} className="hover:bg-gray-50/50 transition-colors group">
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-4">
                                    <Box className="text-gray-300 group-hover:text-blue-600 transition-colors shadow-inner" size={20} />
                                    <span className="text-xs font-black uppercase text-[#0a2d4d] tracking-wide">{d.name}</span>
                                 </div>
                              </td>
                              <td className="px-4 py-6 text-center">
                                 <input type="checkbox" checked={perm?.can_view || false} onChange={() => handleCheckboxChange(d.id, 'can_view')} className="w-5 h-5 rounded border-gray-200 text-[#0a2d4d] focus:ring-[#0a2d4d]/20 cursor-pointer" />
                              </td>
                              <td className="px-4 py-6 text-center">
                                 <input type="checkbox" checked={perm?.can_edit || false} onChange={() => handleCheckboxChange(d.id, 'can_edit')} className="w-5 h-5 rounded border-gray-200 text-[#0a2d4d] focus:ring-[#0a2d4d]/20 cursor-pointer" />
                              </td>
                              <td className="px-4 py-6 text-center">
                                 <input type="checkbox" checked={perm?.can_approve || false} onChange={() => handleCheckboxChange(d.id, 'can_approve')} className="w-5 h-5 rounded border-gray-200 text-[#0a2d4d] focus:ring-[#0a2d4d]/20 cursor-pointer" />
                              </td>
                              <td className="px-4 py-6 text-center">
                                 <button className="text-gray-300 hover:text-[#0a2d4d] transition-colors" title="Ver Historial de Cambios"><History size={16} /></button>
                              </td>
                           </tr>
                         )
                       })}
                    </tbody>
                 </table>
              </div>

              <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                 <span>Mostrando {departments.length} de {departments.length} departamentos</span>
                 <div className="flex items-center gap-2">
                    <span className="bg-[#0a2d4d] text-white w-6 h-6 flex items-center justify-center rounded-lg shadow-md shadow-blue-900/20 cursor-pointer">1</span>
                    <button className="p-1 hover:text-[#0a2d4d] transition-colors"><ChevronRight size={18} /></button>
                 </div>
              </div>
           </div>

           {currentUserRole === 'admin' && (
              <div className="flex justify-end">
                <button 
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="px-8 py-4 bg-[#0a2d4d] text-white rounded-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/20"
                >
                  <UserPlus size={18} /> Registrar Nuevo Operador
                </button>
              </div>
           )}
        </div>
      </div>

      <RegisterUserModal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} />
      <EditUserModal isOpen={!!editModalUser} onClose={() => setEditModalUser(null)} user={editModalUser} />
    </div>
  )
}
