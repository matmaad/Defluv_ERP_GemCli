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
  type?: 'TECHNICAL_ANALYSIS' | 'NORMATIVE_REFERENCE' | 'GENERAL'
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
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)
  const [showRetentionWarning, setShowRetentionWarning] = useState(false)
  const [daysUntilDeletion, setDaysUntilDeletion] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Filters state
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedAction, setSelectedAction] = useState('')

  const supabase = createClient()
  const router = useRouter()

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
    setMessages([
      { 
        role: 'bot', 
        text: `He cargado el registro de auditoría. Es un evento de ${log.action_type}. ¿Tienes dudas técnicas sobre este movimiento o el cumplimiento de la norma ISO-9001?`, 
        timestamp: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        type: 'TECHNICAL_ANALYSIS'
      }
    ])
    
    if (log.resource_id) {
      const { data } = await supabase.from('documents').select('*').eq('id', log.resource_id).maybeSingle()
      if (data) setSelectedDocData(data)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !selectedLog || loading) return

    const userMsg: Message = { 
      role: 'user', 
      text: input, 
      timestamp: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) 
    }
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
        timestamp: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        type: response.text?.includes('ISO') ? 'NORMATIVE_REFERENCE' : 'TECHNICAL_ANALYSIS'
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
    <div className="flex-1 flex flex-col bg-[#f4f7f9] h-screen overflow-hidden font-sans text-[#0a2d4d]">
      {!selectedLog ? (
        <div className="flex-1 p-8 space-y-6 overflow-y-auto">
           {/* Top Actions Bar */}
           <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg bg-[#0a2d4d] text-white flex items-center justify-center shadow-lg shadow-blue-900/20">
                    <FileText size={20} />
                 </div>
                 <div>
                    <h2 className="text-sm font-black uppercase tracking-widest">Historial de Auditoría</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Trazabilidad de cumplimiento SGC</p>
                 </div>
              </div>
              <div className="flex gap-2">
                {userRole === 'admin' && (
                  <button onClick={handleDeleteAll} disabled={deletingAll} className="flex items-center gap-2 px-4 py-2 bg-white border border-red-100 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all disabled:opacity-50">
                    {deletingAll ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Eliminar Todo
                  </button>
                )}
                <button onClick={() => exportToCSV('mensual')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-lg text-[10px] font-black text-[#0a2d4d] uppercase tracking-widest hover:bg-gray-50 transition-all">
                   <FileDown size={14} className="text-blue-600" /> Mensual
                </button>
                <button onClick={() => exportToCSV('anual')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-lg text-[10px] font-black text-[#0a2d4d] uppercase tracking-widest hover:bg-gray-50 transition-all">
                   <FileDown size={14} className="text-blue-600" /> Anual
                </button>
                <button onClick={() => exportToCSV('completo')} className="flex items-center gap-2 px-4 py-2 bg-[#0a2d4d] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-900 transition-all shadow-md">
                   <Download size={14} /> Exportar CSV
                </button>
              </div>
           </div>

           {/* Filters */}
           <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
              <div className="space-y-1.5">
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

           {/* Table */}
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
        /* Split View: PDF/Analysis + DEFLUVOT Chat (Matches Bot IA image) */
        <div className="flex-1 flex overflow-hidden">
           {/* Left: Document Visor */}
           <div className="flex-1 flex flex-col bg-[#eef2f5] border-r border-gray-200">
              <div className="bg-white px-8 py-4 border-b border-gray-200 flex justify-between items-center shadow-sm">
                 <div className="flex items-center gap-4">
                    <button onClick={() => {setSelectedLog(null); setSelectedDocData(null)}} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                       <ArrowLeft size={20} className="text-gray-400" />
                    </button>
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-black uppercase tracking-widest">{selectedDocData?.file_name || selectedLog.resource_id.slice(0,12) + '.PDF'}</span>
                       <div className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold text-gray-500">
                          <Search size={10} /> 85% <X size={10} />
                       </div>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <button className="p-2 text-gray-400 hover:text-[#0a2d4d]"><Printer size={18} /></button>
                    <button className="p-2 text-gray-400 hover:text-[#0a2d4d]"><Maximize2 size={18} /></button>
                 </div>
              </div>

              {/* Mock PDF Content */}
              <div className="flex-1 p-12 overflow-y-auto flex justify-center">
                 <div className="w-[700px] h-[950px] bg-white shadow-2xl relative border border-gray-300 p-16">
                    <div className="absolute inset-0 bg-[#0a2d4d]/5 pointer-events-none flex items-center justify-center">
                       <FileText size={200} className="text-[#0a2d4d]/10" />
                    </div>
                    <div className="relative space-y-8 opacity-40">
                       <div className="h-4 bg-gray-200 w-3/4 rounded"></div>
                       <div className="space-y-3">
                          <div className="h-2.5 bg-gray-100 w-full rounded"></div>
                          <div className="h-2.5 bg-gray-100 w-full rounded"></div>
                          <div className="h-2.5 bg-gray-100 w-5/6 rounded"></div>
                       </div>
                       <div className="h-40 bg-gray-50 w-full rounded-xl border border-dashed border-gray-200"></div>
                    </div>
                 </div>
              </div>

              {/* Bottom Visor Bar */}
              <div className="bg-[#051c2e] px-12 py-4 flex justify-between items-center text-white border-t border-white/10">
                 <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-0.5">Status del Archivo</p>
                    <p className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                       {selectedDocData?.current_status || 'PENDIENTE DE REVISIÓN'}
                    </p>
                 </div>
                 <div className="flex items-center gap-6">
                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-blue-400 transition-colors">
                       <Download size={14} /> Descargar PDF
                    </button>
                    <div className="flex items-center gap-3">
                       <button className="px-6 py-2.5 border border-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">Solicitar Corrección</button>
                       <button className="px-6 py-2.5 bg-blue-50 text-[#0a2d4d] rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all flex items-center gap-2">
                          <CheckCircle size={14} /> Marcar como Cumplido
                       </button>
                    </div>
                 </div>
              </div>
           </div>

           {/* Right: DEFLUVOT Chat */}
           <div className="w-[450px] bg-white flex flex-col shadow-[-10px_0_30px_-5px_rgba(0,0,0,0.1)] relative z-50">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#fcfdfe]">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#0a2d4d] flex items-center justify-center shadow-lg shadow-blue-900/20"><Bot className="text-white" size={26} /></div>
                    <div>
                       <h3 className="text-sm font-black uppercase tracking-widest text-[#0a2d4d]">DEFLUVOT</h3>
                       <p className="text-[9px] font-bold text-green-600 uppercase tracking-tighter animate-pulse">● Powered by Gemini AI</p>
                    </div>
                 </div>
                 <button className="p-2 text-gray-300 hover:text-gray-600"><X size={20} /></button>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-8 scrollbar-hide">
                 {messages.map((msg, idx) => (
                   <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center shadow-sm ${msg.role === 'bot' ? 'bg-[#0a2d4d] text-white' : 'bg-gray-100 text-gray-400'}`}>
                         {msg.role === 'bot' ? <Bot size={16} /> : <User size={16} />}
                      </div>
                      <div className="space-y-2 max-w-[80%]">
                         <div className={`p-5 rounded-2xl text-[11px] font-medium leading-relaxed shadow-sm border ${msg.role === 'user' ? 'bg-[#0a2d4d] text-white border-blue-900 rounded-tr-none' : 'bg-[#f0f7ff] text-[#0a2d4d] border-blue-100 rounded-tl-none'}`}>
                            {msg.text}
                            {msg.type === 'NORMATIVE_REFERENCE' && (
                               <div className="mt-4 pt-4 border-t border-blue-200/50 grid grid-cols-2 gap-4">
                                  <div className="bg-white/50 p-2 rounded-lg border border-blue-200/30">
                                     <p className="text-[8px] font-black uppercase opacity-50">Espesor Mínimo</p>
                                     <p className="text-[10px] font-black">18.5 mm</p>
                                  </div>
                                  <div className="bg-white/50 p-2 rounded-lg border border-blue-200/30">
                                     <p className="text-[8px] font-black uppercase opacity-50">Factor Seg.</p>
                                     <p className="text-[10px] font-black">1.25 η</p>
                                  </div>
                               </div>
                            )}
                         </div>
                         <div className={`flex items-center gap-2 text-[8px] font-black text-gray-300 uppercase tracking-widest ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.timestamp} {msg.type && `• ${msg.type.replace('_', ' ')}`}
                            {msg.role === 'user' && <span className="bg-gray-200 px-1 rounded text-white ml-1">USER</span>}
                         </div>
                      </div>
                   </div>
                 ))}
                 {loading && (
                   <div className="flex gap-4 animate-pulse">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                         <div className="h-10 bg-gray-50 rounded-2xl w-3/4"></div>
                         <div className="h-3 bg-gray-50 rounded w-1/4"></div>
                      </div>
                   </div>
                 )}
                 <div ref={chatEndRef} />
              </div>

              <div className="p-6 bg-white border-t border-gray-100">
                 <form onSubmit={handleSendMessage} className="relative">
                    <input 
                       type="text" 
                       value={input}
                       onChange={(e) => setInput(e.target.value)}
                       placeholder="Pregunta algo sobre el documento..." 
                       className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl pl-6 pr-14 py-4 text-xs font-medium outline-none focus:ring-2 focus:ring-[#0a2d4d]/10 focus:border-[#0a2d4d] transition-all text-zinc-900"
                    />
                    <button type="submit" disabled={!input.trim() || loading} className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 text-[#0a2d4d] hover:bg-gray-100 rounded-lg transition-all"><Send size={20} /></button>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}
