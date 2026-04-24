'use client'

import React, { useState } from 'react'
import { X, AlertCircle, CheckCircle2, Info, FileWarning } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  log: {
    id: string
    action_type: string
    user_name: string
  } | null
}

export default function ManageIncidenceModal({ isOpen, onClose, log }: Props) {
  const [incidenceType, setIncidenceType] = useState<'NC' | 'TMR' | ''>('')
  
  if (!isOpen || !log) return null

  const handleSave = () => {
    alert(`Registro ${log?.id} marcado como ${incidenceType === 'NC' ? 'No Conformidad' : 'Trabajo Mal Realizado'}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a2d4d]/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-8 bg-[#0a2d4d] text-white flex justify-between items-center">
          <div className="space-y-1">
            <h3 className="text-xl font-black uppercase tracking-tight">Gestión de Incidencia</h3>
            <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Vinculado a: {log?.action_type || 'N/A'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-4 items-start">
            <Info className="text-blue-600 shrink-0" size={20} />
            <div className="space-y-1">
              <p className="text-[10px] font-black text-[#0a2d4d] uppercase tracking-widest">Información del Registro</p>
              <p className="text-xs text-gray-600 font-medium truncate">ID: {log?.id || 'Desconocido'}</p>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter mt-1">OPERADOR: {log?.user_name || 'SISTEMA'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Clasificación de la Incidencia</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setIncidenceType('NC')}
                className={`p-6 rounded-2xl border-2 transition-all text-left space-y-2 ${incidenceType === 'NC' ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <AlertCircle className={incidenceType === 'NC' ? 'text-red-500' : 'text-gray-400'} size={24} />
                <p className={`text-xs font-black uppercase ${incidenceType === 'NC' ? 'text-red-600' : 'text-gray-400'}`}>No Conformidad</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase leading-tight">Incumplimiento de requisitos normativos.</p>
              </button>

              <button 
                onClick={() => setIncidenceType('TMR')}
                className={`p-6 rounded-2xl border-2 transition-all text-left space-y-2 ${incidenceType === 'TMR' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <FileWarning className={incidenceType === 'TMR' ? 'text-orange-500' : 'text-gray-400'} size={24} />
                <p className={`text-xs font-black uppercase ${incidenceType === 'TMR' ? 'text-orange-600' : 'text-gray-400'}`}>Trabajo Mal Realizado</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase leading-tight">Error operativo o falta de calidad en la ejecución.</p>
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button 
              onClick={handleSave}
              disabled={!incidenceType}
              className="w-full py-4 bg-[#0a2d4d] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-900/20 hover:bg-blue-900 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <CheckCircle2 size={18} /> Confirmar Gestión
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
