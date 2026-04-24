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
  Clock,
  Trash2
} from 'lucide-react'
import { Task, KPI, Deadline } from '@/app/types/database'
import CreateTaskModal from './CreateTaskModal'
import EditTaskModal from './EditTaskModal'
import UploadResolutionModal from './UploadResolutionModal'
import ManageGlobalDocModal from './ManageGlobalDocModal'
import { createClient } from '@/utils/supabase/cliente'
import { useRouter } from 'next/navigation'

interface TaskWithDetails extends Task {
  department?: { name: string }
  responsible?: { first_name: string; last_name: string }
}

interface Props {
  allDocs: { current_status: string; department_id: string }[]
  tasks: TaskWithDetails[]
  deadlines: any[] 
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
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

export default function DashboardClient({ allDocs, tasks, deadlines, userName, userRole, userId, departments, users }: Props) {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [editModalTask, setEditModalTask] = useState<TaskWithDetails | null>(null)
  const [uploadResTask, setUploadResTask] = useState<{id: string, title: string} | null>(null)
  const [downloadMenuTask, setDownloadMenuTask] = useState<TaskWithDetails | null>(null)
  const [globalDocModal, setGlobalDocModal] = useState<{type: 'protocolos' | 'iso', title: string} | null>(null)
  
  const [selectedDept, setSelectedDept] = useState('')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  const kpis = useMemo(() => {
    const filteredDocs = selectedDept ? allDocs.filter(d => d.department_id === selectedDept) : allDocs
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
      const { data, error } = await supabase.storage.from('documents').download(path)
      if (error) throw error
      const url = window.URL.createObjectURL(data)
      const link = document.createElement('a'); link.href = url; link.setAttribute('download', fileName)
      document.body.appendChild(link); link.click(); link.remove()
    } catch (error) { alert('Error al descargar.') } finally { setDownloadingId(null) }
  }

  const handleDeleteTask = async (id: string, title: string) => {
    if (!confirm(`¿Está seguro de eliminar la tarea "${title}"?`)) return
    setDeletingId(id)
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (!error) router.refresh()
    else alert('Error al eliminar.')
    setDeletingId(null)
  }

  return (
    <div className="flex-1 p-4 md:p-8 space-y-8 bg-gray-50 overflow-y-auto text-[#0a2d4d] font-sans">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          {/* Banner Responsivo con Fondo Blueprint */}
          <div className="relative min-h-[16rem] md:h-72 rounded-xl bg-[#0a2d4d] overflow-hidden flex items-center px-8 md:px-12 text-white shadow-xl border-b-4 border-blue-600">
             <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
             <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '100px 100px' }}></div>
             
             <div className="relative z-10 space-y-4 md:space-y-6 max-w-4xl pt-4 py-8 md:py-0">
                <p className="text-[8px] md:text-[10px] font-black tracking-[0.4em] uppercase opacity-60">SISTEMA DE GESTIÓN DE CALIDAD</p>
                <h2 className="text-3xl md:text-[52px] font-black leading-[0.95] md:leading-[0.9] tracking-tighter uppercase">
                   OPTIMIZACIÓN DE<br />PROCESOS
                </h2>
                <div className="flex flex-wrap gap-3 md:gap-4 pt-2">
                   <button 
                    onClick={() => setGlobalDocModal({type: 'protocolos', title: 'PROTOCOLOS OPERATIVOS'})}
                    className="px-6 md:px-8 py-2.5 md:py-3 bg-white text-[#0a2d4d] rounded-xl text-[9px] md:text-[10px] font-black hover:bg-gray-100 transition-all uppercase tracking-widest shadow-xl flex items-center gap-2"
                   >
                     <ShieldCheck size={14} /> REVISAR PROTOCOLOS
                   </button>
                   <button 
                    onClick={() => setGlobalDocModal({type: 'iso', title: 'NORMA ISO 2026'})}
                    className="px-6 md:px-8 py-2.5 md:py-3 bg-transparent border-2 border-white/30 text-white rounded-xl text-[9px] md:text-[10px] font-black hover:bg-white/10 transition-all uppercase tracking-widest flex items-center gap-2"
                   >
                     <FileText size={14} /> Norma ISO 2026
                   </button>
                </div>
             </div>
          </div>

          <div className="space-y-4">
             <div className="flex justify-between items-center px-1">
                <h3 className="text-sm font-black uppercase tracking-widest">Métricas de Rendimiento</h3>
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                   <Filter size={14} className="text-gray-400" />
                   <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="text-[10px] font-black uppercase tracking-widest outline-none bg-transparent cursor-pointer">
                     <option value="">TODOS LOS DEPARTAMENTOS</option>
                     {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                   </select>
                </div>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {kpis.map((kpi, idx) => {
                  const config = metricConfig[kpi.kpi_name] || { icon: FileCheck, color: 'text-gray-600', bg: 'bg-gray-50' }
                  return (
                    <div key={idx} className="p-4 md:p-6 bg-white rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                       <div className="flex justify-between items-start mb-4"><div className={`p-2 rounded-xl ${config.bg}`}><config.icon className={config.color} size={24} /></div></div>
                       <p className="text-2xl md:text-4xl font-black mb-1 tabular-nums">{kpi.value}{kpi.unit}</p>
                       <p className="text-[8px] md:text-[10px] font-bold text-gray-400 tracking-widest uppercase">{kpi.kpi_name}</p>
                    </div>
                  )
                })}
             </div>
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6 flex flex-col h-full">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">PRÓXIMOS VENCIMIENTOS</h3>
                 <Clock size={16} className="text-gray-400" />
              </div>
              <div className="space-y-4 flex-1">
                 {deadlines.map((d, idx) => (
                   <div key={idx} className="flex gap-4 group cursor-pointer" onClick={() => router.push('/documentos')}>
                      <div className="w-1 rounded-full bg-blue-100 group-hover:bg-blue-600 transition-all"></div>
                      <div className="flex-1 bg-gray-50 rounded-xl p-3 md:p-4 flex items-center justify-between hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100">
                         <div className="overflow-hidden mr-2">
                            <p className="text-[7px] md:text-[8px] font-black text-gray-400 uppercase tracking-widest truncate">{d.type}</p>
                            <p className="text-[10px] md:text-xs font-bold uppercase truncate" title={d.name}>{d.name}</p>
                         </div>
                         <div className="text-right flex-shrink-0"><span className="px-2 py-1 rounded-md text-[7px] md:text-[8px] font-black text-[#0a2d4d] uppercase bg-white border border-gray-100">{formatDateChile(d.due_date)}</span></div>
                      </div>
                   </div>
                 ))}
                 {deadlines.length === 0 && (
                   <div className="py-12 text-center space-y-3">
                      <ShieldCheck size={32} className="mx-auto text-green-200" />
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest px-4">Sin vencimientos próximos.</p>
                   </div>
                 )}
              </div>
              <p className="text-[8px] font-bold text-gray-400 uppercase text-center pt-4 italic tracking-widest">Cumplimiento de Metas SGC</p>
           </div>
        </div>
      </div>

      <div className="space-y-6">
         <div className="flex justify-between items-end px-1">
            <h3 className="text-sm font-black uppercase tracking-widest">Panel de Tareas Activas</h3>
            {(userRole === 'admin' || userRole === 'sub_admin') && (
              <button onClick={() => setIsCreateTaskOpen(true)} className="px-4 md:px-6 py-2.5 bg-[#0a2d4d] text-white rounded-xl font-bold text-[9px] md:text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-blue-900 transition-all flex items-center gap-2">
                <Plus size={16} /> NUEVA TAREA
              </button>
            )}
         </div>
         <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                     <tr className="bg-gray-50/50 border-b border-gray-200">
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tarea / Descripción</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Departamento</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Plazo Límite</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Prioridad</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Plantilla</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Respuesta</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-medium text-[#0a2d4d]">
                     {tasks.map((t, idx) => (
                       <tr key={idx} className="hover:bg-gray-50/30 transition-colors group">
                          <td className="px-8 py-6">
                             <p className="text-xs font-black uppercase">{t.title}</p>
                             <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 truncate max-w-[250px]">{t.description || 'Sin descripción'}</p>
                          </td>
                          <td className="px-8 py-6 text-[10px] font-black uppercase text-blue-600">{t.department?.name || 'S/D'}</td>
                          <td className="px-8 py-6 text-center">
                             <p className="text-xs font-black tabular-nums">{formatDateChile(t.due_date)}</p>
                             {t.due_date && <p className="text-[9px] text-gray-400 font-bold tabular-nums uppercase">{t.due_date.split('T')[1]?.substring(0,5) || '18:00'} HRS</p>}
                          </td>
                          <td className="px-8 py-6 text-center"><span className="px-3 py-1 rounded-full text-[8px] font-black text-white tracking-widest bg-blue-600 uppercase">{t.priority}</span></td>
                          <td className="px-8 py-6 text-center">
                             <button onClick={() => t.instruction_file_path && handleDownload(t.instruction_file_path, 'Plantilla.pdf', t.id)} disabled={!t.instruction_file_path} className={`p-2 rounded-lg border transition-all ${t.instruction_file_path ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white' : 'bg-gray-50 text-gray-200 border-gray-100 cursor-not-allowed'}`}><Eye size={16} /></button>
                          </td>
                          <td className="px-8 py-6 text-center">
                             <button onClick={() => { if (t.resolution_file_path) handleDownload(t.resolution_file_path, 'Respuesta.pdf', t.id); else if (t.assigned_to_user_id === userId || userRole === 'admin') setUploadResTask({id: t.id, title: t.title}) }} disabled={!t.resolution_file_path && t.assigned_to_user_id !== userId && userRole !== 'admin'} className={`p-2 rounded-lg border transition-all ${t.resolution_file_path ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-600 hover:text-white' : 'bg-gray-50 text-gray-300 border-gray-100'}`}><FileUp size={16} /></button>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {userRole === 'admin' && (
                                  <>
                                    <button onClick={() => setEditModalTask(t)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit3 size={16} /></button>
                                    <button onClick={() => handleDeleteTask(t.id, t.title)} disabled={deletingId === t.id} className="p-1 text-red-600 hover:bg-red-50 rounded">{deletingId === t.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}</button>
                                  </>
                                )}
                             </div>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>

      <CreateTaskModal isOpen={isCreateTaskOpen} onClose={() => setIsCreateTaskOpen(false)} departments={departments} users={users} />
      <EditTaskModal isOpen={!!editModalTask} onClose={() => setEditModalTask(null)} departments={departments} users={users} task={editModalTask} />
      <UploadResolutionModal isOpen={!!uploadResTask} onClose={() => setUploadResTask(null)} taskId={uploadResTask?.id || ''} taskTitle={uploadResTask?.title || ''} />
      {globalDocModal && (
        <ManageGlobalDocModal isOpen={!!globalDocModal} onClose={() => setGlobalDocModal(null)} docType={globalDocModal.type} docTitle={globalDocModal.title} isAdmin={userRole === 'admin'} />
      )}
    </div>
  )
}
