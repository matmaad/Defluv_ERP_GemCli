'use client'

import React, { useState } from 'react'
import { X, FileUp, Loader2, CheckCircle2, FileText, FileSpreadsheet, File } from 'lucide-react'
import { createClient } from '@/utils/supabase/cliente'
import { useRouter } from 'next/navigation'

interface Props {
  isOpen: boolean
  onClose: () => void
  personnelId: string
  personnelName: string
}

export default function UploadPersonnelDocumentModal({ isOpen, onClose, personnelId, personnelName }: Props) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [docType, setDocType] = useState('CV')
  
  const supabase = createClient()
  const router = useRouter()

  if (!isOpen) return null

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    
    try {
      // 1. Upload to Storage (personnel_docs bucket)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${docType}-${personnelName.replace(/\s+/g, '_')}.${fileExt}`
      const filePath = `${personnelId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents') // Reusing documents bucket for now, or use a specific one
        .upload(`personnel/${filePath}`, file)

      if (uploadError) throw uploadError

      // 2. Update Personal Record (Assuming we update CV or Certificates path)
      const updateField = docType === 'CV' ? 'cv_storage_path' : 'certificates_storage_path'
      
      const { error: dbError } = await supabase
        .from('personal_records')
        .update({ [updateField]: `personnel/${filePath}` })
        .eq('id', personnelId)

      if (dbError) throw dbError

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
        router.refresh()
      }, 2000)

    } catch (error) {
      console.error('Error uploading personnel doc:', error)
      alert('Error al subir el archivo. Verifique su conexión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a2d4d]/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3 text-[#0a2d4d]">
             <div className="w-10 h-10 rounded-xl bg-[#0a2d4d] text-white flex items-center justify-center shadow-lg shadow-blue-900/20">
                <FileUp size={20} />
             </div>
             <div>
                <h3 className="text-sm font-black uppercase tracking-widest">Cargar Documentación</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Personal: {personnelName}</p>
             </div>
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
             <h4 className="text-xl font-black text-[#0a2d4d]">¡Archivo Guardado!</h4>
             <p className="text-sm text-gray-500">La documentación se ha vinculado al perfil.</p>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tipo de Documento</label>
                <select 
                  value={docType} onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-black text-[#0a2d4d]"
                >
                  <option value="CV">Curriculum Vitae (CV)</option>
                  <option value="Certificado">Certificado de Antecedentes / Título</option>
                  <option value="Contrato">Contrato de Trabajo</option>
                  <option value="Otro">Otro Documento</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Seleccionar Archivo</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    required 
                    accept=".pdf,.txt,.xlsx,.docx,.doc" 
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden" 
                    id="personnel-file"
                  />
                  <label 
                    htmlFor="personnel-file"
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 cursor-pointer group-hover:border-[#0a2d4d] group-hover:bg-blue-50 transition-all"
                  >
                    <div className="flex gap-2 mb-3">
                       <FileText size={24} className="text-gray-300" />
                       <FileSpreadsheet size={24} className="text-gray-300" />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 group-hover:text-[#0a2d4d] uppercase tracking-widest text-center px-4">
                      {file ? file.name : 'Haz clic para subir (PDF, TXT, Excel, Word)'}
                    </span>
                    <span className="text-[8px] text-gray-400 mt-2 uppercase tracking-tighter">Máximo 10MB</span>
                  </label>
                </div>
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
                type="submit" disabled={loading || !file}
                className="flex-[2] py-3.5 bg-[#0a2d4d] text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-900/30 hover:bg-blue-900 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
               >
                 {loading ? <Loader2 size={16} className="animate-spin" /> : 'Confirmar Carga'}
               </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
