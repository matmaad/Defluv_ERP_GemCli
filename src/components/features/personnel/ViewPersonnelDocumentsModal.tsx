'use client'

import React, { useState } from 'react'
import { X, FileText, Download, Eye, ExternalLink, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/cliente'

interface Props {
  isOpen: boolean
  onClose: () => void
  personnelName: string
  cvPath?: string
  certPath?: string
}

export default function ViewPersonnelDocumentsModal({ isOpen, onClose, personnelName, cvPath, certPath }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const supabase = createClient()

  if (!isOpen) return null

  const handleDownload = async (path: string, fileName: string) => {
    setLoading(path)
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(path)

      if (error) throw error

      // Create a link and trigger download
      const url = window.URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error downloading:', error)
      alert('Error al descargar el archivo.')
    } finally {
      setLoading(null)
    }
  }

  const handlePreview = async (path: string) => {
    setLoading(path)
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(path, 60) // 1 minute link

      if (error) throw error
      window.open(data.signedUrl, '_blank')
    } catch (error) {
      console.error('Error previewing:', error)
      alert('Error al abrir la vista previa.')
    } finally {
      setLoading(null)
    }
  }

  const hasDocs = cvPath || certPath

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a2d4d]/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 text-[#0a2d4d]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-[#0a2d4d] text-white flex items-center justify-center shadow-lg shadow-blue-900/20">
                <FileText size={20} />
             </div>
             <div>
                <h3 className="text-sm font-black uppercase tracking-widest">Documentación Vinculada</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Colaborador: {personnelName}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-4">
          {!hasDocs ? (
            <div className="py-12 text-center space-y-3">
               <FileText size={48} className="text-gray-100 mx-auto" />
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No hay documentos cargados para este perfil.</p>
            </div>
          ) : (
            <div className="space-y-3">
               {cvPath && (
                 <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl group hover:border-[#0a2d4d]/20 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600">
                          <FileText size={20} />
                       </div>
                       <div>
                          <p className="text-xs font-black uppercase tracking-tight">Curriculum Vitae (CV)</p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase">Documento Principal</p>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => handlePreview(cvPath)}
                        disabled={!!loading}
                        className="p-2 bg-white text-gray-400 hover:text-blue-600 rounded-lg shadow-sm border border-gray-100 transition-all"
                        title="Ver Online"
                       >
                         {loading === cvPath ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                       </button>
                       <button 
                        onClick={() => handleDownload(cvPath, `CV_${personnelName.replace(/\s+/g, '_')}.pdf`)}
                        disabled={!!loading}
                        className="p-2 bg-[#0a2d4d] text-white hover:bg-blue-900 rounded-lg shadow-lg shadow-blue-900/10 transition-all"
                        title="Descargar"
                       >
                         <Download size={16} />
                       </button>
                    </div>
                 </div>
               )}

               {certPath && (
                 <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl group hover:border-[#0a2d4d]/20 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-green-600">
                          <FileText size={20} />
                       </div>
                       <div>
                          <p className="text-xs font-black uppercase tracking-tight">Certificados / Otros</p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase">Anexos de Personal</p>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => handlePreview(certPath)}
                        disabled={!!loading}
                        className="p-2 bg-white text-gray-400 hover:text-blue-600 rounded-lg shadow-sm border border-gray-100 transition-all"
                       >
                         {loading === certPath ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                       </button>
                       <button 
                        onClick={() => handleDownload(certPath, `Certificado_${personnelName.replace(/\s+/g, '_')}.pdf`)}
                        disabled={!!loading}
                        className="p-2 bg-[#0a2d4d] text-white hover:bg-blue-900 rounded-lg shadow-lg shadow-blue-900/10 transition-all"
                       >
                         <Download size={16} />
                       </button>
                    </div>
                 </div>
               )}
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-end">
           <button 
            onClick={onClose}
            className="px-8 py-3 border border-gray-200 rounded-xl text-[10px] font-black text-gray-400 hover:bg-gray-100 transition-all uppercase tracking-widest"
           >
             Cerrar Ventana
           </button>
        </div>
      </div>
    </div>
  )
}
