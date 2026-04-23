'use client'

import React, { useState, useMemo } from 'react'
import { 
  Search, 
  Filter, 
  FileUp, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  History,
  Download,
  Eye,
  FileText,
  RotateCcw,
  PlusCircle,
  MoreVertical,
  Minus,
  Check,
  AlertOctagon,
  FilterX,
  FileDown,
  ChevronRight,
  ShieldAlert,
  Edit3 as EditIcon,
  Trash2 as TrashIcon,
  Loader2,
  MessageSquare
} from 'lucide-react'
import { Document, DocumentMasterMatrix, Department, Profile } from '@/app/types/database'
import UploadDocumentModal from './UploadDocumentModal'
import ReplaceDocumentModal from './ReplaceDocumentModal'
import RejectDocumentModal from './RejectDocumentModal'
import CreateMasterRuleModal from './CreateMasterRuleModal'
import EditMasterRuleModal from './EditMasterRuleModal'
import { createClient } from '@/utils/supabase/cliente'
import { useRouter } from 'next/navigation'
import { logAction } from '@/utils/audit-helper'
import { deleteMasterRuleAction } from '@/app/actions/master-matrix-actions'

interface Props {
  initialDocuments: (Document & { uploader?: { first_name: string; last_name: string }; department?: { name: string } })[]
  masterRules: (DocumentMasterMatrix & { department?: { name: string }; responsible?: { first_name: string; last_name: string } })[]
  departments: Department[]
  profiles: Profile[]
  userRole: string
  userDeptId: string | null
  userPermissions: { department_id: string; can_view: boolean; can_edit: boolean; can_approve: boolean }[]
}

export default function DocumentMatrixClient({ initialDocuments, masterRules, departments, profiles, userRole, userDeptId, userPermissions }: Props) {
  const [activeTab, setActiveTab] = useState<'user' | 'admin'>(userRole === 'admin' ? 'admin' : 'user')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('Todos')
  const [selectedMes, setSelectedMes] = useState('Todos')
  const [selectedAnio, setSelectedAnio] = useState(new Date().getFullYear().toString())
  
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadPreFill, setUploadPreFill] = useState<{title: string, department_id: string, master_id: string} | null>(null)
  const [isCreateMasterOpen, setIsCreateMasterOpen] = useState(false)
  const [editMasterRule, setEditMasterRule] = useState<DocumentMasterMatrix | null>(null)
  const [selectedDocForAction, setSelectedDocForAction] = useState<any>(null)
  
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  // --- SMART PENDING LOGIC ---
  const pendingRequirements = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const thisMonth = new Date().getMonth()
    const thisYear = new Date().getFullYear()

    return masterRules.filter(rule => {
      // Find if there's any file uploaded for this rule in the current period
      const uploads = initialDocuments.filter(doc => doc.master_id === rule.id)
      
      if (rule.frequency === 'DIARIO') {
        const hasToday = uploads.some(doc => doc.created_at.split('T')[0] === today)
        return !hasToday
      }
      
      if (rule.frequency === 'MENSUAL') {
        const hasThisMonth = uploads.some(doc => {
          const d = new Date(doc.created_at)
          return d.getMonth() === thisMonth && d.getFullYear() === thisYear
        })
        return !hasThisMonth
      }

      return true // For single loads or other frequencies not yet strict
    })
  }, [masterRules, initialDocuments])

  // --- DYNAMIC FILTERS ---
  const availableYears = useMemo(() => {
    const years = new Set<string>()
    initialDocuments.forEach(doc => years.add(new Date(doc.created_at).getFullYear().toString()))
    return Array.from(years).sort((a, b) => b.localeCompare(a))
  }, [initialDocuments])

  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    initialDocuments.forEach(doc => {
      const date = new Date(doc.created_at)
      if (selectedAnio === 'Todos' || date.getFullYear().toString() === selectedAnio) {
        months.add((date.getMonth() + 1).toString())
      }
    })
    return Array.from(months).sort((a, b) => parseInt(a) - parseInt(b))
  }, [initialDocuments, selectedAnio])

  const monthNames: Record<string, string> = {
    '1': 'Enero', '2': 'Febrero', '3': 'Marzo', '4': 'Abril', '5': 'Mayo', '6': 'Junio',
    '7': 'Julio', '8': 'Agosto', '9': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
  }

  const canEditDept = (deptId: string) => {
    if (userRole === 'admin') return true
    const perm = userPermissions.find(p => p.department_id === deptId)
    return perm?.can_edit || false
  }

  const handleOpenUploadWithMaster = (rule: any) => {
    setUploadPreFill({ title: rule.title, department_id: rule.department_id, master_id: rule.id })
    setIsUploadOpen(true)
  }

  const filteredDocuments = useMemo(() => {
    return initialDocuments.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesDept = selectedDept ? doc.department_id === selectedDept : true
      const matchesStatus = selectedStatus !== 'Todos' ? doc.current_status === selectedStatus : true
      const docDate = new Date(doc.created_at)
      const matchesMes = selectedMes !== 'Todos' ? (docDate.getMonth() + 1).toString() === selectedMes : true
      const matchesAnio = selectedAnio !== 'Todos' ? docDate.getFullYear().toString() === selectedAnio : true
      return matchesSearch && matchesDept && matchesStatus && matchesMes && matchesAnio
    })
  }, [initialDocuments, searchTerm, selectedDept, selectedStatus, selectedMes, selectedAnio])

  const kpis = useMemo(() => {
    const counts = { Pendiente: 0, Aprobado: 0, Rechazado: 0, Vencido: 0, 'No Cumple': 0 }
    initialDocuments.forEach(doc => { if (counts[doc.current_status] !== undefined) counts[doc.current_status]++ })
    return counts
  }, [initialDocuments])

  const handleStatusUpdate = async (docId: string, newStatus: string) => {
    const { error } = await supabase.from('documents').update({ current_status: newStatus }).eq('id', docId)
    if (!error) {
      await logAction('VALIDACIÓN', 'document', docId, { status: newStatus }, `Admin aprobó el documento`)
      router.refresh()
    }
  }

  const handleDeleteRule = async (id: string, title: string) => {
    if (!confirm(`¿Está seguro de eliminar la regla "${title}"?`)) return
    setDeletingId(id)
    const result = await deleteMasterRuleAction(id, title)
    if (result.success) router.refresh()
    else alert(result.error)
    setDeletingId(null)
  }

  const handleDownloadTemplate = async (path: string) => {
    setDownloadingPath(path)
    try {
      const { data, error } = await supabase.storage.from('documents').download(path)
      if (error) throw error
      const url = window.URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', path.split('/').pop() || 'plantilla.pdf')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) { alert('Error al descargar.') } finally { setDownloadingPath(null) }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedDept('')
    setSelectedStatus('Todos')
    setSelectedMes('Todos')
    setSelectedAnio(new Date().getFullYear().toString())
  }

  return (
    <div className="flex-1 p-8 space-y-8 bg-gray-50 overflow-y-auto font-sans text-[#0a2d4d]">
      
      <div className="max-w-[1600px] mx-auto flex justify-end">
          <div className="flex gap-2 p-1.5 bg-gray-200/50 rounded-2xl border border-gray-200 shadow-inner backdrop-blur-sm">
              <button onClick={() => setActiveTab('user')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'user' ? 'bg-white text-[#0a2d4d] shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>PANEL USUARIOS</button>
              {(userRole === 'admin' || userRole === 'sub_admin') && (
                <button onClick={() => setActiveTab('admin')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'admin' ? 'bg-white text-[#0a2d4d] shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}>PANEL ADMIN</button>
              )}
          </div>
      </div>

      {activeTab === 'user' && (
        <>
          <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-5 gap-6 mb-10 text-[#0a2d4d]">
            {[
              { label: 'Pendientes', key: 'Pendiente', color: 'text-blue-500', icon: Clock },
              { label: 'Aprobados', key: 'Aprobado', color: 'text-green-600', icon: CheckCircle2 },
              { label: 'Rechazados', key: 'Rechazado', color: 'text-red-600', icon: XCircle },
              { label: 'Vencidos', key: 'Vencido', color: 'text-gray-600', icon: AlertTriangle },
              { label: 'No Cumple', key: 'No Cumple', color: 'text-purple-600', icon: ShieldAlert },
            ].map((card, i) => (
              <div key={i} onClick={() => setSelectedStatus(card.key)} className="bg-white p-6 rounded-xl border border-gray-100 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.06)] h-32 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-all group">
                <div className="flex justify-between items-start w-full">
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{card.label}</span>
                   <card.icon className={`w-4 h-4 ${card.color} opacity-60 group-hover:scale-110 transition-transform`} />
                </div>
                <p className={`text-4xl font-black ${card.color}`}>{(kpis as any)[card.key] || 0}</p>
              </div>
            ))}
          </div>

          <div className="max-w-[1600px] mx-auto bg-white p-5 rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.06)] border border-gray-100 flex flex-wrap gap-4 items-center mb-8">
              <div className="relative flex-1 min-w-[300px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar documento..." className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 text-xs font-medium text-zinc-900 shadow-inner" />
              </div>
              <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-black uppercase text-[#0a2d4d] outline-none cursor-pointer"><option value="">Departamento: Todos</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
              <select value={selectedMes} onChange={(e) => setSelectedMes(e.target.value)} className="py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-black uppercase text-[#0a2d4d] outline-none cursor-pointer"><option value="Todos">Mes: Todos</option>{availableMonths.map(m => <option key={m} value={m}>{monthNames[m]}</option>)}</select>
              <select value={selectedAnio} onChange={(e) => setSelectedAnio(e.target.value)} className="py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-black uppercase text-[#0a2d4d] outline-none cursor-pointer"><option value="Todos">Año: Todos</option>{availableYears.map(y => <option key={y} value={y}>{y}</option>)}</select>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-black uppercase text-[#0a2d4d] outline-none cursor-pointer">
                <option value="Todos">Estado: Todos</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Aprobado">Aprobado</option>
                <option value="Rechazado">Rechazado</option>
                <option value="Vencido">Vencido</option>
                <option value="No Cumple">No Cumple</option>
              </select>
              <button onClick={clearFilters} className="px-6 py-3 bg-white border border-gray-200 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all flex items-center gap-2"><FilterX size={16} /> Limpiar Filtros</button>
          </div>

          <div className="max-w-[1600px] mx-auto space-y-12">
              {pendingRequirements.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0a2d4d] px-2 flex items-center gap-2"><FileDown className="text-blue-600" size={16} /> Requerimientos Pendientes de Carga</h3>
                    <div className="bg-white rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <tr><th className="px-8 py-5 text-zinc-600">Documento</th><th className="px-8 py-5 text-zinc-600">Fecha Subida</th><th className="px-8 py-5 text-center text-zinc-600">Estado</th><th className="px-8 py-5 text-center text-zinc-600">Fecha Límite</th><th className="px-8 py-5 text-zinc-600">Encargado</th><th className="px-8 py-5 text-center text-zinc-600">Guía/Plantilla</th><th className="px-8 py-5 text-right text-zinc-600">Acciones</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-[11px] font-medium">
                                {pendingRequirements.map((rule) => (
                                  <tr key={rule.id} className="hover:bg-blue-50/20 transition-colors">
                                      <td className="px-8 py-6 font-black uppercase text-[#0a2d4d]">{rule.title}</td>
                                      <td className="px-8 py-6 text-gray-300 italic">Pendiente de Carga</td>
                                      <td className="px-8 py-6 text-center"><span className="px-3 py-1 bg-yellow-50 text-yellow-600 border border-yellow-100 rounded-full text-[9px] font-black uppercase">Pendiente</span></td>
                                      <td className="px-8 py-6 text-center text-red-500 font-bold tabular-nums">HOY {rule.standard_due_time}</td>
                                      <td className="px-8 py-6 uppercase font-bold text-gray-500">{rule.responsible ? `${rule.responsible.first_name} ${rule.responsible.last_name}` : 'JEFE AREA'}</td>
                                      <td className="px-8 py-6 text-center">{rule.template_storage_path ? (<button onClick={() => handleDownloadTemplate(rule.template_storage_path!)} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:scale-110 transition-transform">{downloadingPath === rule.template_storage_path ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}</button>) : (<Minus size={16} className="mx-auto text-gray-200" />)}</td>
                                      <td className="px-8 py-6 text-right"><button onClick={() => handleOpenUploadWithMaster(rule)} disabled={!canEditDept(rule.department_id)} className="px-4 py-2 bg-[#0a2d4d] text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md hover:bg-blue-900 transition-all flex items-center gap-2 ml-auto disabled:opacity-30"><FileUp size={14} /> Subir Archivo</button></td>
                                  </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
              )}

              <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-2 flex items-center gap-2"><History size={16} /> Historial de Cargas Realizadas</h3>
                  <div className="bg-white rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden opacity-95 text-[#0a2d4d]">
                      <table className="w-full text-left border-collapse">
                          <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              <tr><th className="px-8 py-4 text-zinc-600">Documento</th><th className="px-8 py-4 text-zinc-600">Fecha Subida</th><th className="px-8 py-4 text-center text-zinc-600">Estado</th><th className="px-8 py-4 text-center text-zinc-600">Fecha Límite</th><th className="px-8 py-4 text-zinc-600">Subido por</th><th className="px-8 py-4 text-center text-zinc-600">Acceso</th><th className="px-8 py-4 text-right text-zinc-600">Acciones Admin</th></tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 text-[11px]">
                              {filteredDocuments.map((doc) => (
                                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-8 py-5">
                                        <p className="font-black uppercase text-[#0a2d4d]">{doc.title}</p>
                                        {doc.current_status === 'Rechazado' && doc.rejection_comment && (
                                          <div className="mt-1.5 flex items-start gap-2 p-2 bg-red-50 rounded-lg border border-red-100 max-w-md">
                                             <MessageSquare size={10} className="text-red-400 mt-0.5 shrink-0" />
                                             <p className="text-[9px] font-medium text-red-700 leading-tight italic">"{doc.rejection_comment}"</p>
                                          </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-5 text-gray-400 tabular-nums">{new Date(doc.created_at).toLocaleDateString('es-CL')} {new Date(doc.created_at).toLocaleTimeString('es-CL', {hour:'2-digit', minute:'2-digit'})}</td>
                                    <td className="px-8 py-5 text-center"><span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${doc.current_status === 'Aprobado' ? 'bg-green-100 text-green-700 border border-green-200' : doc.current_status === 'Rechazado' ? 'bg-red-100 text-red-700 border border-red-200' : doc.current_status === 'Vencido' ? 'bg-gray-100 text-gray-700 border border-gray-200' : doc.current_status === 'No Cumple' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'}`}>{doc.current_status}</span></td>
                                    <td className="px-8 py-5 text-center text-gray-400 tabular-nums">{doc.due_date ? new Date(doc.due_date).toLocaleDateString('es-CL') : '--'}</td>
                                    <td className="px-8 py-5 uppercase font-bold text-gray-500">{doc.uploader ? `${doc.uploader.first_name} ${doc.uploader.last_name}` : 'SISTEMA'}</td>
                                    <td className="px-8 py-5 text-center"><button className="p-2 text-blue-600 hover:scale-110 transition-transform"><Eye size={16} /></button></td>
                                    <td className="px-8 py-5 text-right">{userRole === 'admin' && doc.current_status === 'Pendiente' && (<div className="flex justify-end gap-2"><button onClick={() => handleStatusUpdate(doc.id, 'Aprobado')} className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-[9px] font-black uppercase border border-green-200 hover:bg-green-600 hover:text-white transition-all">Validar</button><button onClick={() => setSelectedDocForAction(doc)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[9px] font-black uppercase border border-red-200 hover:bg-red-600 hover:text-white transition-all">Rechazar</button></div>)}</td>
                                </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
        </>
      )}

      {activeTab === 'admin' && (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-200">
            <div className="flex justify-between items-end px-2">
                <div><h3 className="text-sm font-black uppercase tracking-widest text-[#0a2d4d]">Configuración Maestra</h3><p className="text-xs text-gray-400 mt-1 italic">Define las reglas de carga periódica para toda la planta.</p></div>
                <button onClick={() => setIsCreateMasterOpen(true)} className="px-8 py-4 bg-[#0a2d4d] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-3"><PlusCircle size={20} /> CREAR NUEVO DOCUMENTO</button>
            </div>
            <div className="bg-white rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <tr><th className="px-8 py-5 text-zinc-600">Documento</th><th className="px-8 py-5 text-zinc-600">Fecha Subida</th><th className="px-8 py-5 text-zinc-600">Departamento</th><th className="px-8 py-5 text-center text-zinc-600">Estado</th><th className="px-8 py-5 text-center text-zinc-600">Fecha Límite</th><th className="px-8 py-5 text-zinc-600">Encargado</th><th className="px-8 py-5 text-center text-zinc-600">Guía/Plantilla</th><th className="px-8 py-5 text-right text-zinc-600">Acciones</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-[11px] font-medium">
                        {masterRules.map((rule) => (
                          <tr key={rule.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-8 py-6 font-black uppercase text-[#0a2d4d]">{rule.title}</td>
                              <td className="px-8 py-6 text-gray-300 italic">Maestro (Cíclico)</td>
                              <td className="px-8 py-6"><span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg font-black uppercase text-[9px]">{rule.department?.name}</span></td>
                              <td className="px-8 py-6 text-center"><span className="px-3 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full text-[9px] font-black uppercase">Activo</span></td>
                              <td className="px-8 py-6 text-center text-orange-600 font-bold uppercase">{rule.frequency} @ {rule.standard_due_time}</td>
                              <td className="px-8 py-6 uppercase font-bold text-gray-500">{rule.responsible ? `${rule.responsible.first_name} ${rule.responsible.last_name}` : 'JEFE AREA'}</td>
                              <td className="px-8 py-6 text-center">{rule.template_storage_path ? (<button onClick={() => handleDownloadTemplate(rule.template_storage_path!)} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:scale-110 transition-transform">{downloadingPath === rule.template_storage_path ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}</button>) : (<Minus size={14} className="mx-auto text-gray-200" />)}</td>
                              <td className="px-8 py-6 text-right"><div className="flex justify-end gap-3 text-gray-300"><button onClick={() => setEditMasterRule(rule)} className="p-1 hover:text-blue-600 transition-colors"><EditIcon size={18} /></button><button onClick={() => handleDeleteRule(rule.id, rule.title)} disabled={deletingId === rule.id} className="p-1 hover:text-red-600 transition-colors disabled:opacity-50">{deletingId === rule.id ? <Loader2 size={18} className="animate-spin" /> : <TrashIcon size={18} />}</button></div></td>
                          </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      <UploadDocumentModal 
        isOpen={isUploadOpen} 
        onClose={() => {setIsUploadOpen(false); setUploadPreFill(null)}} 
        departments={departments} 
        preFill={uploadPreFill}
      />
      <CreateMasterRuleModal isOpen={isCreateMasterOpen} onClose={() => setIsCreateMasterOpen(false)} departments={departments} profiles={profiles} />
      <EditMasterRuleModal isOpen={!!editMasterRule} onClose={() => setEditMasterRule(null)} departments={departments} profiles={profiles} rule={editMasterRule} />
      <RejectDocumentModal isOpen={!!selectedDocForAction} onClose={() => setSelectedDocForAction(null)} documentId={selectedDocForAction?.id} documentTitle={selectedDocForAction?.title} />
    </div>
  )
}
