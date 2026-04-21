'use client'

import React, { useState } from 'react'
import { 
  X, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react'
import { createClient } from '@/utils/supabase/cliente'
import { useRouter } from 'next/navigation'

interface Props {
  isOpen: boolean
  onClose: () => void
  documentId: string
  documentTitle: string
}

export default function RejectDocumentModal({ isOpen, onClose, documentId, documentTitle }: Props) {
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  if (!isOpen) return null

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('documents')
        .update({ 
          current_status: 'Rechazado',
          rejection_comment: comment 
        })
        .eq('id', documentId)

      if (error) throw error

      onClose()
      router.refresh()
    } catch (error) {
      console.error('Error rejecting:', error)
      alert('Error al rechazar el documento.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#0a2d4d]/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-red-50/50">
          <div className="flex items-center gap-3 text-red-600">
             <AlertCircle size={20} />
             <h3 className="text-sm font-bold uppercase tracking-widest">Rechazar Documento</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleReject} className="p-8 space-y-6">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">Documento Seleccionado</p>
            <p className="text-sm font-bold text-[#0a2d4d] bg-gray-50 p-3 rounded-xl border border-gray-100">{documentTitle}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">Motivo del Rechazo</label>
            <textarea 
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm font-medium resize-none text-zinc-900 placeholder:text-gray-500"
              placeholder="Indique los cambios necesarios..."
            ></textarea>
          </div>

          <div className="flex gap-4">
             <button 
              type="button" onClick={onClose}
              className="flex-1 py-3.5 border border-gray-200 rounded-xl text-[10px] font-bold text-gray-400 hover:bg-gray-50 transition-all uppercase tracking-widest"
             >
               Cancelar
             </button>
             <button 
              type="submit" disabled={loading || !comment}
              className="flex-[2] py-3.5 bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-red-900/20 hover:bg-red-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
             >
               {loading ? <Loader2 size={16} className="animate-spin" /> : 'Confirmar Rechazo'}
             </button>
          </div>
        </form>
      </div>
    </div>
  )
}
