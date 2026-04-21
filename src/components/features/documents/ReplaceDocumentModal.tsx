'use client'

import React, { useState } from 'react'
import { X, FileUp, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/cliente'
import { useRouter } from 'next/navigation'

interface Props {
  isOpen: boolean
  onClose: () => void
  documentId: string
  documentTitle: string
  currentPath: string
}

export default function ReplaceDocumentModal({ isOpen, onClose, documentId, documentTitle, currentPath }: Props) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [reason, setReason] = useState('')
  
  const supabase = createClient()
  const router = useRouter()

  if (!isOpen) return null

  const handleReplace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !reason) return

    setLoading(true)
    
    try {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      // 2. Get current version number
      const { data: currentDoc } = await supabase
        .from('documents')
        .select('storage_path')
        .eq('id', documentId)
        .single()

      const { count } = await supabase
        .from('document_versions')
        .select('*', { count: 'exact', head: true })
        .eq('document_id', documentId)

      const nextVersion = (count || 0) + 1

      // 3. Move old file to versions or just record old path? 
      // Architecture choice: We keep current path in 'documents' and history in 'document_versions'.
      // For now, we upload NEW file and update the main 'documents' record.
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-v${nextVersion}-${documentTitle.replace(/\s+/g, '_')}.${fileExt}`
      const newPath = currentPath.split('/').slice(0, -1).join('/') + '/' + fileName

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(newPath, file)

      if (uploadError) throw uploadError

      // 4. Create version record for the OLD one first (if it's the first replacement)
      // Actually, best practice is to always record the OLD one before updating.
      await supabase.from('document_versions').insert({
        document_id: documentId,
        storage_path: currentPath,
        uploaded_by_user_id: user.id, // Ideally who uploaded the OLD one, but we use current for log
        reason_for_change: reason,
        version_number: nextVersion - 1
      })

      // 5. Update main record
      const { error: dbError } = await supabase
        .from('documents')
        .update({
          storage_path: newPath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          current_status: 'Pendiente', // Resets to pending for new review
          last_modified_at: new Date().toISOString()
        })
        .eq('id', documentId)

      if (dbError) throw dbError

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
        router.refresh()
      }, 2000)

    } catch (error) {
      console.error('Error replacing:', error)
      alert('Error al reemplazar el documento.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#0a2d4d]/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-50/50">
          <div className="flex items-center gap-3 text-blue-600">
             <FileUp size={20} />
             <h3 className="text-sm font-bold uppercase tracking-widest text-[#0a2d4d]">Reemplazar Documento</h3>
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
             <h4 className="text-xl font-bold text-[#0a2d4d]">¡Versión Actualizada!</h4>
             <p className="text-sm text-gray-500">El documento ha sido reemplazado y la versión anterior guardada en el historial.</p>
          </div>
        ) : (
          <form onSubmit={handleReplace} className="p-8 space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-1">Documento actual</p>
              <p className="text-sm font-bold text-[#0a2d4d] bg-gray-50 p-3 rounded-xl border border-gray-100">{documentTitle}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-1">Justificación del Cambio (Obligatorio)</label>
              <textarea 
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full h-24 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium resize-none text-zinc-900 placeholder:text-gray-500"
                placeholder="Indique por qué está reemplazando este archivo..."
              ></textarea>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-1">Nueva Versión (PDF)</label>
              <div className="relative group">
                <input 
                  type="file" required accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden" id="file-replace"
                />
                <label 
                  htmlFor="file-replace"
                  className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 cursor-pointer group-hover:border-blue-400 group-hover:bg-blue-50 transition-all px-6"
                >
                  <FileUp size={20} className="text-gray-400 group-hover:text-blue-500 mb-1" />
                  <span className="text-[10px] font-black text-gray-400 group-hover:text-blue-600 uppercase tracking-wider text-center break-all">
                    {file ? file.name : 'Seleccionar nuevo PDF'}
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-4">
               <button 
                type="button" onClick={onClose}
                className="flex-1 py-3.5 border border-gray-200 rounded-xl text-[10px] font-black text-gray-400 hover:bg-gray-50 transition-all uppercase tracking-widest"
               >
                 Cancelar
               </button>
               <button 
                type="submit" disabled={loading || !file || !reason}
                className="flex-[2] py-3.5 bg-[#0a2d4d] text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-900/30 hover:bg-blue-900 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
               >
                 {loading ? <Loader2 size={16} className="animate-spin" /> : 'Subir Nueva Versión'}
               </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
