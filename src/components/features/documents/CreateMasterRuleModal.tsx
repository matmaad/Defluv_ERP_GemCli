'use client'

import React, { useState } from 'react'
import { X, PlusCircle, Loader2, CheckCircle2, FileText, Clock, Briefcase, User, Info } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createMasterRuleAction } from '@/app/actions/master-matrix-actions'
import { createClient } from '@/utils/supabase/cliente'

interface Props {
  isOpen: boolean
  onClose: () => void
  departments: any[]
  profiles: any[]
}

export default function CreateMasterRuleModal({ isOpen, onClose, departments, profiles }: Props) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deptId, setDeptId] = useState('')
  const [assignedId, setAssignedId] = useState('')
  const [frequency, setFrequency] = useState('DIARIO')
  const [dueTime, setDueTime] = useState('18:00')
  const [file, setFile] = useState<File | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let storagePath = null
      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `templates/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, file)
        if (uploadError) throw uploadError
        storagePath = fileName
      }

      const result = await createMasterRuleAction({
        title,
        description,
        department_id: deptId,
        assigned_to_profile_id: assignedId || null,
        frequency,
        standard_due_time: dueTime,
        template_storage_path: storagePath
      })

      if (result.error) throw new Error(result.error)

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
        router.refresh()
      }, 2000)
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#0a2d4d]/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-[#0a2d4d] text-white flex items-center justify-center shadow-lg">
                <PlusCircle size={20} />
             </div>
             <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-[#0a2d4d]">CREAR NUEVO DOCUMENTO</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Nueva Regla de Matriz Maestra</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
             <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle2 size={48} />
             </div>
             <h4 className="text-xl font-black text-[#0a2d4d]">Regla Creada</h4>
             <p className="text-sm text-gray-500">El requerimiento ha sido integrado a la Matriz Maestra.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Título del Requerimiento</label>
                <input 
                  type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-bold text-zinc-900"
                  placeholder="Ej: Reporte Diario de Turbiedad"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Departamento</label>
                  <select 
                    required value={deptId} onChange={(e) => setDeptId(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black uppercase text-[#0a2d4d]"
                  >
                    <option value="">Seleccionar...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Responsable Sugerido</label>
                  <select 
                    value={assignedId} onChange={(e) => setAssignedId(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black uppercase text-[#0a2d4d]"
                  >
                    <option value="">Cualquier Miembro</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Periodicidad</label>
                  <select 
                    value={frequency} onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black uppercase text-[#0a2d4d]"
                  >
                    <option value="DIARIO">Cíclico Diario</option>
                    <option value="SEMANAL">Cíclico Semanal</option>
                    <option value="MENSUAL">Cíclico Mensual</option>
                    <option value="ANUAL">Cíclico Anual</option>
                    <option value="UNICA">Carga Única</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Hora Límite de Cierre</label>
                  <input 
                    type="time" required value={dueTime} onChange={(e) => setDueTime(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-bold text-zinc-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Plantilla de Guía (PDF/Excel)</label>
                <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-all">
                  <input 
                    type="file" onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <FileText size={18} />
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">
                      {file ? file.name : 'Subir archivo de instrucción o plantilla...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full py-4 bg-[#0a2d4d] text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-900 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Confirmar Registro Maestro'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
