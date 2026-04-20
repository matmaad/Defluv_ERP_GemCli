'use client'

import React from 'react'
import { 
  ShieldCheck, 
  FileCheck, 
  AlertTriangle, 
  Bell,
  Settings,
  Info,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Task, KPI, Deadline } from '@/app/types/database'

interface Props {
  kpis: KPI[]
  tasks: Task[]
  deadlines: Deadline[]
  userName: string
}

const metricConfig: Record<string, any> = {
  'Cumplimiento Protocolos': { icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
  'Auditorías Internas': { icon: FileCheck, color: 'text-[#0a2d4d]', bg: 'bg-gray-50' },
  'Alertas de Calidad': { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
}

export default function DashboardClient({ kpis, tasks, deadlines, userName }: Props) {
  return (
    <div className="flex-1 p-8 space-y-8 bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#0a2d4d]">Panel de Control</h1>
          <p className="text-gray-500 text-sm">Gestión y control de todos los documentos del SGC.</p>
        </div>
        <div className="flex items-center gap-6">
           <button className="relative p-2 text-gray-400 hover:text-[#0a2d4d]">
             <Bell size={20} />
             <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
           </button>
           <button className="p-2 text-gray-400 hover:text-[#0a2d4d]">
             <Settings size={20} />
           </button>
           <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-[#0a2d4d]">{userName.toUpperCase()}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Admin</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#0a2d4d] flex items-center justify-center overflow-hidden">
                <img src={`https://ui-avatars.com/api/?name=${userName}&background=0a2d4d&color=fff`} alt="Avatar" />
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="xl:col-span-2 space-y-8">
          {/* Welcome Banner */}
          <div className="relative h-64 rounded-2xl bg-[#0a2d4d] overflow-hidden flex items-center px-12 text-white">
             <div className="relative z-10 space-y-4 max-w-md">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-60">Sistema de Gestión de Calidad</p>
                <h2 className="text-4xl font-bold leading-tight">OPTIMIZACIÓN DE PROCESOS</h2>
                <div className="flex gap-4 pt-2">
                   <button className="px-6 py-2.5 bg-white text-[#0a2d4d] rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors">
                     REVISAR PROTOCOLOS 2024
                   </button>
                   <button className="px-6 py-2.5 border border-white/30 rounded-lg text-xs font-bold hover:bg-white/10 transition-colors">
                     DESCARGAR MATRIZ DE RIESGO
                   </button>
                </div>
             </div>
          </div>

          {/* Metrics Section */}
          <div className="space-y-4">
             <h3 className="text-xl font-bold text-[#0a2d4d]">MÉTRICAS DE RENDIMIENTO</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {kpis.map((kpi, idx) => {
                  const config = metricConfig[kpi.kpi_name] || { icon: FileCheck, color: 'text-gray-600', bg: 'bg-gray-50' }
                  return (
                    <div key={idx} className={`p-6 bg-white rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors`}>
                       <div className="flex justify-between items-start mb-4">
                          <div className={`p-2 rounded-lg ${config.bg}`}>
                             <config.icon className={config.color} size={20} />
                          </div>
                       </div>
                       <p className="text-3xl font-bold text-[#0a2d4d] mb-1">{kpi.value}{kpi.unit}</p>
                       <p className="text-[9px] font-bold text-gray-400 tracking-wider uppercase">{kpi.kpi_name}</p>
                       <div className={`absolute bottom-0 left-0 h-1 ${config.color.replace('text', 'bg')} w-1/2 group-hover:w-full transition-all duration-500`}></div>
                    </div>
                  )
                })}
                {kpis.length === 0 && (
                  <div className="col-span-3 text-center p-12 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 text-sm">
                    No hay métricas disponibles.
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Sidebar (Deadlines) */}
        <div className="space-y-8">
           <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 flex flex-col h-full">
              <h3 className="text-xs font-bold text-[#0a2d4d] uppercase tracking-widest border-b border-gray-100 pb-4">Próximos Vencimientos</h3>
              <div className="space-y-4 flex-1">
                 {deadlines.map((d, idx) => (
                   <div key={idx} className="flex gap-4 group cursor-pointer">
                      <div className={`w-1 rounded-full bg-blue-600 group-hover:w-1.5 transition-all`}></div>
                      <div className="flex-1 bg-gray-50 rounded-xl p-4 flex items-center justify-between hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100">
                         <div>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">{d.type}</p>
                            <p className="text-[10px] font-bold text-[#0a2d4d] uppercase">{d.name}</p>
                         </div>
                         <div className="text-right">
                            <span className={`px-2 py-1 rounded text-[8px] font-bold text-white uppercase bg-blue-600`}>
                               {new Date(d.due_date).toLocaleDateString()}
                            </span>
                         </div>
                      </div>
                   </div>
                 ))}
                 {deadlines.length === 0 && (
                   <p className="text-center text-gray-400 text-xs py-8">No hay vencimientos próximos.</p>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* Task Panel */}
      <div className="space-y-6">
         <h3 className="text-2xl font-bold text-[#0a2d4d]">PANEL DE TAREAS</h3>
         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                     <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tarea</th>
                     <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Departamento</th>
                     <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Plazo</th>
                     <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Prioridad</th>
                     <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {tasks.map((t, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                       <td className="px-8 py-6">
                          <p className="text-xs font-bold text-[#0a2d4d]">{t.title}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{t.description}</p>
                       </td>
                       <td className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase">{t.department_id.slice(0, 8)}</td>
                       <td className="px-8 py-6 text-[10px] text-gray-500 font-medium">{new Date(t.due_date).toLocaleDateString()}</td>
                       <td className="px-8 py-6 text-center">
                          <span className={`px-3 py-1 rounded text-[8px] font-bold text-white tracking-widest bg-blue-600`}>
                             {t.priority.toUpperCase()}
                          </span>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <button className="px-5 py-2 border border-gray-200 rounded-lg text-[10px] font-bold text-[#0a2d4d] hover:bg-white hover:shadow-md transition-all">DETALLES</button>
                       </td>
                    </tr>
                  ))}
                  {tasks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-gray-400 text-sm">
                        No hay tareas pendientes.
                      </td>
                    </tr>
                  )}
               </tbody>
            </table>
            
            {/* Footer Alert */}
            <div className="bg-gray-50/50 p-4 border-t border-gray-100 flex justify-between items-center px-8">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0a2d4d] flex items-center justify-center">
                     <Info size={16} className="text-white" />
                  </div>
                  <div>
                     <p className="text-[10px] font-bold text-[#0a2d4d] uppercase tracking-wider">Información del Sistema</p>
                     <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Sincronizado con base de datos en tiempo real.</p>
                  </div>
               </div>
               <div className="flex items-center gap-6">
                  <X size={14} className="text-gray-300 cursor-pointer hover:text-gray-600" />
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}
