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
  RefreshCcw,
  User
} from 'lucide-react'
import { DocumentWithDetails, DocStatus } from '@/app/types/database'
import UploadDocumentModal from './UploadDocumentModal'
import RejectDocumentModal from './RejectDocumentModal'
import ReplaceDocumentModal from './ReplaceDocumentModal'
import { createClient } from '@/utils/supabase/cliente'
import { useRouter } from 'next/navigation'

interface Props {
  initialDocuments: DocumentWithDetails[]
  stats: {
    label: string
    count: number
    status: DocStatus
  }[]
  departments: { id: string; name: string }[]
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
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  const handleApprove = async (docId: string) => {
    setActionLoading(docId)
    try {
      const { error } = await supabase
        .from('documents')
        .update({ current_status: 'Aprobado' })
        .eq('id', docId)
      
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error('Error approving:', error)
      alert('Error al aprobar el documento.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDownload = async (path: string, fileName: string, docId: string) => {
    setDownloadLoading(docId)
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(path)

      if (error) throw error

      const url = window.URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Download error:', error)
      alert('Error al descargar el archivo.')
    } finally {
      setDownloadLoading(null)
    }
  }

  const handlePreview = async (path: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(path, 60)

      if (error) throw error
      window.open(data.signedUrl, '_blank')
    } catch (error) {
      console.error('Preview error:', error)
      alert('Error al abrir la vista previa.')
    }
  }

  const filteredDocuments = initialDocuments.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    doc.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex-1 p-8 space-y-8 bg-gray-50 overflow-y-auto">
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

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por ID o título..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-zinc-900 placeholder:text-gray-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-zinc-900 font-bold focus:outline-none uppercase">
          <option>DEPARTAMENTO</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <select className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-zinc-900 font-bold focus:outline-none">
          <option>ESTADO</option>
          <option>Aprobado</option>
          <option>Pendiente</option>
          <option>Rechazado</option>
          <option>Vencido</option>
          <option>No Cumple</option>
        </select>

        <button className="text-gray-400 hover:text-gray-600 flex items-center gap-2 text-sm font-medium px-4">
           LIMPIAR
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center w-32">Acciones Rápidas</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Título</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Estado</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Fecha Subida</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center text-red-500">Fecha Límite</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Subido Por</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Más</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium">
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors group text-[#0a2d4d]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-center">
                      {doc.current_status === 'Pendiente' ? (
                        <>
                          <button 
                            onClick={() => handleApprove(doc.id)}
                            disabled={!!actionLoading}
                            className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors border border-green-100"
                            title="Aprobar"
                          >
                            {actionLoading === doc.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                          </button>
                          <button 
                            onClick={() => setRejectModalDoc({id: doc.id, title: doc.title})}
                            disabled={!!actionLoading}
                            className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                            title="Rechazar"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => setReplaceModalDoc({id: doc.id, title: doc.title, path: doc.storage_path})}
                          className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                          title="Reemplazar / Nueva Versión"
                        >
                          <RefreshCcw size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-xs font-black uppercase truncate">{doc.title}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{doc.id.slice(0, 8)} • {doc.department?.name || 'S/D'}</p>
                      {doc.rejection_comment && doc.current_status === 'Rechazado' && (
                        <p className="text-[9px] text-red-500 font-black mt-1 uppercase italic border-l-2 border-red-500 pl-2">Motivo: {doc.rejection_comment}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black border ${statusStyles[doc.current_status]} uppercase tracking-widest`}>
                      ● {doc.current_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 tabular-nums">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-center text-[10px] font-black text-red-500 tabular-nums">
                    {doc.due_date ? new Date(doc.due_date).toLocaleDateString() : 'SIN LÍMITE'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black uppercase text-gray-500 truncate max-w-[150px] block">
                       {doc.uploader ? `${doc.uploader.first_name} ${doc.uploader.last_name}` : 'SISTEMA'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handlePreview(doc.storage_path)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver Online"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => handleDownload(doc.storage_path, doc.file_name, doc.id)}
                        disabled={downloadLoading === doc.id}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Descargar Archivo"
                      >
                        {downloadLoading === doc.id ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDocuments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm font-black uppercase tracking-widest">
                    No se encontraron documentos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
