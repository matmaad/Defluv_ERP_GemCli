'use client'

import React, { useState, useEffect } from 'react'
import { X, FileUp, Loader2, CheckCircle2, Eye, Download, ShieldCheck, XCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/cliente'
import { useRouter } from 'next/navigation'
import { logAction } from '@/utils/audit-helper'

interface Props {
  isOpen: boolean
  onClose: () => void
  docType: 'protocolos' | 'iso'
  docTitle: string
  isAdmin: boolean
}

export default function ManageGlobalDocModal({ isOpen, onClose, docType, docTitle, isAdmin }: Props) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [currentPath, setCurrentPath] = useState<string | null>(null)
  
  const supabase = createClient()
  const router = useRouter()
  const storagePath = `globals/${docType}.pdf`

  useEffect(() => {
    if (isOpen) {
      checkCurrentDoc()
    }
  }, [isOpen])

  const checkCurrentDoc = async () => {
    const { data } = await supabase.storage.from('documents').list('globals')
    const exists = data?.find(f => f.name === `${docType}.pdf`)
    if (exists) {
      setCurrentPath(storagePath)
    } else {
      setCurrentPath(null)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    try {
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, { upsert: true })

      if (uploadError) throw uploadError

      await logAction(
        'ACTUALIZACIÓN MAESTRA',
        'Configuración',
        docType,
        { fileName: file.name },
        `Se actualizó el documento maestro: ${docTitle}`
      )

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
        router.refresh()
      }, 2000)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleView = async () => {
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(storagePath, 60)
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    } else {
      alert('Documento no disponible aún.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#0a2d4d]/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 text-[#0a2d4d]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-[#0a2d4d] text-white flex items-center justify-center shadow-lg">
                <ShieldCheck size={20} />
             </div>
             <div>
                <h3 className="text-sm font-black uppercase tracking-widest">{docTitle}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Documento Maestro del Sistema</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="p-16 flex flex-col items-center justify-center text-center space-y-4">
             <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle2 size={48} />
             </div>
             <h4 className="text-xl font-black">¡Documento Actualizado!</h4>
             <p className="text-sm text-gray-500">Los cambios ya están disponibles para todos los usuarios.</p>
          </div>
        ) : (
          <div className="p-8 space-y-8">
            {currentPath && (
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col items-center gap-4 text-center">
                 <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600">
                    <Download size={24} />
                 </div>
                 <div>
                    <p className="text-xs font-black uppercase tracking-widest">Documento Disponible</p>
                    <p className="text-[10px] text-blue-400 font-bold mt-1">Versión oficial cargada por Administración</p>
                 </div>
                 <button onClick={handleView} className="w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                    <Eye size={16} /> Ver Documento Actual
                 </button>
              </div>
            )}

            {isAdmin && (
              <form onSubmit={handleUpload} className="space-y-4 pt-4 border-t border-gray-100">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">
                  {currentPath ? 'Subir Nueva Versión' : 'Cargar Documento Inicial'}
                </label>
                <div className="relative group">
                  <input 
                    type="file" accept=".pdf" required onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-gray-50 group-hover:border-[#0a2d4d] transition-all">
                    <FileUp size={24} className="text-gray-300 group-hover:text-[#0a2d4d] mb-2" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                      {file ? file.name : 'Seleccionar PDF...'}
                    </span>
                  </div>
                </div>
                <button type="submit" disabled={loading || !file} className="w-full py-4 bg-[#0a2d4d] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-blue-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />} 
                  {currentPath ? 'Actualizar Archivo' : 'Confirmar Subida'}
                </button>
              </form>
            )}

            {!currentPath && !isAdmin && (
              <div className="py-12 text-center space-y-4">
                 <XCircle size={48} className="mx-auto text-gray-200" />
                 <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Documento no cargado por administración.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
