'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  FilterX, 
  Download, 
  ArrowLeft, 
  FileText, 
  Bot, 
  Send, 
  Loader2, 
  User,
  Calendar,
  AlertTriangle,
  FileDown,
  Trash2,
  X,
  CheckCircle2,
  Eye
} from 'lucide-react'
import { AuditLog, Document } from '@/app/types/database'
import { analyzeDocument } from '@/app/actions/ai-actions'
import { createClient } from '@/utils/supabase/cliente'
import { useRouter } from 'next/navigation'
import { 
  AlertCircle,
  FileWarning,
  ListRestart
} from 'lucide-react'

import ManageIncidenceModal from './ManageIncidenceModal'

// Mock data for NC History
const mockNCHistory = [
  { id: '1', date: '2026-04-20 10:30', original: 'APROBACIÓN', type: 'NO CONFORMIDAD', status: 'Pendiente' },
  { id: '2', date: '2026-04-21 15:45', original: 'REEMPLAZO', type: 'TRABAJO MAL REALIZADO', status: 'Revisado' },
]

interface AuditLogWithDetails extends AuditLog {
  user?: {
    first_name: string
    last_name: string
  }
}

interface Props {
  initialLogs: AuditLogWithDetails[]
  profiles: { id: string; first_name: string; last_name: string }[]
  userRole: string
}

interface Message {
  role: 'bot' | 'user'
  text: string
  timestamp: string
}

const formatDateTimeChile = (dateString: string | null | undefined) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export default function AuditClient({ initialLogs, profiles, userRole }: Props) {
  const [selectedLog, setSelectedLog] = useState<AuditLogWithDetails | null>(null)
  const [selectedDocData, setSelectedDocData] = useState<Document | null>(null)
  const [activeTab, setActiveTab] = useState<'bitacora' | 'historial'>('bitacora')
  const [isManageModalOpen, setIsManageModalOpen] = useState(false)
  const [managingLog, setManagingLog] = useState<{ id: string, action_type: string, user_name: string } | null>(null)
  
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Bienvenido al asistente de auditoría. ¿En qué puedo ayudarte con este registro?', timestamp: new Date().toLocaleTimeString() }
  ])
  
  const [loading, setLoading] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)
  const [showRetentionWarning, setShowRetentionWarning] = useState(false)
  const [daysUntilDeletion, setDaysUntilDeletion] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()
  const router = useRouter()

  // Filters state
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedAction, setSelectedAction] = useState('')

  useEffect(() => {
    const now = new Date()
    const targetDate = new Date(now.getFullYear(), 0, 5)
    if (now.getMonth() === 11 || (now.getMonth() === 0 && now.getDate() <= 5)) {
      const diffTime = targetDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays >= 0 && diffDays <= 15) {
        setDaysUntilDeletion(diffDays)
        setShowRetentionWarning(true)
      }
    }
  }, [])

  const handleSelectLog = async (log: AuditLogWithDetails) => {
    setSelectedLog(log)
    setMessages([{ role: 'bot', text: `Análisis técnico del evento: ${log.action_type}. ¿Deseas verificar el cumplimiento de este registro?`, timestamp: new Date().toLocaleTimeString() }])
    
    if (log.resource_id) {
      const { data } = await supabase.from('documents').select('*').eq('id', log.resource_id).maybeSingle()
      if (data) setSelectedDocData(data)
    }
  }

  const handleViewDocument = async (resourceId: string) => {
    // Attempt to find document storage path
    const { data } = await supabase.from('documents').select('storage_path').eq('id', resourceId).maybeSingle()
    if (data?.storage_path) {
      const { data: signed } = await supabase.storage.from('documents').createSignedUrl(data.storage_path, 60)
      if (signed?.signedUrl) window.open(signed.signedUrl, '_blank')
    } else {
      alert('Archivo físico no disponible para este registro.')
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm('¿Borrar todos los registros? Esta acción es irreversible.')) return
    setDeletingAll(true)
    try {
      const { error } = await supabase.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000') 
      if (!error) { alert('Bitácora vaciada.'); router.refresh() }
    } finally { setDeletingAll(false) }
  }

  const clearFilters = () => {
    setFechaDesde('')
    setFechaHasta('')
    setSelectedUser('')
    setSelectedAction('')
  }

  const exportToCSV = (type: string) => {
    const headers = ['TIMESTAMP', 'USUARIO', 'ACCIÓN', 'DOCUMENTO', 'DESCRIPCIÓN']
    const csvData = filteredLogs.map(log => [
      formatDateTimeChile(log.timestamp),
      log.user ? `${log.user.first_name} ${log.user.last_name}` : 'SISTEMA',
      log.action_type.toUpperCase(),
      log.resource_id,
      log.justification || ''
    ])
    const csvContent = [headers, ...csvData].map(e => e.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `auditoria_${type}_${new Date().toISOString().split('T')[0]}.csv`)
    link.click()
  }

  const filteredLogs = initialLogs.filter(log => {
    if (fechaDesde && new Date(log.timestamp) < new Date(fechaDesde)) return false
    if (fechaHasta && new Date(log.timestamp) > new Date(fechaHasta)) return false
    if (selectedUser && log.user_id !== selectedUser) return false
    if (selectedAction && log.action_type !== selectedAction) return false
    return true
  })

  return (
    <div className="flex-1 p-8 space-y-8 bg-gray-50 overflow-y-auto font-sans text-[#0a2d4d]">
      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('bitacora')}
          className={`px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'bitacora' ? 'border-[#0a2d4d] text-[#0a2d4d]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Bitácora de Auditoría
        </button>
        <button 
          onClick={() => setActiveTab('historial')}
          className={`px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'historial' ? 'border-[#0a2d4d] text-[#0a2d4d]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Historial No Conformidades
        </button>
      </div>

      {showRetentionWarning && activeTab === 'bitacora' && (
        <div className="bg-orange-50 border border-orange-100 px-8 py-3 flex items-center justify-between rounded-xl mb-4 shadow-sm">
           <div className="flex items-center gap-3 text-orange-600">
              <AlertTriangle size={20} />
              <p className="text-[10px] font-black uppercase tracking-widest">
                 Borrado Programado: Registros antiguos se eliminarán en {daysUntilDeletion} días.
              </p>
           </div>
           <button onClick={() => setShowRetentionWarning(false)} className="text-orange-400 hover:text-orange-600"><X size={18} /></button>
        </div>
      )}

      {!selectedLog ? (
        <div className="space-y-6">
           {activeTab === 'bitacora' ? (
             <>
               <div className="flex justify-end gap-3">
                  {userRole === 'admin' && (
                    <button 
                      onClick={handleDeleteAll}
                      disabled={deletingAll}
                      className="flex items-center gap-2 px-6 py-2.5 bg-white border border-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all shadow-sm disabled:opacity-50"
                    >
                       {deletingAll ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} 
                       Eliminar Registro
                    </button>
                  )}
                  <button onClick={() => exportToCSV('mensual')} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] font-black text-[#0a2d4d] uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm">
                     <FileDown size={14} className="text-blue-600" /> Informe Mensual
                  </button>
                  <button onClick={() => exportToCSV('completo')} className="flex items-center gap-2 px-6 py-2.5 bg-[#0a2d4d] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/20">
                     <Download size={14} /> Exportar CSV
                  </button>
               </div>

               <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-wrap gap-6 p-6 items-end">
                  <div className="space-y-1.5 flex-1 min-w-[150px]">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Fecha Desde</label>
                     <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold text-zinc-900 outline-none" />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-[150px]">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Fecha Hasta</label>
                     <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold text-zinc-900 outline-none" />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-[150px]">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Usuario</label>
                     <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-black text-[#0a2d4d] outline-none">
                        <option value="">Todos los usuarios</option>
                        {profiles.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                     </select>
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-[150px]">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Acción</label>
                     <select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-black text-[#0a2d4d] outline-none">
                        <option value="">Todas las acciones</option>
                        <option value="REEMPLAZO">REEMPLAZO</option>
                        <option value="APROBACIÓN">APROBACIÓN</option>
                        <option value="VALIDACIÓN">VALIDACIÓN</option>
                        <option value="CREACIÓN">CREACIÓN</option>
                        <option value="ELIMINACIÓN">ELIMINACIÓN</option>
                     </select>
                  </div>
                  <button onClick={clearFilters} className="px-6 py-2.5 bg-white border border-gray-200 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center gap-2 h-[42px]">
                     <FilterX size={16} /> Limpiar Filtros
                  </button>
               </div>

               <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse table-fixed">
                     <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 uppercase text-gray-400 font-black text-[10px] tracking-widest">
                           <th className="px-8 py-4 w-48">TIMESTAMP</th>
                           <th className="px-8 py-4 w-56">USUARIO</th>
                           <th className="px-8 py-4 w-40">ACCIÓN</th>
                           <th className="px-8 py-4 w-auto">DESCRIPCIÓN</th>
                           <th className="px-8 py-4 w-40 text-center">GESTIÓN</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 font-medium">
                        {filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50 transition-colors group">
                             <td className="px-8 py-4 text-[11px] font-bold text-gray-400 tabular-nums">{formatDateTimeChile(log.timestamp)}</td>
                             <td className="px-8 py-4 text-xs font-black uppercase text-[#0a2d4d]">{log.user ? `${log.user.first_name} ${log.user.last_name}` : 'SISTEMA'}</td>
                             <td className="px-8 py-4 text-xs font-black">
                                <span className={log.action_type.includes('APROB') || log.action_type.includes('VALID') ? 'text-green-600' : log.action_type.includes('REEMP') || log.action_type.includes('ELIMIN') ? 'text-red-600' : 'text-blue-600'}>
                                   {log.action_type.toUpperCase()}
                                </span>
                             </td>
                             <td className="px-8 py-4" onClick={() => handleSelectLog(log)}>
                                <p className="text-[11px] text-gray-500 italic truncate cursor-pointer hover:text-[#0a2d4d]">{log.justification || 'Ver detalles técnicos...'}</p>
                             </td>
                             <td className="px-8 py-4 text-center">
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    // Sanitize data before passing to modal
                                    setManagingLog({
                                      id: log.id,
                                      action_type: log.action_type,
                                      user_name: log.user ? `${log.user.first_name} ${log.user.last_name}` : 'SISTEMA'
                                    }); 
                                    setIsManageModalOpen(true); 
                                  }}
                                  className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-[#0a2d4d] hover:text-white transition-all shadow-sm"
                                  title="Gestionar No Conformidad"
                                >
                                   <FileWarning size={16} />
                                </button>
                             </td>
                          </tr>
                        ))}                     </tbody>
                  </table>
               </div>
             </>
           ) : (
             <div className="space-y-6">
                <div className="flex justify-between items-center px-1">
                   <h3 className="text-sm font-black uppercase tracking-widest">Control de Calidad e Incidencias</h3>
                   <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] font-black text-[#0a2d4d] uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm">
                      <Download size={14} /> Descargar Historial NC
                   </button>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="bg-gray-50 border-b border-gray-100 uppercase text-gray-400 font-black text-[10px] tracking-widest">
                            <th className="px-8 py-4">FECHA REPORTE</th>
                            <th className="px-8 py-4">ACCIÓN ORIGINAL</th>
                            <th className="px-8 py-4">TIPO INCIDENCIA</th>
                            <th className="px-8 py-4">ESTADO</th>
                            <th className="px-8 py-4 text-right">ACCIONES</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 font-medium">
                         {mockNCHistory.map((nc) => (
                           <tr key={nc.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-8 py-4 text-[11px] font-bold text-gray-400 tabular-nums">{nc.date}</td>
                              <td className="px-8 py-4 text-xs font-black uppercase text-[#0a2d4d]">{nc.original}</td>
                              <td className="px-8 py-4 text-xs font-black">
                                 <span className={nc.type === 'NO CONFORMIDAD' ? 'text-red-600' : 'text-orange-600'}>
                                    {nc.type}
                                 </span>
                              </td>
                              <td className="px-8 py-4 text-[10px] font-black">
                                 <span className="px-2 py-1 bg-gray-100 rounded-md uppercase tracking-wider">{nc.status}</span>
                              </td>
                              <td className="px-8 py-4 text-right">
                                 <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><ListRestart size={16} /></button>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
           )}
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden border-t border-gray-100">
           <div className="flex-1 flex flex-col bg-gray-100 relative">
              <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center px-12">
                 <span className="text-xs font-black text-[#0a2d4d] uppercase tracking-widest">Análisis de Registro</span>
              </div>
              <div className="flex-1 p-12 overflow-y-auto flex justify-center bg-gray-200/50">
                 <div className="w-[600px] h-fit min-h-[400px] bg-white shadow-2xl rounded-xl border border-gray-100 p-12 space-y-8">
                    <div className="flex justify-between items-start border-b border-gray-100 pb-8">
                       <div className="space-y-2">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trazabilidad Técnica</p>
                          <h4 className="text-2xl font-black text-[#0a2d4d] uppercase">{selectedLog.action_type}</h4>
                       </div>
                       <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                          <FileText size={32} />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8 text-[#0a2d4d]">
                       <div className="space-y-1"><p className="text-[9px] font-black text-gray-400 uppercase">Fecha y Hora</p><p className="text-xs font-bold">{formatDateTimeChile(selectedLog.timestamp)}</p></div>
                       <div className="space-y-1"><p className="text-[9px] font-black text-gray-400 uppercase">Operador</p><p className="text-xs font-bold uppercase">{selectedLog.user ? `${selectedLog.user.first_name} ${selectedLog.user.last_name}` : 'SISTEMA'}</p></div>
                       <div className="col-span-2 space-y-1"><p className="text-[9px] font-black text-gray-400 uppercase">Descripción</p><p className="text-xs font-medium leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100 italic">{selectedLog.justification || 'Sin descripción adicional.'}</p></div>
                    </div>
                 </div>
              </div>
              <div className="bg-[#0a2d4d] p-6 flex justify-end items-center px-12">
                 <button onClick={() => {setSelectedLog(null); setSelectedDocData(null)}} className="px-8 py-3 bg-white text-[#0a2d4d] hover:bg-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl">
                    <CheckCircle2 size={16} /> Finalizar Análisis
                 </button>
              </div>
           </div>
        </div>
      )}
      <ManageIncidenceModal 
        isOpen={isManageModalOpen} 
        onClose={() => { setIsManageModalOpen(false); setManagingLog(null); }} 
        log={managingLog} 
      />
    </div>
  )
}
