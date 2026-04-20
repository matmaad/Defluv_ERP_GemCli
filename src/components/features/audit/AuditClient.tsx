'use client'

import React, { useState } from 'react'
import { 
  Filter, 
  Download, 
  ArrowLeft, 
  Printer, 
  Maximize2, 
  FileText, 
  CheckCircle,
  Bot,
  Send,
  Loader2,
  User
} from 'lucide-react'
import { AuditLog } from '@/app/types/database'
import { analyzeDocument } from '@/app/actions/ai-actions'

interface Props {
  initialLogs: AuditLog[]
}

interface Message {
  role: 'bot' | 'user'
  text: string
  timestamp: string
}

export default function AuditClient({ initialLogs }: Props) {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Bienvenido al asistente de auditoría. ¿En qué puedo ayudarte con este documento?', timestamp: new Date().toLocaleTimeString() }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !selectedDoc || loading) return

    const userMsg: Message = { role: 'user', text: input, timestamp: new Date().toLocaleTimeString() }
    setMessages(prev => [...prev, userMsg])
    const currentInput = input
    setInput('')
    setLoading(true)

    try {
      const response = await analyzeDocument(selectedDoc, currentInput)
      
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

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-screen overflow-hidden font-sans">
      {/* Top Header */}
      <div className="p-8 pb-4 flex justify-between items-start">
        <div className="flex items-center gap-4 text-[#0a2d4d]">
           {selectedDoc && (
             <button onClick={() => setSelectedDoc(null)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
               <ArrowLeft size={20} />
             </button>
           )}
           <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">Registro de Auditoría</h1>
              <p className="text-gray-500 text-sm font-medium">Trazabilidad técnica y cumplimiento normativo.</p>
           </div>
        </div>
      </div>

      {!selectedDoc ? (
        <div className="flex-1 p-8 pt-0 space-y-6 overflow-y-auto">
           {/* Table */}
           <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse text-[#0a2d4d]">
                 <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Fecha y Hora</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Acción</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Recurso</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50 font-medium">
                    {initialLogs.map((log) => (
                      <tr 
                        key={log.log_id} 
                        className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                        onClick={() => setSelectedDoc(log.resource_id || 'Documento')}
                      >
                         <td className="px-8 py-5 text-[11px] font-bold text-gray-400 tabular-nums">
                            {new Date(log.timestamp).toLocaleString()}
                         </td>
                         <td className="px-8 py-5 text-xs font-black">
                            <span className="text-blue-600 uppercase tracking-widest">{log.action_type}</span>
                         </td>
                         <td className="px-8 py-5 text-xs font-black underline group-hover:text-blue-800">{log.resource_type || 'ARCHIVO'}</td>
                      </tr>
                    ))}
                    {initialLogs.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-8 py-12 text-center text-gray-400 text-sm font-black uppercase tracking-widest">
                          Sin registros de auditoría recientes.
                        </td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      ) : (
        /* Split View: PDF + Bot */
        <div className="flex-1 flex overflow-hidden border-t border-gray-100">
           {/* PDF Viewer Mock */}
           <div className="flex-1 flex flex-col bg-gray-100 relative">
              <div className="bg-white p-4 border-b border-gray-100 flex justify-between items-center px-12">
                 <span className="text-xs font-black text-[#0a2d4d] uppercase tracking-widest">VISOR DE CUMPLIMIENTO</span>
                 <div className="flex gap-2">
                    <button className="p-2 text-gray-400 hover:text-[#0a2d4d]"><Printer size={18} /></button>
                 </div>
              </div>
              <div className="flex-1 p-12 overflow-y-auto flex justify-center bg-gray-200/50">
                 <div className="w-[600px] h-[842px] bg-white shadow-2xl rounded-sm border border-gray-300 relative flex items-center justify-center">
                    <div className="text-center space-y-4">
                       <FileText size={80} className="text-gray-100 mx-auto" />
                       <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Cargando Documento...</p>
                    </div>
                 </div>
              </div>
              <div className="bg-[#0a2d4d] p-6 flex justify-end items-center px-12">
                 <button 
                  onClick={() => setSelectedDoc(null)}
                  className="px-8 py-3 bg-white text-[#0a2d4d] hover:bg-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl"
                 >
                    <CheckCircle size={16} /> Finalizar Revisión
                 </button>
              </div>
           </div>

           {/* SGC-Bot Sidebar */}
           <div className="w-[450px] bg-white border-l border-gray-100 flex flex-col shadow-2xl relative z-10">
              <div className="p-8 border-b border-gray-50 flex items-center gap-4 bg-gray-50/50">
                 <div className="w-12 h-12 rounded-2xl bg-[#0a2d4d] flex items-center justify-center shadow-lg shadow-blue-900/20">
                    <Bot className="text-white" size={28} />
                 </div>
                 <div>
                    <h3 className="text-sm font-black text-[#0a2d4d] uppercase tracking-widest">SGC-Bot</h3>
                    <p className="text-[9px] font-bold text-green-600 uppercase tracking-tighter animate-pulse">● Inteligencia Artificial Activa</p>
                 </div>
              </div>

              <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-white">
                 {messages.map((msg, idx) => (
                   <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}>
                      <div className="flex items-center gap-2">
                         {msg.role === 'bot' && <Bot size={12} className="text-[#0a2d4d]" />}
                         <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">{msg.role === 'bot' ? 'SGC-BOT' : 'OPERADOR'}</span>
                         {msg.role === 'user' && <User size={12} className="text-gray-400" />}
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
                      <span className="text-[9px] font-black uppercase tracking-widest">Analizando Documento...</span>
                   </div>
                 )}
              </div>

              <form onSubmit={handleSendMessage} className="p-8 border-t border-gray-100 bg-gray-50/50">
                 <div className="relative group">
                    <input 
                       type="text" 
                       value={input}
                       onChange={(e) => setInput(e.target.value)}
                       placeholder="Consultar sobre ISO-9001 o el archivo..." 
                       className="w-full bg-white border border-gray-200 rounded-2xl pl-6 pr-14 py-4 text-xs font-medium outline-none focus:ring-4 focus:ring-[#0a2d4d]/5 focus:border-[#0a2d4d] transition-all shadow-inner"
                    />
                    <button 
                      type="submit"
                      disabled={!input.trim() || loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-[#0a2d4d] text-white rounded-xl hover:bg-blue-900 transition-all disabled:opacity-50 shadow-lg shadow-blue-900/20 active:scale-95"
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
