'use client'

import React, { useState } from 'react'
import { X, FileUp, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/cliente'
import { useRouter } from 'next/navigation'

interface Props {
  isOpen: boolean
  onClose: () => void
  departments: { department_id: string; name: string }[]
}

export default function UploadDocumentModal({ isOpen, onClose, departments }: Props) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [docType, setDocType] = useState('Protocolo')
  const [articulo, setArticulo] = useState('')
  const [deptId, setDeptId] = useState('')
  
  const supabase = createClient()
  const router = useRouter()

  if (!isOpen) return null

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !deptId) return

    setLoading(true)
    
    try {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      // 2. Upload to Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${title.replace(/\s+/g, '_')}.${fileExt}`
      const filePath = `${deptId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 3. Insert metadata into DB
      const { error: dbError } = await supabase
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
          current_status: 'Pendiente'
        })

      if (dbError) throw dbError

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
        router.refresh()
      }, 2000)

    } catch (error) {
      console.error('Error uploading:', error)
      alert('Error al subir el documento. Asegúrese de que el bucket "documents" exista en Supabase.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a2d4d]/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-[#0a2d4d] text-white flex items-center justify-center shadow-lg shadow-blue-900/20">
                <FileUp size={20} />
             </div>
             <div>
                <h3 className="text-sm font-bold text-[#0a2d4d] uppercase tracking-widest">Subir Nuevo Documento</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">SGC - Repositorio Central</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {success ? (
          <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
             <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle2 size={48} />
             </div>
             <h4 className="text-xl font-bold text-[#0a2d4d]">¡Documento Subido!</h4>
             <p className="text-sm text-gray-500">El archivo se ha registrado correctamente en la matriz.</p>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">Título del Documento</label>
                <input 
                  type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-zinc-900 placeholder:text-gray-500"
                  placeholder="Ej: Manual de Seguridad Operativa"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">Tipo de Documento</label>
                <select 
                  value={docType} onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-zinc-900"
                >
                  <option>Protocolo</option>
                  <option>Manual</option>
                  <option>Plano</option>
                  <option>Especificación Técnica</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">Artículo (MOP/Norma)</label>
                <input 
                  type="text" required value={articulo} onChange={(e) => setArticulo(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-zinc-900 placeholder:text-gray-500"
                  placeholder="Ej: Art. 4.2.1"
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">Departamento Responsable</label>
                <select 
                  required value={deptId} onChange={(e) => setDeptId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium uppercase text-zinc-900"
                >
                  <option value="">Seleccionar Departamento</option>
                  {departments.map(d => (
                    <option key={d.department_id} value={d.department_id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">Archivo PDF</label>
                <div className="relative group">
                  <input 
                    type="file" required accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden" id="file-upload"
                  />
                  <label 
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 cursor-pointer group-hover:border-blue-400 group-hover:bg-blue-50 transition-all"
                  >
                    <FileUp size={24} className="text-gray-400 group-hover:text-blue-500 mb-2" />
                    <span className="text-xs font-bold text-gray-400 group-hover:text-blue-600 uppercase tracking-wider">
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
