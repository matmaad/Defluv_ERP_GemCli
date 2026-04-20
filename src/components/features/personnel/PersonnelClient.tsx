'use client'

import React, { useState } from 'react'
import { 
  Filter, 
  Download, 
  UserPlus, 
  ChevronLeft, 
  ChevronRight,
  ShieldAlert,
  FileText,
  UserCircle,
  Plus
} from 'lucide-react'
import { PersonalRecord } from '@/app/types/database'
import AddPersonnelModal from './AddPersonnelModal'

interface Props {
  records: PersonalRecord[]
}

const statusStyles: Record<string, string> = {
  'Vinculado': 'bg-green-100 text-green-700 border-green-200',
  'En Suspensión': 'bg-orange-100 text-orange-700 border-orange-200',
  'Desvinculado': 'bg-red-100 text-red-700 border-red-200',
}

export default function PersonnelClient({ records }: Props) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const stats = [
    { label: 'TOTAL ACTIVOS', value: records.filter(r => r.status === 'Vinculado').length },
    { label: 'EN SUSPENSIÓN', value: records.filter(r => r.status === 'En Suspensión').length },
    { label: 'TOTAL REGISTROS', value: records.length },
  ]

  return (
    <div className="flex-1 p-8 space-y-8 bg-gray-50 overflow-y-auto font-sans text-[#0a2d4d]">
      {/* Summary Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative h-56 rounded-3xl bg-[#0a2d4d] overflow-hidden flex items-center px-12 text-white">
           <div className="absolute inset-0 opacity-10 pointer-events-none">
              <UserCircle className="absolute -right-8 -bottom-8 w-64 h-64 text-white" />
           </div>
           <div className="relative z-10 w-full">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-60 mb-2">Resumen Operativo</p>
              <h2 className="text-4xl font-black mb-8 tracking-tighter">PERSONAL EXTERNO</h2>
              <div className="flex gap-12">
                 {stats.map((s, idx) => (
                   <div key={idx}>
                      <p className="text-4xl font-black">{s.value}</p>
                      <p className="text-[9px] font-bold opacity-60 tracking-[0.1em] uppercase">{s.label}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <div 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col items-center justify-center text-center space-y-4 hover:shadow-md transition-all cursor-pointer group border-b-4 border-b-[#0a2d4d]"
        >
           <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-[#0a2d4d] group-hover:text-white transition-all shadow-inner">
              <UserPlus size={32} />
           </div>
           <div>
              <p className="text-xs font-black uppercase tracking-widest">Nuevo Registro</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Carga individual o masiva</p>
           </div>
        </div>
      </div>

      {/* Personnel Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Listado de Colaboradores</h3>
           <div className="flex gap-2">
              <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all">Exportar Excel</button>
           </div>
        </div>
        <table className="w-full text-left border-collapse text-[#0a2d4d]">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Nombre Completo</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">RUT</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Estado</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Fecha Ingreso</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 font-medium">
            {records.map((p, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-8 py-6">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0a2d4d] flex items-center justify-center text-[10px] font-black uppercase shadow-sm">
                         {p.first_name[0]}{p.last_name[0]}
                      </div>
                      <span className="text-xs font-bold uppercase">{p.first_name} {p.last_name}</span>
                   </div>
                </td>
                <td className="px-8 py-6 text-xs font-bold text-gray-500 tabular-nums tracking-tighter">{p.rut}</td>
                <td className="px-8 py-6 text-center">
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black border ${statusStyles[p.status]} uppercase tracking-widest`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-8 py-6 text-xs font-bold text-gray-400">{new Date(p.entry_date).toLocaleDateString()}</td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-3 text-gray-300">
                    <button className="p-1 hover:text-[#0a2d4d] transition-colors"><FileText size={18} /></button>
                    <button className="p-1 hover:text-blue-600 transition-colors"><Plus size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={5} className="px-8 py-12 text-center text-gray-400 text-sm font-bold uppercase tracking-widest">
                  No hay registros de personal disponibles.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Info Card */}
      <div className="p-8 bg-blue-50 rounded-3xl border border-blue-100 flex gap-6 items-start shadow-inner">
         <ShieldAlert className="text-blue-600 mt-1" size={24} />
         <div className="space-y-1">
            <h4 className="text-xs font-black text-[#0a2d4d] uppercase tracking-widest">Protocolo de Seguridad de Información</h4>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-relaxed">
               La edición de esta matriz está restringida. Cualquier cambio será auditado y registrado bajo el ID del operador actual.
            </p>
         </div>
      </div>

      <AddPersonnelModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  )
}
