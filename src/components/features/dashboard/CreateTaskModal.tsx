'use client'

import React, { useState } from 'react'
import { X, ClipboardList, Loader2, CheckCircle2, FileUp } from 'lucide-react'
import { createClient } from '@/utils/supabase/cliente'
import { useRouter } from 'next/navigation'

interface Props {
  isOpen: boolean
  onClose: () => void
  departments: { id: string; name: string }[]
  users: { id: string; first_name: string; last_name: string; department_id: string | null }[]
}

export default function CreateTaskModal({ isOpen, onClose, departments, users }: Props) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [deptId, setDeptId] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('Estándar')
  const [file, setFile] = useState<File | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  if (!isOpen) return null

  // Filtramos los usuarios por el departamento seleccionado
  const filteredUsers = users.filter(u => u.department_id === deptId)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Auth error')

      let filePath = null
      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-task-${title.replace(/\s+/g, '_')}.${fileExt}`
        filePath = `tasks/instructions/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file)
        
        if (uploadError) throw uploadError
      }

      const { error } = await supabase
        .from('tasks')
        .insert({
          title,
          description: desc,
          assigned_to_user_id: assignedTo,
          requester_id: user.id,
          department_id: deptId,
          due_date: dueDate,
          priority,
          instruction_file_path: filePath,
          status: 'Pendiente'
        })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
        router.refresh()
      }, 2000)

    } catch (error: any) {
      console.error('Error creating task:', error)
      alert(`Error al crear la tarea: ${error.message || 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a2d4d]/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 text-[#0a2d4d]">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-[#0a2d4d] text-white flex items-center justify-center shadow-lg shadow-blue-900/20">
                <ClipboardList size={20} />
             </div>
             <div>
                <h3 className="text-sm font-bold uppercase tracking-widest">Crear Nueva Tarea</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Asignación Directa</p>
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
             <h4 className="text-xl font-black text-[#0a2d4d]">¡Tarea Asignada!</h4>
             <p className="text-sm text-gray-500">El usuario recibirá una notificación en su panel.</p>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="p-8 space-y-5 text-[#0a2d4d]">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Título de la Tarea</label>
              <input 
                type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-zinc-900 placeholder:text-gray-500"
                placeholder="Ej: Revisión de Protocolo de Excavación"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Descripción</label>
              <textarea 
                value={desc} onChange={(e) => setDesc(e.target.value)}
                className="w-full h-20 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium resize-none text-zinc-900 placeholder:text-gray-500"
                placeholder="Detalles adicionales de la asignación..."
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Departamento</label>
                <select 
                  required value={deptId} 
                  onChange={(e) => {
                    setDeptId(e.target.value)
                    setAssignedTo('') // Reset responsable when dept changes
                  }}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-black uppercase text-[#0a2d4d]"
                >
                  <option value="">Seleccionar...</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Responsable</label>
                <select 
                  required value={assignedTo} 
                  onChange={(e) => setAssignedTo(e.target.value)}
                  disabled={!deptId}
                  className={`w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-black uppercase text-[#0a2d4d] ${!deptId ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="">{deptId ? 'Seleccionar...' : 'Elija Depto. primero'}</option>
                  {filteredUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Fecha Límite</label>
                <input 
                  type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-zinc-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Prioridad</label>
                <select 
                  value={priority} onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-black text-[#0a2d4d]"
                >
                  <option>Baja</option>
                  <option>Estándar</option>
                  <option>Urgente</option>
                  <option>Crítico</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Archivo de Instrucción (PDF)</label>
              <div className="relative group">
                <input 
                  type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden" id="task-file"
                />
                <label 
                  htmlFor="task-file"
                  className="flex items-center gap-3 w-full px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 cursor-pointer group-hover:border-[#0a2d4d] transition-all"
                >
                  <FileUp size={18} className="text-gray-400" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">
                    {file ? file.name : 'Subir documento adjunto'}
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
               <button 
                type="button" onClick={onClose}
                className="flex-1 py-3.5 border border-gray-200 rounded-xl text-[10px] font-bold text-gray-400 uppercase tracking-widest"
               >
                 Cancelar
               </button>
               <button 
                type="submit" disabled={loading}
                className="flex-[2] py-3.5 bg-[#0a2d4d] text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-900/30 hover:bg-blue-900 transition-all flex items-center justify-center gap-2"
               >
                 {loading ? <Loader2 size={16} className="animate-spin" /> : 'Crear Tarea'}
               </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
