'use client'

import React, { useState } from 'react'
import { 
  Search, 
  Filter, 
  FileText, 
  AlertCircle, 
  Clock, 
  XCircle, 
  CheckCircle2, 
  Eye, 
  Download, 
  ChevronLeft,
  ChevronRight,
  FileUp,
  Check,
  X,
  Loader2,
  RefreshCcw
} from 'lucide-react'
import { Document, DocStatus } from '@/app/types/database'
import UploadDocumentModal from './UploadDocumentModal'
import RejectDocumentModal from './RejectDocumentModal'
import ReplaceDocumentModal from './ReplaceDocumentModal'
import { createClient } from '@/utils/supabase/cliente'
import { useRouter } from 'next/navigation'

interface Props {
  initialDocuments: Document[]
  stats: {
    label: string
    count: number
    status: DocStatus
  }[]
  departments: { department_id: string; name: string }[]
}

const statusStyles: Record<string, string> = {
  'Aprobado': 'bg-green-100 text-green-700 border-green-200',
  'Pendiente': 'bg-blue-100 text-blue-700 border-blue-200',
  'Rechazado': 'bg-red-100 text-red-700 border-red-200',
  'Vencido': 'bg-gray-100 text-gray-700 border-gray-200',
  'No Cumple': 'bg-purple-100 text-purple-700 border-purple-200',
}

const statIcons: Record<string, any> = {
  'Pendiente': FileText,
  'Vencido': Clock,
  'Rechazado': XCircle,
  'Aprobado': CheckCircle2,
  'No Cumple': AlertCircle,
}

export default function DocumentMatrixClient({ initialDocuments, stats, departments }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [rejectModalDoc, setRejectModalDoc] = useState<{id: string, title: string} | null>(null)
  const [replaceModalDoc, setReplaceModalDoc] = useState<{id: string, title: string, path: string} | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  const handleApprove = async (docId: string) => {
    setActionLoading(docId)
    try {
      const { error } = await supabase
        .from('documents')
        .update({ current_status: 'Aprobado' })
        .eq('document_id', docId)
      
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error('Error approving:', error)
      alert('Error al aprobar el documento.')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredDocuments = initialDocuments.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    doc.document_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex-1 p-8 space-y-8 bg-gray-50 overflow-y-auto">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[#0a2d4d]">Matriz de Documentos</h1>
          <p className="text-gray-500 text-sm">Gestión y control de todos los documentos del SGC.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {stats.map((stat, idx) => {
          const Icon = statIcons[stat.status] || FileText
          const styles = statusStyles[stat.status] || 'text-gray-600 bg-gray-50 border-gray-200'
          const textColor = styles.split(' ')[1]
          return (
            <div key={idx} className={`p-4 rounded-xl border-2 bg-white border-gray-100 flex flex-col justify-between h-32 transition-transform hover:scale-105 cursor-pointer`}>
              <div className="flex justify-between items-start">
                <span className={`text-[10px] font-bold uppercase tracking-wider text-gray-400`}>{stat.label}</span>
                <Icon className={textColor} size={18} />
              </div>
              <span className={`text-4xl font-bold ${textColor}`}>{stat.count}</span>
            </div>
          )
        })}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center w-32">Acciones Rápidas</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">ID</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">TÍTULO</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">ESTADO</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredDocuments.map((doc) => (
              <tr key={doc.document_id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 justify-center">
                    {doc.current_status === 'Pendiente' ? (
                      <>
                        <button 
                          onClick={() => handleApprove(doc.document_id)}
                          disabled={!!actionLoading}
                          className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors border border-green-100"
                          title="Aprobar"
                        >
                          {actionLoading === doc.document_id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        </button>
                        <button 
                          onClick={() => setRejectModalDoc({id: doc.document_id, title: doc.title})}
                          disabled={!!actionLoading}
                          className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                          title="Rechazar"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => setReplaceModalDoc({id: doc.document_id, title: doc.title, path: doc.storage_path})}
                        className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                        title="Reemplazar / Nueva Versión"
                      >
                        <RefreshCcw size={16} />
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-xs font-bold text-[#0a2d4d]">{doc.document_id.slice(0, 8)}</td>
                <td className="px-6 py-4">
                  <span className="text-xs font-semibold text-gray-700 block max-w-xs truncate">{doc.title}</span>
                  {doc.rejection_comment && doc.current_status === 'Rechazado' && (
                    <p className="text-[9px] text-red-500 font-bold mt-1 uppercase italic">Motivo: {doc.rejection_comment}</p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-bold border ${statusStyles[doc.current_status]}`}>
                    ● {doc.current_status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Eye size={16} />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg">
                      <Download size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredDocuments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                  No se encontraron documentos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FAB Button */}
      <button 
        onClick={() => setIsUploadModalOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#0a2d4d] text-white rounded-xl shadow-xl flex items-center justify-center hover:scale-110 transition-transform group"
      >
        <FileUp size={24} className="group-hover:animate-bounce" />
      </button>

      <UploadDocumentModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        departments={departments}
      />

      <RejectDocumentModal 
        isOpen={!!rejectModalDoc}
        onClose={() => setRejectModalDoc(null)}
        documentId={rejectModalDoc?.id || ''}
        documentTitle={rejectModalDoc?.title || ''}
      />

      <ReplaceDocumentModal 
        isOpen={!!replaceModalDoc}
        onClose={() => setReplaceModalDoc(null)}
        documentId={replaceModalDoc?.id || ''}
        documentTitle={replaceModalDoc?.title || ''}
        currentPath={replaceModalDoc?.path || ''}
      />
    </div>
  )
}
