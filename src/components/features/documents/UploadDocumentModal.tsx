'use client'

import React, { useState, useEffect } from 'react'
import { X, FileUp, Loader2, CheckCircle2, Calendar, Info } from 'lucide-react'
import { createClient } from '@/utils/supabase/cliente'
import { useRouter } from 'next/navigation'
import { logAction } from '@/utils/audit-helper'

interface Props {
  isOpen: boolean
  onClose: () => void
  departments: { id: string; name: string }[]
  preFill?: {
    title: string
    department_id: string
    master_id?: string
  } | null
}

export default function UploadDocumentModal({ isOpen, onClose, departments, preFill }: Props) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [docType, setDocType] = useState('Protocolo')
  const [articulo, setArticulo] = useState('')
  const [deptId, setDeptId] = useState('')
  const [dueDate, setDueDate] = useState('')
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (preFill) {
      setTitle(preFill.title)
      setDeptId(preFill.department_id)
    } else {
      setTitle('')
      setDeptId('')
    }
  }, [preFill, isOpen])

  if (!isOpen) return null

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !deptId) return

    setLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${title.replace(/\s+/g, '_')}.${fileExt}`
      const filePath = `${deptId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data, error: dbError } = await supabase
        .from('documents')
        .insert({
          title,
          document_type: docType,
          articulo,
          department_id: deptId,
          responsible_user_id: user.id,
          uploaded_by_user_id: user.id,
          storage_path: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          current_status: 'Pendiente',
          due_date: dueDate || null,
          master_id: preFill?.master_id || null
        })
        .select()
        .single()

      if (dbError) throw dbError

      await logAction(
        'CARGA',
        'document',
        data.id,
        { title, docType, fileName: file.name, master_id: preFill?.master_id },
        `Subida de documento: ${title}`
      )

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
        router.refresh()
      }, 2000)

    } catch (error: any) {
      console.error('Error uploading:', error)
      alert(`Error al subir el documento: ${error.message}`)
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
                <FileUp size={20} />
             </div>
             <div>
                <h3 className="text-sm font-black uppercase tracking-widest">{preFill ? 'Cumplir Requerimiento' : 'Subir Nuevo Documento'}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">SGC - Repositorio Central</p>
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
             <h4 className="text-xl font-black text-[#0a2d4d]">¡Documento Subido!</h4>
             <p className="text-sm text-gray-500">El archivo se ha registrado correctamente en la matriz.</p>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="p-8 space-y-5 text-[#0a2d4d]">
            {preFill && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 text-[10px] font-bold uppercase mb-2">
                <Info size={16} />
                <span>Esta carga se asociará automáticamente a la regla maestra activa.</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Título del Documento</label>
                <input 
                  type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                  readOnly={!!preFill}
                  className={`w-full px-4 py-3 border border-gray-100 rounded-xl outline-none transition-all text-sm font-medium ${preFill ? 'bg-gray-100 text-gray-500' : 'bg-gray-50 text-zinc-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'}`}
                  placeholder="Ej: Manual de Seguridad Operativa"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tipo de Documento</label>
                <select 
                  value={docType} onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-black text-[#0a2d4d]"
                >
                  <option>Protocolo</option>
                  <option>Manual</option>
                  <option>Plano</option>
                  <option>Especificación Técnica</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Artículo (MOP/Norma)</label>
                <input 
                  type="text" required value={articulo} onChange={(e) => setArticulo(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-zinc-900 placeholder:text-gray-500"
                  placeholder="Ej: Art. 4.2.1"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Departamento Responsable</label>
                <select 
                  required value={deptId} onChange={(e) => setDeptId(e.target.value)}
                  disabled={!!preFill}
                  className={`w-full px-4 py-3 border border-gray-100 rounded-xl outline-none transition-all text-sm font-black uppercase ${preFill ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 text-[#0a2d4d] focus:ring-2 focus:ring-blue-500/20'}`}
                >
                  <option value="">Seleccionar...</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Fecha Límite (Opcional)</label>
                <input 
                  type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-zinc-900"
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Archivo PDF</label>
                <div className="relative group">
                  <input 
                    type="file" required accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden" id="file-upload"
                  />
                  <label 
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 cursor-pointer group-hover:border-[#0a2d4d] group-hover:bg-blue-50 transition-all px-6"
                  >
                    <FileUp size={24} className="text-gray-400 group-hover:text-[#0a2d4d] mb-2" />
                    <span className="text-[10px] font-black text-gray-400 group-hover:text-[#0a2d4d] uppercase tracking-widest text-center break-all">
                      {file ? file.name : 'Haz clic para seleccionar PDF'}
                    </span>
                    <span className="text-[8px] text-gray-400 mt-1 uppercase tracking-tighter">Máximo 25MB • Formato PDF</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-100">
               <button 
                type="button" onClick={onClose}
                className="flex-1 py-3.5 border border-gray-200 rounded-xl text-[10px] font-bold text-gray-400 hover:bg-gray-50 transition-all uppercase tracking-widest"
               >
                 Cancelar
               </button>
               <button 
                type="submit" disabled={loading || !file}
                className="flex-[2] py-3.5 bg-[#0a2d4d] text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-900/30 hover:bg-blue-900 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
               >
                 {loading ? (
                   <>
                     <Loader2 size={16} className="animate-spin" />
                     Subiendo Archivo...
                   </>
                 ) : (
                   'Confirmar y Subir'
                 )}
               </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
