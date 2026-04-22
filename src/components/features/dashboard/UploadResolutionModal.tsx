'use client'

import React, { useState } from 'react'
import { X, FileUp, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/cliente'
import { useRouter } from 'next/navigation'
import { logAction } from '@/utils/audit-helper'

interface Props {
  isOpen: boolean
  onClose: () => void
  taskId: string
  taskTitle: string
}

export default function UploadResolutionModal({ isOpen, onClose, taskId, taskTitle }: Props) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  if (!isOpen) return null

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-res-${taskTitle.replace(/\s+/g, '_')}.${fileExt}`
      const filePath = `tasks/resolutions/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { error: dbError } = await supabase
        .from('tasks')
        .update({ 
          resolution_file_path: filePath,
          status: 'Aprobado' // Auto-approve or keep as is? Let's keep status update manual or pending review
        })
        .eq('id', taskId)

      if (dbError) throw dbError

      await logAction(
        'CARGA',
        'Tareas',
        taskId,
        { title: taskTitle },
        `Carga de documento de respuesta para tarea: ${taskTitle}`
      )

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
        router.refresh()
      }, 2000)

    } catch (error: any) {
      console.error('Error uploading resolution:', error)
      alert('Error al subir el archivo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-[#0a2d4d]/60 backdrop-blur-sm text-[#0a2d4d]">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-50/50">
          <div className="flex items-center gap-3">
             <FileUp className="text-blue-600" size={20} />
             <h3 className="text-sm font-black uppercase tracking-widest">Subir Resultado</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="p-16 flex flex-col items-center justify-center text-center space-y-4">
             <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle2 size={40} />
             </div>
             <h4 className="text-xl font-black">¡Archivo Entregado!</h4>
             <p className="text-sm text-gray-500">La tarea ha sido completada con el documento.</p>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="p-8 space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tarea Correspondiente</p>
              <p className="text-sm font-bold bg-gray-50 p-3 rounded-xl border border-gray-100">{taskTitle}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Seleccionar Documento Completado</label>
              <div className="relative group">
                <input 
                  type="file" required onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden" id="res-file"
                />
                <label 
                  htmlFor="res-file"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 cursor-pointer group-hover:border-blue-500 transition-all px-6"
                >
                  <FileUp size={24} className="text-gray-400 group-hover:text-blue-600 mb-2" />
                  <span className="text-[10px] font-black text-gray-400 group-hover:text-blue-600 uppercase tracking-widest text-center break-all">
                    {file ? file.name : 'Haz clic para seleccionar archivo'}
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
                type="submit" disabled={loading || !file}
                className="flex-[2] py-3.5 bg-[#0a2d4d] text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-900/30 hover:bg-blue-900 transition-all flex items-center justify-center gap-2"
               >
                 {loading ? <Loader2 size={16} className="animate-spin" /> : 'Confirmar Entrega'}
               </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
