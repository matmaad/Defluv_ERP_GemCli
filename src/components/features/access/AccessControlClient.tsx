'use client'

import React, { useState } from 'react'
import { 
  Users, 
  ShieldCheck, 
  RotateCcw, 
  Check, 
  UserPlus, 
  ChevronRight,
  History,
  Box,
  BarChart3,
  ShieldAlert,
  Wrench,
  Microscope,
  Truck
} from 'lucide-react'
import { Profile, Department, Permission } from '@/app/types/database'

interface Props {
  profiles: Profile[]
  departments: Department[]
  permissions: Permission[]
}

const iconMap: Record<string, any> = {
  'Bodega': Box,
  'Control de Gestión': BarChart3,
  'Prevención de Riesgos': ShieldAlert,
  'Mantenimiento': Wrench,
  'Laboratorio': Microscope,
  'Logística': Truck,
}

export default function AccessControlClient({ profiles, departments, permissions }: Props) {
  const [selectedUser, setSelectedUser] = useState(profiles[0] || null)

  const userPermissions = permissions.filter(p => p.user_id === selectedUser?.user_id)

  return (
    <div className="flex-1 p-8 space-y-8 bg-gray-50 overflow-y-auto font-sans">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[#0a2d4d]">Control de Acceso</h1>
          <p className="text-gray-500 text-sm">Gestión de permisos y roles de usuario.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar: Personnel Selection */}
        <div className="lg:col-span-3 space-y-6">
           <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                 <Users className="text-gray-400" size={18} />
                 <h3 className="text-xs font-bold text-[#0a2d4d] uppercase tracking-widest">Usuarios</h3>
              </div>
              <div className="p-4 space-y-2">
                 {profiles.map((p) => (
                   <button 
                    key={p.user_id}
                    onClick={() => setSelectedUser(p)}
                    className={`w-full p-4 rounded-xl flex items-center justify-between transition-all border-2 ${selectedUser?.user_id === p.user_id ? 'bg-blue-50 border-blue-600 shadow-md' : 'bg-white border-transparent hover:bg-gray-50'}`}
                   >
                      <div className="flex items-center gap-3 text-left">
                         <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs ${selectedUser?.user_id === p.user_id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-[#0a2d4d]'}`}>
                            {p.first_name[0]}{p.last_name[0]}
                         </div>
                         <div>
                            <p className={`text-xs font-bold ${selectedUser?.user_id === p.user_id ? 'text-blue-700' : 'text-[#0a2d4d]'}`}>{p.first_name} {p.last_name}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase">{p.role}</p>
                         </div>
                      </div>
                      {selectedUser?.user_id === p.user_id && <Check size={12} className="text-blue-600" />}
                   </button>
                 ))}
                 {profiles.length === 0 && <p className="text-center text-gray-400 text-xs py-4">No hay usuarios.</p>}
              </div>
           </div>
        </div>

        {/* Right Content: Permission Matrix */}
        <div className="lg:col-span-9 space-y-6">
           <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                 <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl bg-[#0a2d4d] text-white flex items-center justify-center shadow-lg shadow-blue-900/20">
                       <ShieldCheck size={24} />
                    </div>
                    <div>
                       <h3 className="text-sm font-bold text-[#0a2d4d] uppercase tracking-widest">Matriz de Permisos</h3>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                          Editando derechos de: <span className="text-blue-600 font-black">{selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}` : 'Seleccione un usuario'}</span>
                       </p>
                    </div>
                 </div>
                 <div className="flex gap-3">
                    <button className="px-6 py-2.5 bg-[#0a2d4d] rounded-lg text-[10px] font-bold text-white uppercase tracking-widest hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/20">
                       Confirmar Cambios
                    </button>
                 </div>
              </div>

              <div className="flex-1 overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="bg-gray-50/50 border-b border-gray-100">
                          <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Departamento / Unidad</th>
                          <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Ver</th>
                          <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Editar</th>
                          <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Aprobar</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {departments.map((d) => {
                         const perm = userPermissions.find(p => p.department_id === d.department_id)
                         const Icon = iconMap[d.name] || Box
                         return (
                           <tr key={d.department_id} className="hover:bg-gray-50/50 transition-colors group">
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-4">
                                    <Icon className="text-gray-400 group-hover:text-blue-600 transition-colors" size={20} />
                                    <span className="text-xs font-bold text-[#0a2d4d] uppercase tracking-wider">{d.name}</span>
                                 </div>
                              </td>
                              <td className="px-4 py-6 text-center">
                                 <input type="checkbox" checked={perm?.can_view || false} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                              </td>
                              <td className="px-4 py-6 text-center">
                                 <input type="checkbox" checked={perm?.can_edit || false} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                              </td>
                              <td className="px-4 py-6 text-center">
                                 <input type="checkbox" checked={perm?.can_approve || false} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                              </td>
                           </tr>
                         )
                       })}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
