'use client'

import React, { useState } from 'react'
import { 
  ShieldCheck, 
  FileCheck, 
  AlertTriangle, 
  Plus
} from 'lucide-react'
import { Task, KPI, Deadline } from '@/app/types/database'
import CreateTaskModal from './CreateTaskModal'

interface Props {
  kpis: KPI[]
  tasks: Task[]
  deadlines: Deadline[]
  userName: string
  userRole: string
  departments: { id: string; name: string }[]
  users: { id: string; first_name: string; last_name: string; department_id: string | null }[]
}

const metricConfig: Record<string, any> = {
  'Cumplimiento Protocolos': { icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
  'Auditorías Internas': { icon: FileCheck, color: 'text-[#0a2d4d]', bg: 'bg-gray-50' },
  'Alertas de Calidad': { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  'Documentos Totales': { icon: FileCheck, color: 'text-green-600', bg: 'bg-green-50' },
}

const formatDateChile = (dateString: string | null | undefined) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export default function DashboardClient({ kpis, tasks, deadlines, userName, userRole, departments, users }: Props) {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)

  return (
    <div className="flex-1 p-8 space-y-8 bg-gray-50 overflow-y-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-[#0a2d4d] uppercase tracking-tight leading-none mb-1">Panel de Control</h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Resumen operativo del SGC.</p>
        </div>
        {(userRole === 'admin' || userRole === 'sub_admin') && (
          <button 
            onClick={() => setIsCreateTaskOpen(true)}
            className="px-6 py-3 bg-[#0a2d4d] text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-blue-900 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Asignar Tarea
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <div className="relative h-64 rounded-3xl bg-[#0a2d4d] overflow-hidden flex items-center px-12 text-white shadow-xl">
             <div className="relative z-10 space-y-4 max-w-md">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-60">Operaciones DEFLUV SA</p>
                <h2 className="text-4xl font-black leading-tight tracking-tighter">OPTIMIZACIÓN DE PROCESOS</h2>
                <div className="flex gap-4 pt-2">
                   <button className="px-6 py-2.5 bg-white text-[#0a2d4d] rounded-lg text-[10px] font-bold hover:bg-gray-100 transition-colors uppercase tracking-widest">
                     Revisar Protocolos
                   </button>
                </div>
             </div>
          </div>

          <div className="space-y-4">
             <h3 className="text-sm font-black text-[#0a2d4d] uppercase tracking-widest">Métricas de Rendimiento</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {kpis.map((kpi, idx) => {
                  const config = metricConfig[kpi.kpi_name] || { icon: FileCheck, color: 'text-gray-600', bg: 'bg-gray-50' }
                  return (
                    <div key={idx} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                       <div className="flex justify-between items-start mb-4">
                          <div className={`p-2 rounded-xl ${config.bg}`}>
                             <config.icon className={config.color} size={24} />
                          </div>
                       </div>
                       <p className="text-4xl font-black text-[#0a2d4d] mb-1">{kpi.value}{kpi.unit}</p>
                       <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">{kpi.kpi_name}</p>
                    </div>
                  )
                })}
             </div>
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6 flex flex-col h-full">
              <h3 className="text-[10px] font-black text-[#0a2d4d] uppercase tracking-[0.2em] border-b border-gray-100 pb-4">Próximos Vencimientos</h3>
              <div className="space-y-4 flex-1">
                 {deadlines.map((d, idx) => (
                   <div key={idx} className="flex gap-4 group cursor-pointer">
                      <div className={`w-1 rounded-full bg-blue-600 group-hover:w-1.5 transition-all`}></div>
                      <div className="flex-1 bg-gray-50 rounded-2xl p-4 flex items-center justify-between hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100">
                         <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{d.type}</p>
                            <p className="text-xs font-bold text-[#0a2d4d] uppercase">{d.name}</p>
                         </div>
                         <div className="text-right">
                            <span className={`px-2 py-1 rounded-md text-[8px] font-black text-white uppercase bg-blue-600`}>
                               {formatDateChile(d.due_date)}
                            </span>
                         </div>
                      </div>
                   </div>
                 ))}
                 {deadlines.length === 0 && (
                   <p className="text-center text-gray-400 text-xs py-8 font-bold uppercase tracking-widest">Sin vencimientos</p>
                 )}
              </div>
           </div>
        </div>
      </div>

      <div className="space-y-6">
         <h3 className="text-sm font-black text-[#0a2d4d] uppercase tracking-widest">Panel de Tareas Activas</h3>
         <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                     <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tarea</th>
                     <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Plazo</th>
                     <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Prioridad</th>
                     <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {tasks.map((t, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                       <td className="px-8 py-6">
                          <p className="text-xs font-bold text-[#0a2d4d]">{t.title}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{t.description}</p>
                       </td>
                       <td className="px-8 py-6 text-xs font-bold text-gray-500 tabular-nums text-center">{formatDateChile(t.due_date)}</td>
                       <td className="px-8 py-6 text-center">
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black text-white tracking-widest bg-blue-600`}>
                             {t.priority.toUpperCase()}
                          </span>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <button className="px-5 py-2 border border-gray-200 rounded-xl text-[10px] font-bold text-[#0a2d4d] hover:bg-white hover:shadow-md transition-all uppercase tracking-widest">Ver Detalles</button>
                       </td>
                    </tr>
                  ))}
                  {tasks.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center text-gray-400 text-sm font-black uppercase tracking-widest">Sin tareas activas</td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      <CreateTaskModal 
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        departments={departments}
        users={users}
      />
    </div>
  )
}
