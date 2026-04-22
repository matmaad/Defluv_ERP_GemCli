'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Users, 
  ShieldCheck, 
  Check, 
  Box, 
  Loader2,
  ChevronRight,
  UserPlus,
  Trash2,
  Edit3,
  Clock,
  Activity,
  Calendar,
  Monitor,
  X,
  Shield,
  Send
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
  const [activeTab, setActiveTab] = useState<'actividad' | 'permisos'>('actividad')
  
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

  const isOnline = (lastSeen?: string) => {
    if (!lastSeen) return false
    const lastSeenDate = new Date(lastSeen)
    const now = new Date()
    const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / 60000
    return diffMinutes <= 2 
  }

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

  const handleSelectAllColumn = (type: 'can_view' | 'can_edit' | 'can_approve') => {
    if (!selectedUser) return
    const currentPerms = departments.map(d => localPermissions.find(p => p.user_id === selectedUser.id && p.department_id === d.id))
    const allSelected = currentPerms.every(p => p?.[type] === true)

    setLocalPermissions(prev => {
      let nextPerms = [...prev]
      departments.forEach(d => {
        const idx = nextPerms.findIndex(p => p.user_id === selectedUser.id && p.department_id === d.id)
        if (idx > -1) {
          nextPerms[idx] = { ...nextPerms[idx], [type]: !allSelected }
        } else {
          nextPerms.push({
            id: '', user_id: selectedUser.id, department_id: d.id,
            can_view: type === 'can_view' ? !allSelected : false,
            can_edit: type === 'can_edit' ? !allSelected : false,
            can_approve: type === 'can_approve' ? !allSelected : false,
            created_at: '', updated_at: ''
          })
        }
      })
      return nextPerms
    })
    setChanged(true)
  }

  const handleSave = async () => {
    if (!selectedUser) return
    setLoading(true)
    try {
      const userPerms = localPermissions.filter(p => p.user_id === selectedUser.id)
      const { error } = await supabase.from('permissions').upsert(userPerms, { onConflict: 'user_id, department_id' })
      if (error) throw error
      await logAction('CAMBIO DE PERMISOS', 'Permisos', selectedUser.id, { permissions: userPerms }, `Se actualizaron los permisos para el usuario ${selectedUser.first_name} ${selectedUser.last_name}`)
      setChanged(false)
      alert('Permisos actualizados correctamente.')
      router.refresh()
    } catch (error) {
      console.error('Error saving permissions:', error)
      alert('Error al guardar los permisos.')
    } finally { setLoading(false) }
  }

  const handleDeleteUser = async (userId: string, name: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (userId === user?.id) { alert('No puedes eliminarte a ti mismo.'); return }
    if (!confirm(`¿Está seguro de que desea eliminar permanentemente a ${name}?`)) return
    setDeletingId(userId)
    try {
      const result = await deleteUserAction(userId, name)
      if (result.error) throw new Error(result.error)
      alert('Usuario eliminado.')
      router.refresh()
    } catch (error: any) { alert('Error al eliminar: ' + error.message) } finally { setDeletingId(null) }
  }

  const getUserPerm = (deptId: string) => {
    return localPermissions.find(p => p.user_id === selectedUser?.id && p.department_id === deptId)
  }

  const formatDateTimeChile = (dateString: string | null | undefined) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  return (
    <div className="flex-1 p-8 space-y-8 bg-gray-50 overflow-y-auto font-sans text-[#0a2d4d]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        
        {/* Left Side: User Selection */}
        <div className="lg:col-span-3 flex flex-col space-y-6">
           {currentUserRole === 'admin' && (
              <button 
                onClick={() => setIsRegisterModalOpen(true)}
                className="w-full py-4 bg-[#0a2d4d] text-white rounded-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/20"
              >
                <UserPlus size={18} /> Registrar Nuevo Usuario
              </button>
           )}

           <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Users className="text-gray-400" size={18} />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-[#0a2d4d]">USUARIOS DEL SISTEMA</h3>
                 </div>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto max-h-[600px]">
                 {profiles.map((p) => (
                   <div key={p.id} className="relative group">
                     <button 
                      onClick={() => { if (changed) { if (!confirm('Tiene cambios sin guardar.')) return; setChanged(false) }; setSelectedUser(p) }}
                      className={`w-full p-4 pr-12 rounded-xl flex items-center justify-between transition-all border-2 ${selectedUser?.id === p.id ? 'bg-blue-50 border-[#0a2d4d] shadow-sm' : 'bg-gray-50/30 border-transparent hover:bg-gray-50'}`}
                     >
                        <div className="flex items-center gap-3 text-left overflow-hidden">
                           <div className="relative flex-shrink-0">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-xs ${selectedUser?.id === p.id ? 'bg-[#0a2d4d] text-white' : 'bg-white text-gray-400 shadow-sm border border-gray-100'}`}>
                                 {p.first_name[0]}{p.last_name[0]}
                              </div>
                              <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${isOnline(p.last_seen_at) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                           </div>
                           <div className="overflow-hidden">
                              <p className="text-xs font-black uppercase truncate">{p.first_name} {p.last_name}</p>
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter truncate">{p.role === 'admin' ? 'ADMIN' : p.role.toUpperCase()}</p>
                           </div>
                        </div>
                     </button>

                     {currentUserRole === 'admin' && (
                       <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg">
                          <button onClick={() => setEditModalUser(p)} className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="Editar"><Edit3 size={14} /></button>
                          <button onClick={() => handleDeleteUser(p.id, `${p.first_name} ${p.last_name}`)} disabled={deletingId === p.id} className="p-1 text-red-600 hover:bg-red-100 rounded disabled:opacity-50" title="Eliminar">{deletingId === p.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}</button>
                       </div>
                     )}
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Right Side: Command Center Details */}
        <div className="lg:col-span-9 space-y-6">
           {selectedUser ? (
             <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
                {/* Header User Detail */}
                <div className="p-8 border-b border-gray-50 bg-gray-50/20 flex justify-between items-center">
                   <div className="flex gap-5 items-center">
                      <div className="w-14 h-14 rounded-2xl bg-[#0a2d4d] text-white flex items-center justify-center shadow-xl shadow-blue-900/20">
                         {activeTab === 'permisos' ? <ShieldCheck size={28} /> : <Activity size={28} />}
                      </div>
                      <div>
                         <h3 className="text-lg font-black uppercase tracking-tight text-[#0a2d4d]">{selectedUser.first_name} {selectedUser.last_name}</h3>
                         <div className="flex items-center gap-3 mt-1">
                            <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-widest">{selectedUser.role}</span>
                            <span className="text-[10px] font-bold text-gray-400">{selectedUser.email}</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-inner">
                      <button onClick={() => setActiveTab('actividad')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'actividad' ? 'bg-white text-[#0a2d4d] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Actividad</button>
                      <button onClick={() => setActiveTab('permisos')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'permisos' ? 'bg-white text-[#0a2d4d] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Permisos</button>
                   </div>
                </div>

                <div className="flex-1 p-0">
                   {activeTab === 'permisos' ? (
                      <div className="flex flex-col h-full">
                         <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[600px] table-fixed">
                               <thead>
                                  <tr className="bg-gray-50 border-b border-gray-100">
                                     <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest w-auto">Departamento / Unidad</th>
                                     <th className="w-24 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center bg-gray-50/50">
                                        <div className="flex flex-col items-center gap-2">
                                           <span>Ver</span>
                                           <button onClick={() => handleSelectAllColumn('can_view')} className="p-1 bg-white border border-gray-200 rounded hover:bg-blue-50 transition-colors" title="Seleccionar Todo"><Check size={10} className="text-blue-600" /></button>
                                        </div>
                                     </th>
                                     <th className="w-24 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                                        <div className="flex flex-col items-center gap-2">
                                           <span>Editar</span>
                                           <button onClick={() => handleSelectAllColumn('can_edit')} className="p-1 bg-white border border-gray-200 rounded hover:bg-blue-50 transition-colors" title="Seleccionar Todo"><Check size={10} className="text-blue-600" /></button>
                                        </div>
                                     </th>
                                     <th className="w-24 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center bg-gray-50/50">
                                        <div className="flex flex-col items-center gap-2">
                                           <span>Aprobar</span>
                                           <button onClick={() => handleSelectAllColumn('can_approve')} className="p-1 bg-white border border-gray-200 rounded hover:bg-blue-50 transition-colors" title="Seleccionar Todo"><Check size={10} className="text-blue-600" /></button>
                                        </div>
                                     </th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-gray-50 font-medium">
                                  {departments.map((d) => {
                                    const perm = getUserPerm(d.id)
                                    return (
                                      <tr key={d.id} className="hover:bg-gray-50/50 transition-colors group">
                                         <td className="px-8 py-3">
                                            <div className="flex items-center gap-4">
                                               <Box className="text-gray-300 group-hover:text-blue-600 transition-colors" size={18} />
                                               <span className="text-[11px] font-black uppercase text-[#0a2d4d] tracking-wide">{d.name}</span>
                                            </div>
                                         </td>
                                         <td className="w-24 py-3 text-center bg-gray-50/20">
                                            <input type="checkbox" checked={perm?.can_view || false} onChange={() => handleCheckboxChange(d.id, 'can_view')} className="w-4 h-4 rounded border-gray-200 text-[#0a2d4d] focus:ring-[#0a2d4d]/20 cursor-pointer" />
                                         </td>
                                         <td className="w-24 py-3 text-center">
                                            <input type="checkbox" checked={perm?.can_edit || false} onChange={() => handleCheckboxChange(d.id, 'can_edit')} className="w-4 h-4 rounded border-gray-200 text-[#0a2d4d] focus:ring-[#0a2d4d]/20 cursor-pointer" />
                                         </td>
                                         <td className="w-24 py-3 text-center bg-gray-50/20">
                                            <input type="checkbox" checked={perm?.can_approve || false} onChange={() => handleCheckboxChange(d.id, 'can_approve')} className="w-4 h-4 rounded border-gray-200 text-[#0a2d4d] focus:ring-[#0a2d4d]/20 cursor-pointer" />
                                         </td>
                                      </tr>
                                    )
                                  })}
                               </tbody>
                            </table>
                         </div>
                         <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                            <button onClick={() => setLocalPermissions(initialPermissions)} className="px-6 py-2.5 bg-white border border-gray-200 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all shadow-sm">Resetear</button>
                            <button onClick={handleSave} disabled={loading || !changed} className="px-8 py-2.5 bg-[#0a2d4d] rounded-lg text-[9px] font-black text-white uppercase tracking-widest hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/20 disabled:opacity-50 flex items-center gap-2">
                               {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Confirmar Cambios
                            </button>
                         </div>
                      </div>
                   ) : (
                      <div className="p-12 space-y-12 h-full overflow-y-auto">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl space-y-3 shadow-inner">
                               <div className="flex items-center gap-2 text-blue-600">
                                  <Monitor size={16} />
                                  <span className="text-[9px] font-black uppercase tracking-widest">Estado Actual</span>
                               </div>
                               <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${isOnline(selectedUser.last_seen_at) ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                  <p className="text-2xl font-black">{isOnline(selectedUser.last_seen_at) ? 'ONLINE' : 'OFFLINE'}</p>
                               </div>
                            </div>
                            <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl space-y-3 shadow-inner">
                               <div className="flex items-center gap-2 text-[#0a2d4d]">
                                  <Calendar size={16} />
                                  <span className="text-[9px] font-black uppercase tracking-widest">Último Ingreso</span>
                               </div>
                               <p className="text-xl font-black">{selectedUser.last_seen_at ? formatDateTimeChile(selectedUser.last_seen_at) : 'SIN REGISTRO'}</p>
                            </div>
                            <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl space-y-3 shadow-inner">
                               <div className="flex items-center gap-2 text-green-600">
                                  <Clock size={16} />
                                  <span className="text-[9px] font-black uppercase tracking-widest">Total Conectado</span>
                               </div>
                               <p className="text-2xl font-black">-- hrs</p>
                            </div>
                         </div>
                         <div className="space-y-4 text-center py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                            <Activity size={48} className="mx-auto text-gray-200" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No hay actividad reciente.</p>
                         </div>
                      </div>
                   )}
                </div>
             </div>
           ) : (
             <div className="h-full flex items-center justify-center bg-white rounded-xl border-2 border-dashed border-gray-200 p-20 text-center">
                <div className="space-y-4">
                   <Users size={64} className="mx-auto text-gray-100" />
                   <p className="text-sm font-black uppercase tracking-widest text-gray-300">Seleccione un usuario para gestionar accesos</p>
                </div>
             </div>
           )}
        </div>
      </div>

      <RegisterUserModal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} departments={departments} />
      <EditUserModal isOpen={!!editModalUser} onClose={() => setEditModalUser(null)} user={editModalUser} />
    </div>
  )
}
