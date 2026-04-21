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
import { logAction } from '@/utils/audit-helper'

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

const formatDateChile = (dateString: string | null | undefined) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export default function DocumentMatrixClient({ initialDocuments, stats, departments }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
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
      const doc = initialDocuments.find(d => d.id === docId)
      const { error } = await supabase.from('documents').update({ current_status: 'Aprobado' }).eq('id', docId)
      if (error) throw error

      await logAction(
        'APROBACIÓN',
        'document',
        docId,
        { title: doc?.title },
        `Aprobación de documento: ${doc?.title || docId}`
      )

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
      const { data, error } = await supabase.storage.from('documents').download(path)
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

  const filteredDocuments = initialDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         doc.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDept = selectedDept === '' || doc.department_id === selectedDept
    const matchesStatus = selectedStatus === '' || doc.current_status === selectedStatus
    return matchesSearch && matchesDept && matchesStatus
  })

  return (
    <div className="flex-1 p-8 space-y-8 bg-gray-50 overflow-y-auto">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {stats.map((stat, idx) => {
          const Icon = statIcons[stat.status] || FileText
          const styles = statusStyles[stat.status] || 'text-gray-600 bg-gray-50 border-gray-200'
          const textColor = styles.split(' ')[1]
          return (
            <div 
              key={idx} 
              onClick={() => setSelectedStatus(selectedStatus === stat.status ? '' : stat.status)}
              className={`p-4 rounded-xl border-2 bg-white ${selectedStatus === stat.status ? 'border-[#0a2d4d] ring-2 ring-[#0a2d4d]/10' : 'border-gray-100'} flex flex-col justify-between h-32 transition-all hover:scale-105 cursor-pointer shadow-sm`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-[10px] font-bold uppercase tracking-wider text-gray-400 whitespace-pre-line leading-tight`}>{stat.label}</span>
                <Icon className={textColor} size={18} />
              </div>
              <span className={`text-4xl font-black ${textColor}`}>{stat.count}</span>
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
        
        <select 
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-zinc-900 font-bold focus:outline-none uppercase"
        >
          <option value="">DEPARTAMENTO (TODOS)</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <select 
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-zinc-900 font-bold focus:outline-none"
        >
          <option value="">ESTADO (TODOS)</option>
          <option value="Aprobado">APROBADO</option>
          <option value="Pendiente">PENDIENTE</option>
          <option value="Rechazado">RECHAZADO</option>
          <option value="Vencido">VENCIDO</option>
          <option value="No Cumple">NO CUMPLE</option>
        </select>

        <button 
          onClick={() => {setSearchTerm(''); setSelectedDept(''); setSelectedStatus('')}}
          className="text-gray-400 hover:text-[#0a2d4d] flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 transition-colors"
        >
           Limpiar Filtros
        </button>
      </div>

      {/* Table Section with Fixed Columns */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px] table-fixed">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="w-24 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Gestión</th>
                <th className="w-auto px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Título</th>
                <th className="w-32 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Estado</th>
                <th className="w-32 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Fecha Subida</th>
                <th className="w-32 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center text-red-500">Fecha Límite</th>
                <th className="w-40 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Subido Por</th>
                <th className="w-24 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium">
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors group text-[#0a2d4d]">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1.5 justify-center">
                      {doc.current_status === 'Pendiente' ? (
                        <>
                          <button onClick={() => handleApprove(doc.id)} className="p-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 border border-green-100 transition-colors">
                            {actionLoading === doc.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          </button>
                          <button onClick={() => setRejectModalDoc({id: doc.id, title: doc.title})} className="p-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-100 transition-colors">
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => setReplaceModalDoc({id: doc.id, title: doc.title, path: doc.storage_path})} className="p-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-100 transition-colors">
                          <RefreshCcw size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 overflow-hidden">
                    <div className="truncate">
                      <p className="text-xs font-black uppercase truncate" title={doc.title}>{doc.title}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{doc.id.slice(0, 8)} • {doc.department?.name || 'S/D'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center overflow-hidden">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black border ${statusStyles[doc.current_status]} uppercase tracking-widest whitespace-nowrap`}>
                      ● {doc.current_status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center text-[10px] font-bold text-gray-400 tabular-nums">{formatDateChile(doc.created_at)}</td>
                  <td className="px-4 py-2 text-center text-[10px] font-black text-red-500 tabular-nums">{doc.due_date ? formatDateChile(doc.due_date) : 'SIN LÍMITE'}</td>
                  <td className="px-4 py-2 overflow-hidden">
                    <div className="flex flex-col truncate">
                      <span className="text-[10px] font-black uppercase text-[#0a2d4d] truncate">{doc.uploader ? `${doc.uploader.first_name} ${doc.uploader.last_name}` : 'SISTEMA'}</span>
                      <span className="text-[8px] font-bold uppercase text-gray-400 tracking-tighter truncate">{doc.department?.name || 'S/D'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Ver Online"><Eye size={16} /></button>
                      <button onClick={() => handleDownload(doc.storage_path, doc.file_name, doc.id)} className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Descargar">{downloadLoading === doc.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals remain the same */}
      <UploadDocumentModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} departments={departments} />
      <RejectDocumentModal isOpen={!!rejectModalDoc} onClose={() => setRejectModalDoc(null)} documentId={rejectModalDoc?.id || ''} documentTitle={rejectModalDoc?.title || ''} />
      <ReplaceDocumentModal isOpen={!!replaceModalDoc} onClose={() => setReplaceModalDoc(null)} documentId={replaceModalDoc?.id || ''} documentTitle={replaceModalDoc?.title || ''} currentPath={replaceModalDoc?.path || ''} />
      
      <button onClick={() => setIsUploadModalOpen(true)} className="fixed bottom-8 right-8 w-14 h-14 bg-[#0a2d4d] text-white rounded-xl shadow-xl flex items-center justify-center hover:scale-110 transition-transform group">
        <FileUp size={24} className="group-hover:animate-bounce" />
      </button>
    </div>
  )
}
