'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Filter, 
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
  Printer,
  Maximize2,
  Search,
  CheckCircle
} from 'lucide-react'
import { AuditLog, Document } from '@/app/types/database'
import { analyzeDocument } from '@/app/actions/ai-actions'
import { createClient } from '@/utils/supabase/cliente'
import { useRouter } from 'next/navigation'

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
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
}

export default function AuditClient({ initialLogs, profiles, userRole }: Props) {
  const [selectedLog, setSelectedLog] = useState<AuditLogWithDetails | null>(null)
  const [selectedDocData, setSelectedDocData] = useState<Document | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Bienvenido al asistente de auditoría. ¿En qué puedo ayudarte con este registro?', timestamp: new Date().toLocaleTimeString() }
  ])
  const [input, setInput] = useState('')
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSelectLog = async (log: AuditLogWithDetails) => {
    setSelectedLog(log)
    setMessages([{ role: 'bot', text: `He cargado el registro de auditoría. Es un evento de ${log.action_type}. ¿Tienes dudas sobre este movimiento?`, timestamp: new Date().toLocaleTimeString() }])
    
    if (log.resource_id) {
      const { data } = await supabase.from('documents').select('*').eq('id', log.resource_id).maybeSingle()
      if (data) setSelectedDocData(data)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !selectedLog || loading) return

    const userMsg: Message = { role: 'user', text: input, timestamp: new Date().toLocaleTimeString() }
    setMessages(prev => [...prev, userMsg])
    const currentInput = input
    setInput('')
    setLoading(true)

    try {
      const response = await analyzeDocument(
        selectedDocData?.storage_path || null,
        selectedDocData?.title || selectedLog.resource_id,
        currentInput
      )
      
      const botMsg: Message = { 
        role: 'bot', 
        text: response.text || response.error || 'No pude procesar tu solicitud.', 
        timestamp: new Date().toLocaleTimeString() 
      }
      setMessages(prev => [...prev, botMsg])
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm('Esta acción es irreversible, ¿estás seguro que quieres continuar?')) return
    setDeletingAll(true)
    try {
      const { error } = await supabase.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000') 
      if (error) throw error
      alert('Registros eliminados.')
      router.refresh()
    } catch (error) { alert('Error al eliminar.') } finally { setDeletingAll(false) }
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
      {showRetentionWarning && (
        <div className="bg-orange-50 border-b border-orange-200 px-8 py-3 flex items-center justify-between animate-in slide-in-from-top duration-500 rounded-xl mb-4">
           <div className="flex items-center gap-3">
              <AlertTriangle className="text-orange-600" size={20} />
              <p className="text-xs font-bold text-orange-800 uppercase tracking-widest">
                 Aviso de Seguridad: Los registros de {new Date().getFullYear() - 1} se eliminarán en {daysUntilDeletion} días (05/01). Se recomienda bajar un informe anual.
              </p>
           </div>
           <button onClick={() => setShowRetentionWarning(false)} className="text-orange-400 hover:text-orange-600"><X size={18} /></button>
        </div>
      )}

      {selectedLog && (
        <div className="pt-4">
           <button 
            onClick={() => {setSelectedLog(null); setSelectedDocData(null)}} 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black text-[#0a2d4d] uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm group"
           >
             <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
             Volver al Listado
           </button>
        </div>
      )}

      {!selectedLog ? (
        <div className="space-y-6">
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
              <button onClick={() => exportToCSV('anual')} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] font-black text-[#0a2d4d] uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm">
                 <FileDown size={14} className="text-blue-600" /> Informe Anual
              </button>
              <button onClick={() => exportToCSV('completo')} className="flex items-center gap-2 px-6 py-2.5 bg-[#0a2d4d] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/20">
                 <Download size={14} /> Exportar CSV
              </button>
           </div>

           <div className="bg-white rounded-xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-6 p-6 items-end">
              <div className="space-y-1.5 text-[#0a2d4d]">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha Desde</label>
                 <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-xs font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha Hasta</label>
                 <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-xs font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Usuario</label>
                 <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-xs font-black text-[#0a2d4d] outline-none">
                    <option value="">Todos los usuarios</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                 </select>
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Acción</label>
                 <select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-xs font-black text-[#0a2d4d] outline-none">
                    <option value="">Todas las acciones</option>
                    <option value="REEMPLAZO">REEMPLAZO</option>
                    <option value="APROBACIÓN">APROBACIÓN</option>
                    <option value="CREACIÓN">CREACIÓN</option>
                    <option value="ELIMINACIÓN">ELIMINACIÓN</option>
                 </select>
              </div>
              <button className="h-10 bg-blue-50 text-[#0a2d4d] rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center justify-center gap-2 border border-blue-100">
                 <Filter size={14} /> Filtrar Resultados
              </button>
           </div>

           <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
                 <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 uppercase text-gray-400 font-black text-[10px] tracking-widest">
                       <th className="px-8 py-4 w-48">TIMESTAMP</th>
                       <th className="px-8 py-4 w-56">USUARIO</th>
                       <th className="px-8 py-4 w-40">ACCIÓN</th>
                       <th className="px-8 py-4 w-56">DOCUMENTO</th>
                       <th className="px-8 py-4 w-auto">DESCRIPCIÓN</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50 font-medium">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => handleSelectLog(log)}>
                         <td className="px-8 py-4 text-[11px] font-bold text-gray-400 tabular-nums">{formatDateTimeChile(log.timestamp)}</td>
                         <td className="px-8 py-4 text-xs font-black uppercase">{log.user ? `${log.user.first_name} ${log.user.last_name}` : 'SISTEMA'}</td>
                         <td className="px-8 py-4 text-xs font-black">
                            <span className={log.action_type.includes('APROB') ? 'text-green-600' : log.action_type.includes('REEMP') || log.action_type.includes('ELIMIN') ? 'text-orange-600' : 'text-blue-600'}>
                               {log.action_type.toUpperCase()}
                            </span>
                         </td>
                         <td className="px-8 py-4 text-xs font-bold text-blue-600 underline group-hover:text-blue-800 truncate">{log.resource_id?.slice(0,8)}...</td>
                         <td className="px-8 py-4">
                            <p className="text-[11px] text-gray-500 leading-relaxed italic line-clamp-1">{log.justification || 'Sin descripción.'}</p>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
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
                       <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                          <FileText size={32} />
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8 text-[#0a2d4d]">
                       <div className="space-y-1">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Fecha y Hora</p>
                          <p className="text-xs font-bold">{formatDateTimeChile(selectedLog.timestamp)}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Operador Responsable</p>
                          <p className="text-xs font-bold uppercase">{selectedLog.user ? `${selectedLog.user.first_name} ${selectedLog.user.last_name}` : 'SISTEMA'}</p>
                       </div>
                       <div className="col-span-2 space-y-1">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Descripción del Evento</p>
                          <p className="text-xs font-medium leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100 italic">{selectedLog.justification || 'No se proporcionó descripción adicional.'}</p>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="bg-[#0a2d4d] p-6 flex justify-end items-center px-12">
                 <button 
                  onClick={() => {setSelectedLog(null); setSelectedDocData(null)}} 
                  className="px-8 py-3 bg-white text-[#0a2d4d] hover:bg-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl"
                 >
                    <CheckCircle2 size={16} /> Finalizar Análisis
                 </button>
              </div>
           </div>

           <div className="w-[450px] bg-white border-l border-gray-100 flex flex-col shadow-2xl relative z-10">
              <div className="p-8 border-b border-gray-50 flex items-center gap-4 bg-gray-50/50 text-[#0a2d4d]">
                 <div className="w-12 h-12 rounded-xl bg-[#0a2d4d] flex items-center justify-center shadow-lg shadow-blue-900/20"><Bot className="text-white" size={28} /></div>
                 <div>
                    <h3 className="text-sm font-black uppercase tracking-widest">DEFLUVOT</h3>
                    <p className="text-[9px] font-bold text-green-600 uppercase tracking-tighter animate-pulse">● IA Activa</p>
                 </div>
              </div>

              <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-white">
                 {messages.map((msg, idx) => (
                   <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}>
                      <div className="flex items-center gap-2 text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">
                         {msg.role === 'bot' ? <><Bot size={12} className="text-[#0a2d4d]" /> DEFLUVOT</> : <>OPERADOR <User size={12} /></>}
                      </div>
                      <div className={`max-w-[90%] p-5 rounded-3xl text-xs font-medium leading-relaxed shadow-sm border ${msg.role === 'user' ? 'bg-[#0a2d4d] text-white rounded-tr-none border-blue-900' : 'bg-gray-50 text-[#0a2d4d] rounded-tl-none border-gray-100'}`}>
                         {msg.text}
                      </div>
                      <span className="text-[8px] font-bold text-gray-300 uppercase">{msg.timestamp}</span>
                   </div>
                 ))}
                 {loading && (
                   <div className="flex items-center gap-3 text-gray-400 animate-pulse">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Procesando...</span>
                   </div>
                 )}
                 <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-8 border-t border-gray-100 bg-gray-50/50">
                 <div className="relative group">
                    <input 
                       type="text" 
                       value={input}
                       onChange={(e) => setInput(e.target.value)}
                       placeholder="Consultar a DEFLUVOT..." 
                       className="w-full bg-white border border-gray-200 rounded-2xl pl-6 pr-14 py-4 text-xs font-medium outline-none focus:ring-4 focus:ring-[#0a2d4d]/5 focus:border-[#0a2d4d] transition-all shadow-inner text-zinc-900"
                    />
                    <button 
                      type="submit"
                      disabled={!input.trim() || loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-[#0a2d4d] text-white rounded-xl hover:bg-blue-900 transition-all disabled:opacity-50 active:scale-95"
                    >
                       <Send size={18} />
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  )
}
