'use client'

import React from 'react'
import { 
  Filter, 
  Download, 
  FileUp, 
  UserPlus, 
  ChevronLeft, 
  ChevronRight,
  ShieldAlert,
  FileText,
  UserCircle,
  Plus
} from 'lucide-react'
import { PersonalRecord } from '@/app/types/database'

interface Props {
  records: PersonalRecord[]
}

const statusStyles: Record<string, string> = {
  'Vinculado': 'bg-green-100 text-green-700 border-green-200',
  'En Suspensión': 'bg-orange-100 text-orange-700 border-orange-200',
  'Desvinculado': 'bg-red-100 text-red-700 border-red-200',
}

export default function PersonnelClient({ records }: Props) {
  const stats = [
    { label: 'TOTAL ACTIVOS', value: records.filter(r => r.status === 'Vinculado').length },
    { label: 'EN SUSPENSIÓN', value: records.filter(r => r.status === 'En Suspensión').length },
    { label: 'TOTAL REGISTROS', value: records.length },
  ]

  return (
    <div className="flex-1 p-8 space-y-8 bg-gray-50 overflow-y-auto font-sans">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[#0a2d4d]">Registro Personal</h1>
          <p className="text-gray-500 text-sm">Gestión y control de la matriz de personal de obra.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-[#0a2d4d]">USUARIO SISTEMA</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Admin</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
            <img src="https://ui-avatars.com/api/?name=User&background=0a2d4d&color=fff" alt="User" />
          </div>
        </div>
      </div>

      {/* Summary Banner & Bulk Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative h-56 rounded-2xl bg-[#0a2d4d] overflow-hidden flex items-center px-12 text-white">
           <div className="absolute inset-0 opacity-10 pointer-events-none">
              <UserCircle className="absolute -right-8 -bottom-8 w-64 h-64 text-white" />
           </div>
           <div className="relative z-10 w-full">
              <p className="text-[10px] font-bold tracking-widest uppercase opacity-60 mb-2">Resumen de Matriz</p>
              <h2 className="text-4xl font-bold mb-8">PERSONAL EXTERNO</h2>
              <div className="flex gap-12">
                 {stats.map((s, idx) => (
                   <div key={idx}>
                      <p className="text-3xl font-bold">{s.value}</p>
                      <p className="text-[9px] font-bold opacity-60 tracking-wider uppercase">{s.label}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 flex flex-col items-center justify-center text-center space-y-4 hover:border-blue-400 transition-colors cursor-pointer group">
           <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-blue-50 transition-colors">
              <FileUp className="text-gray-400 group-hover:text-blue-600" size={28} />
           </div>
           <div>
              <p className="text-xs font-bold text-[#0a2d4d] uppercase tracking-wider">Carga Masiva</p>
              <p className="text-[10px] text-gray-400 font-medium">Sube archivos .csv o .xlsx para actualizar la matriz.</p>
           </div>
           <button className="px-6 py-2 bg-[#0a2d4d] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-900 transition-colors">
              Seleccionar Archivo
           </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
           <button className="px-6 py-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
              <Filter size={14} /> Filtrar
           </button>
           <button className="px-6 py-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
              <Download size={14} /> Exportar
           </button>
        </div>
        <button className="p-2.5 bg-[#0a2d4d] text-white rounded-lg shadow-lg shadow-blue-900/20 hover:scale-105 transition-transform">
           <UserPlus size={18} />
        </button>
      </div>

      {/* Personnel Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nombre</th>
              <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Apellido</th>
              <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">RUT</th>
              <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fecha Ingreso</th>
              <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Estado</th>
              <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {records.map((p, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-8 py-6 text-xs font-bold text-[#0a2d4d]">{p.first_name}</td>
                <td className="px-8 py-6 text-xs font-bold text-gray-700">{p.last_name}</td>
                <td className="px-8 py-6 text-xs font-medium text-gray-500 tabular-nums">{p.rut}</td>
                <td className="px-8 py-6 text-xs font-medium text-gray-500">{new Date(p.entry_date).toLocaleDateString()}</td>
                <td className="px-8 py-6 text-center">
                  <span className={`px-3 py-1 rounded text-[8px] font-bold border ${statusStyles[p.status]} uppercase tracking-widest whitespace-nowrap`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-3 text-gray-400">
                    <button className="p-1 hover:text-[#0a2d4d] transition-colors"><FileText size={18} /></button>
                    <button className="p-1 hover:text-[#0a2d4d] transition-colors"><Plus size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={6} className="px-8 py-12 text-center text-gray-400 text-sm">
                  No hay registros de personal.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Footer info */}
        <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mostrando {records.length} registros</span>
           <div className="flex gap-1">
              <button className="p-1 rounded bg-white border border-gray-200 text-gray-400"><ChevronLeft size={16} /></button>
              <button className="p-1 rounded bg-white border border-gray-200 text-gray-400"><ChevronRight size={16} /></button>
           </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="p-6 bg-blue-50 rounded-2xl border-l-4 border-blue-600 flex gap-6 items-start">
         <ShieldAlert className="text-blue-600 mt-1" size={24} />
         <div className="space-y-1">
            <h4 className="text-xs font-bold text-[#0a2d4d] uppercase tracking-wider">Nota sobre seguridad de la información</h4>
            <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
               De acuerdo a las políticas de DEFLUV SA, la edición de esta matriz está estrictamente reservada para usuarios autorizados.
            </p>
         </div>
      </div>
    </div>
  )
}
