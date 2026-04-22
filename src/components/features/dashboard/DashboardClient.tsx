'use client'

import React, { useState, useMemo } from 'react'
import { 
  ShieldCheck, 
  FileCheck, 
  AlertTriangle, 
  Plus,
  Filter,
  Eye,
  Download,
  Loader2,
  Edit3,
  FileUp,
  FileDown,
  X,
  FileText,
  CheckCircle2,
  Clock
} from 'lucide-react'
import { Task, KPI, Deadline } from '@/app/types/database'
import CreateTaskModal from './CreateTaskModal'
import EditTaskModal from './EditTaskModal'
import UploadResolutionModal from './UploadResolutionModal'
import { createClient } from '@/utils/supabase/cliente'
import { useRouter } from 'next/navigation'

interface TaskWithDetails extends Task {
  department?: { name: string }
  responsible?: { first_name: string; last_name: string }
}

interface Props {
  allDocs: { current_status: string; department_id: string }[]
  tasks: TaskWithDetails[]
  deadlines: any[] // Dynamic documents as deadlines
  userName: string
  userRole: string
  userId: string
  departments: { id: string; name: string }[]
  users: { id: string; first_name: string; last_name: string; department_id: string | null }[]
}

const metricConfig: Record<string, any> = {
  'Cumplimiento Protocolos': { icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
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

export default function DashboardClient({ allDocs, tasks, deadlines, userName, userRole, userId, departments, users }: Props) {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [editModalTask, setEditModalTask] = useState<TaskWithDetails | null>(null)
  const [uploadResTask, setUploadResTask] = useState<{id: string, title: string} | null>(null)
  const [downloadMenuTask, setDownloadMenuTask] = useState<TaskWithDetails | null>(null)
  const [selectedDept, setSelectedDept] = useState('')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  // Calculate KPIs dynamically based on filter
  const kpis = useMemo(() => {
    const filteredDocs = selectedDept 
      ? allDocs.filter(d => d.department_id === selectedDept)
      : allDocs

    const totalDocs = filteredDocs.length
    const approvedDocs = filteredDocs.filter(d => d.current_status === 'Aprobado').length
    const complianceRate = totalDocs > 0 ? (approvedDocs / totalDocs) * 100 : 0
    const alertCount = filteredDocs.filter(d => d.current_status === 'Rechazado' || d.current_status === 'No Cumple' || d.current_status === 'Vencido').length

    return [
      { id: '1', kpi_name: 'Cumplimiento Protocolos', value: parseFloat(complianceRate.toFixed(1)), unit: '%' },
      { id: '2', kpi_name: 'Alertas de Calidad', value: alertCount, unit: '' },
      { id: '3', kpi_name: 'Documentos Totales', value: totalDocs, unit: '' },
    ]
  }, [allDocs, selectedDept])

  const handleDownload = async (path: string, fileName: string, taskId: string) => {
    setDownloadingId(taskId)
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(path)

      if (error) throw error

      const url = window.URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Download error:', error)
      alert('Error al descargar el archivo.')
    } finally {
      setDownloadingId(null)
    }
  }

  const handlePreview = async (path: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(path, 60)

      if (error) throw error
      window.open(data.signedUrl, '_blank')
    } catch (error) {
      console.error('Preview error:', error)
      alert('Error al abrir la vista previa.')
    }
  }

  return (
    <div className="flex-1 p-8 space-y-8 bg-gray-50 overflow-y-auto text-[#0a2d4d]">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          {/* Banner */}
          <div className="relative h-64 rounded-xl bg-[#0a2d4d] overflow-hidden flex items-center px-12 text-white shadow-xl border-b-4 border-blue-600">
             <div className="relative z-10 space-y-4 max-w-md">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-60">Operaciones DEFLUV SA</p>
                <h2 className="text-4xl font-black leading-tight tracking-tighter">OPTIMIZACIÓN DE PROCESOS</h2>
                <div className="flex gap-4 pt-2">
                   <button 
                    onClick={() => router.push('/documentos')}
                    className="px-6 py-2.5 bg-white text-[#0a2d4d] rounded-lg text-[10px] font-bold hover:bg-gray-100 transition-colors uppercase tracking-widest shadow-lg"
                   >
                     Revisar Matriz
                   </button>
                </div>
             </div>
          </div>

          {/* Metrics Section */}
          <div className="space-y-4">
             <div className="flex justify-between items-center px-1">
                <h3 className="text-sm font-black uppercase tracking-widest">Métricas de Rendimiento</h3>
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                   <Filter size={14} className="text-gray-400" />
                   <select 
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="text-[10px] font-black uppercase tracking-widest outline-none bg-transparent cursor-pointer"
                   >
                     <option value="">TODOS LOS DEPARTAMENTOS</option>
                     {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                   </select>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {kpis.map((kpi, idx) => {
                  const config = metricConfig[kpi.kpi_name] || { icon: FileCheck, color: 'text-gray-600', bg: 'bg-gray-50' }
                  return (
                    <div key={idx} className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                       <div className="flex justify-between items-start mb-4">
                          <div className={`p-2 rounded-xl ${config.bg}`}>
                             <config.icon className={config.iconColor || config.color} size={24} />
                          </div>
                       </div>
                       <p className="text-4xl font-black mb-1 tabular-nums">{kpi.value}{kpi.unit}</p>
                       <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">{kpi.kpi_name}</p>
                    </div>
                  )
                })}
             </div>
          </div>
        </div>

        {/* Sidebar (Deadlines) */}
        <div className="space-y-8">
           <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 space-y-6 flex flex-col h-full border-t-4 border-t-orange-500">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Cargas Pendientes</h3>
                 <Clock size={16} className="text-orange-500" />
              </div>
              <div className="space-y-4 flex-1">
                 {deadlines.map((d, idx) => (
                   <div key={idx} className="flex gap-4 group cursor-pointer" onClick={() => router.push('/documentos')}>
                      <div className={`w-1 rounded-full bg-orange-400 group-hover:w-1.5 transition-all`}></div>
                      <div className="flex-1 bg-gray-50 rounded-xl p-4 flex items-center justify-between hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100">
                         <div className="overflow-hidden mr-2">
                            <p className="text-[8px] font-black text-orange-600 uppercase tracking-widest truncate">{d.type}</p>
                            <p className="text-xs font-bold uppercase truncate" title={d.name}>{d.name}</p>
                         </div>
                         <div className="text-right flex-shrink-0">
                            <span className={`px-2 py-1 rounded-md text-[8px] font-black text-white uppercase bg-orange-500`}>
                               {formatDateChile(d.due_date)}
                            </span>
                         </div>
                      </div>
                   </div>
                 ))}
                 {deadlines.length === 0 && (
                   <div className="py-12 text-center space-y-3">
                      <ShieldCheck size={32} className="mx-auto text-green-200" />
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest px-4">No hay cargas de documentos pendientes a corto plazo.</p>
                   </div>
                 )}
              </div>
              <p className="text-[8px] font-bold text-gray-400 uppercase text-center pt-4 italic">Mostrando los próximos 10 requerimientos</p>
           </div>
        </div>
      </div>

      {/* Task Section */}
      <div className="space-y-6">
         <div className="flex justify-between items-end">
            <h3 className="text-sm font-black uppercase tracking-widest px-1">Panel de Tareas Activas</h3>
            {(userRole === 'admin' || userRole === 'sub_admin') && (
              <button 
                onClick={() => setIsCreateTaskOpen(true)}
                className="px-6 py-2.5 bg-[#0a2d4d] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-blue-900 transition-all flex items-center gap-2"
              >
                <Plus size={16} /> Asignar Nueva Tarea
              </button>
            )}
         </div>

         <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse min-w-[1100px]">
                  <thead>
                     <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tarea</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Departamento</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Responsable</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Plazo</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Prioridad</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Documentación</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Opciones</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {tasks.map((t, idx) => (
                       <tr key={idx} className="hover:bg-gray-50 transition-colors group text-[#0a2d4d]">
                          <td className="px-8 py-6">
                             <p className="text-xs font-bold uppercase">{t.title}</p>
                             <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 truncate max-w-[200px]" title={t.description}>{t.description || 'Sin descripción'}</p>
                          </td>
                          <td className="px-8 py-6 text-[10px] font-black uppercase text-blue-600">
                             {t.department?.name || 'S/D'}
                          </td>
                          <td className="px-8 py-6 text-[10px] font-black uppercase text-gray-500">
                             {t.responsible ? `${t.responsible.first_name} ${t.responsible.last_name}` : 'SIN ASIGNAR'}
                          </td>
                          <td className="px-8 py-6 text-xs font-bold text-gray-500 tabular-nums text-center">{formatDateChile(t.due_date)}</td>
                          <td className="px-8 py-6 text-center">
                             <span className={`px-3 py-1 rounded-full text-[8px] font-black text-white tracking-widest bg-blue-600`}>
                                {t.priority.toUpperCase()}
                             </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <div className="flex justify-end gap-2 text-gray-300">
                                {t.requires_document && (t.assigned_to_user_id === userId || userRole === 'admin') && !t.resolution_file_path && (
                                   <button 
                                      onClick={() => setUploadResTask({id: t.id, title: t.title})}
                                      className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                                      title="Subir Documento de Respuesta"
                                   >
                                      <FileUp size={16} />
                                   </button>
                                )}
                                {(t.instruction_file_path || t.resolution_file_path) && (
                                   <button 
                                      onClick={() => setDownloadMenuTask(t)}
                                      className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors border border-green-100"
                                      title="Ver/Descargar Documentos"
                                   >
                                      <Download size={16} />
                                   </button>
                                )}
                             </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <div className="flex justify-end gap-2 text-gray-300">
                                {userRole === 'admin' && (
                                  <button 
                                    onClick={() => setEditModalTask(t)}
                                    className="p-1 hover:text-blue-600 transition-colors"
                                    title="Editar Tarea"
                                  >
                                    <Edit3 size={18} />
                                  </button>
                                )}
                                <button className="px-4 py-1.5 border border-gray-200 rounded-lg text-[9px] font-black text-[#0a2d4d] hover:bg-white hover:shadow-md transition-all uppercase tracking-widest">
                                   Detalles
                                </button>
                             </div>
                          </td>
                       </tr>
                     ))}
                     {tasks.length === 0 && (
                       <tr>
                         <td colSpan={7} className="px-8 py-12 text-center text-gray-400 text-sm font-black uppercase tracking-widest">Sin tareas activas</td>
                       </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>

      {/* Download Choice Menu */}
      {downloadMenuTask && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#0a2d4d]/60 backdrop-blur-sm">
           <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden p-8 space-y-6 text-[#0a2d4d]">
              <div className="flex justify-between items-center">
                 <h4 className="text-xs font-black uppercase tracking-widest">Documentación</h4>
                 <button onClick={() => setDownloadMenuTask(null)}><X size={20} className="text-gray-400" /></button>
              </div>
              <div className="space-y-3">
                 {downloadMenuTask.instruction_file_path && (
                    <button 
                       onClick={() => handleDownload(downloadMenuTask.instruction_file_path!, 'Plantilla_Llenado.pdf', downloadMenuTask.id)}
                       className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between hover:bg-blue-50 transition-all group"
                    >
                       <div className="flex items-center gap-3">
                          <FileText className="text-blue-600" size={20} />
                          <span className="text-[10px] font-black uppercase">Plantilla</span>
                       </div>
                       <Download size={14} className="text-gray-300 group-hover:text-blue-600" />
                    </button>
                 )}
                 {downloadMenuTask.resolution_file_path && (
                    <button 
                       onClick={() => handleDownload(downloadMenuTask.resolution_file_path!, 'Respuesta.pdf', downloadMenuTask.id)}
                       className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between hover:bg-green-50 transition-all group"
                    >
                       <div className="flex items-center gap-3">
                          <CheckCircle2 className="text-green-600" size={20} />
                          <span className="text-[10px] font-black uppercase">Resultado</span>
                       </div>
                       <Download size={14} className="text-gray-300 group-hover:text-green-600" />
                    </button>
                 )}
              </div>
           </div>
        </div>
      )}

      <CreateTaskModal isOpen={isCreateTaskOpen} onClose={() => setIsCreateTaskOpen(false)} departments={departments} users={users} />
      <EditTaskModal isOpen={!!editModalTask} onClose={() => setEditModalTask(null)} departments={departments} users={users} task={editModalTask} />
      <UploadResolutionModal isOpen={!!uploadResTask} onClose={() => setUploadResTask(null)} taskId={uploadResTask?.id || ''} taskTitle={uploadResTask?.title || ''} />
    </div>
  )
}
