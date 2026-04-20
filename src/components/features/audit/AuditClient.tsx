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
  MoreHorizontal
} from 'lucide-react'
import { AuditLog } from '@/app/types/database'

interface Props {
  initialLogs: AuditLog[]
}

export default function AuditClient({ initialLogs }: Props) {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null)

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-screen overflow-hidden font-sans">
      {/* Top Header */}
      <div className="p-8 pb-4 flex justify-between items-start">
        <div className="flex items-center gap-4">
           {selectedDoc && (
             <button onClick={() => setSelectedDoc(null)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
               <ArrowLeft size={20} className="text-gray-600" />
             </button>
           )}
           <div>
              <h1 className="text-2xl font-bold text-[#0a2d4d]">Registro de Auditoría</h1>
              <p className="text-gray-500 text-sm">Trazabilidad completa de acciones del sistema.</p>
           </div>
        </div>
      </div>

      {!selectedDoc ? (
        <div className="flex-1 p-8 pt-0 space-y-6 overflow-y-auto">
           {/* Filters */}
           <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap gap-6 items-end">
              <div className="space-y-1.5 flex-1 min-w-[150px]">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Acción</label>
                 <select className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Todas las acciones</option>
                 </select>
              </div>
              <button className="px-8 py-2.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-[#0a2d4d] flex items-center gap-2 hover:bg-gray-50 transition-colors uppercase tracking-widest">
                 <Filter size={14} /> Filtrar
              </button>
              <button className="px-8 py-2.5 bg-[#0a2d4d] rounded-lg text-[10px] font-bold text-white flex items-center gap-2 hover:bg-blue-900 transition-colors uppercase tracking-widest shadow-lg shadow-blue-900/20">
                 <Download size={14} /> Exportar CSV
              </button>
           </div>

           {/* Table */}
           <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                       <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fecha y Hora</th>
                       <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Usuario</th>
                       <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Acción</th>
                       <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recurso</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {initialLogs.map((log) => (
                      <tr 
                        key={log.log_id} 
                        className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                        onClick={() => setSelectedDoc(log.resource_id)}
                      >
                         <td className="px-8 py-5 text-[11px] font-medium text-gray-400 tabular-nums">
                            {new Date(log.timestamp).toLocaleString()}
                         </td>
                         <td className="px-8 py-5 text-xs font-bold text-[#0a2d4d]">{log.user_id.slice(0, 8)}</td>
                         <td className="px-8 py-5 text-xs font-bold">
                            <span className="text-blue-600">{log.action_type.toUpperCase()}</span>
                         </td>
                         <td className="px-8 py-5 text-xs font-bold text-blue-600 underline group-hover:text-blue-800">{log.resource_type}</td>
                      </tr>
                    ))}
                    {initialLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-12 text-center text-gray-400 text-sm">
                          No hay registros de auditoría.
                        </td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      ) : (
        /* Split View: PDF + Bot */
        <div className="flex-1 flex overflow-hidden border-t border-gray-200">
           {/* PDF Viewer Mock */}
           <div className="flex-1 flex flex-col bg-gray-200 relative">
              <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center px-12">
                 <span className="text-xs font-bold text-[#0a2d4d] uppercase tracking-wider">Documento: {selectedDoc.slice(0, 8)}</span>
                 <div className="flex gap-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600"><Printer size={18} /></button>
                    <button className="p-2 text-gray-400 hover:text-gray-600"><Maximize2 size={18} /></button>
                 </div>
              </div>
              <div className="flex-1 p-12 overflow-y-auto flex justify-center">
                 <div className="w-[600px] h-[842px] bg-white shadow-2xl rounded-sm border border-gray-300 relative flex items-center justify-center">
                    <FileText size={128} className="text-gray-100" />
                 </div>
              </div>
              <div className="bg-[#0a2d4d] p-4 flex justify-end items-center px-12">
                 <button className="px-6 py-2.5 bg-white text-[#0a2d4d] hover:bg-gray-100 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg">
                    <CheckCircle size={14} /> Cerrar Revisión
                 </button>
              </div>
           </div>

           {/* SGC-Bot Sidebar */}
           <div className="w-96 bg-gray-50 border-l border-gray-200 flex flex-col">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#0a2d4d] flex items-center justify-center">
                       <Bot className="text-white" size={24} />
                    </div>
                    <div>
                       <h3 className="text-sm font-bold text-[#0a2d4d] uppercase tracking-widest">SGC-Bot</h3>
                       <p className="text-[9px] font-bold text-green-600 uppercase">● IA Activa</p>
                    </div>
                 </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                 <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm text-xs text-gray-700 leading-relaxed">
                    Bienvenido al asistente de auditoría. ¿En qué puedo ayudarte con este documento?
                 </div>
              </div>

              <div className="p-6 bg-white border-t border-gray-200">
                 <div className="relative">
                    <input 
                       type="text" 
                       placeholder="Pregunta algo sobre el documento..." 
                       className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-12 py-3 text-xs outline-none focus:ring-2 focus:ring-[#0a2d4d]/20 focus:border-[#0a2d4d]"
                    />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#0a2d4d] text-white rounded-lg hover:bg-blue-900 transition-colors">
                       <Send size={16} />
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}
