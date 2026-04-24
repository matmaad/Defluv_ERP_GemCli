'use client'

import React, { useState } from 'react'
import { X, ClipboardList, Loader2, CheckCircle2, FileUp, Clock, AlertTriangle } from 'lucide-react'
import { createClient } from '@/utils/supabase/cliente'
import { useRouter } from 'next/navigation'
import { createTaskWithNotification } from '@/app/actions/task-actions'

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
  const [dueTime, setDueTime] = useState('18:00')
  const [priority, setPriority] = useState('Estándar')
  const [requiresDoc, setRequiresDoc] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  if (!isOpen) return null

  const filteredUsers = deptId 
    ? users.filter(u => u.department_id === deptId)
    : users

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let filePath = null
      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-template-${title.replace(/\s+/g, '_')}.${fileExt}`
        filePath = `tasks/templates/${fileName}`
        const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file)
        if (uploadError) throw uploadError
      }

      const finalDueDate = dueDate ? `${dueDate}T${dueTime}:00` : null
      const result = await createTaskWithNotification({
        title,
        description: desc,
        assigned_to_user_id: assignedTo || null,
        department_id: deptId || null,
        due_date: finalDueDate,
        priority,
        requires_document: requiresDoc,
        instruction_file_path: filePath
      })

      if (result.error) throw new Error(result.error)
      setSuccess(true)
      setTimeout(() => { setSuccess(false); onClose(); router.refresh() }, 2000)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#0a2d4d]/60 backdrop-blur-sm text-[#0a2d4d]">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-[#0a2d4d] text-white flex items-center justify-center shadow-lg"><ClipboardList size={20} /></div>
             <div><h3 className="text-sm font-black uppercase tracking-widest">Asignar Tarea</h3><p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">SGC - Gestión Operativa</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={20} /></button>
        </div>

        {success ? (
          <div className="p-20 text-center space-y-4"><div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center animate-bounce mx-auto"><CheckCircle2 size={48} /></div><h4 className="text-xl font-black">¡Tarea Asignada!</h4></div>
        ) : (
          <form onSubmit={handleCreate} className="p-8 space-y-5">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Título de la Tarea</label><input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Instrucciones</label><textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full h-20 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium resize-none"></textarea></div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Departamento</label><select value={deptId} onChange={(e) => { setDeptId(e.target.value); setAssignedTo('') }} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black uppercase"><option value="">Seleccionar...</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Responsable</label><select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black uppercase"><option value="">Seleccionar...</option>{filteredUsers.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}</select></div>
              <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Fecha Límite</label><input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-medium" /></div>
              <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Hora Límite</label><div className="relative"><Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-medium" /></div></div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nivel de Prioridad</label>
              <div className="relative">
                <AlertTriangle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black uppercase text-[#0a2d4d]">
                  <option>Baja</option>
                  <option>Estándar</option>
                  <option>Urgente</option>
                  <option>Crítico</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2 px-2">
                 <div className="flex items-center gap-3">
                    <input type="checkbox" id="req-doc" checked={requiresDoc} onChange={(e) => setRequiresDoc(e.target.checked)} className="w-5 h-5 rounded-lg border-gray-200 text-[#0a2d4d]" />
                    <label htmlFor="req-doc" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">Exigir Documento de Respuesta</label>
                 </div>
            </div>

            <div className="space-y-1.5"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Plantilla de Llenado (Opcional)</label><div className="relative group"><input type="file" accept=".pdf,.docx,.xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="task-file" /><label htmlFor="task-file" className="flex items-center gap-3 w-full px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 cursor-pointer group-hover:border-[#0a2d4d] transition-all"><FileUp size={18} className="text-gray-400" /><span className="text-[10px] font-black text-gray-400 uppercase truncate">{file ? file.name : 'Seleccionar archivo...'}</span></label></div></div>

            <div className="flex gap-4 pt-4 border-t border-gray-100">
               <button type="button" onClick={onClose} className="flex-1 py-3.5 border border-gray-200 rounded-xl text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cancelar</button>
               <button type="submit" disabled={loading} className="flex-[2] py-3.5 bg-[#0a2d4d] text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl hover:bg-blue-900 transition-all flex items-center justify-center gap-2">{loading ? <Loader2 size={16} className="animate-spin" /> : 'Confirmar Asignación'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
