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
  FileUp
} from 'lucide-react'
import { Document, DocStatus } from '@/app/types/database'

interface Props {
  initialDocuments: Document[]
  stats: {
    label: string
    count: number
    status: DocStatus
  }[]
}

const statusStyles: Record<string, string> = {
  'Aprobado': 'bg-green-100 text-green-700 border-green-200',
  'Pendiente': 'bg-blue-100 text-blue-700 border-blue-200',
  'Corregir': 'bg-orange-100 text-orange-700 border-orange-200',
  'Rechazado': 'bg-red-100 text-red-700 border-red-200',
  'Vencido': 'bg-gray-100 text-gray-700 border-gray-200',
  'No Cumple': 'bg-purple-100 text-purple-700 border-purple-200',
}

const statIcons: Record<string, any> = {
  'Pendiente': FileText,
  'Corregir': AlertCircle,
  'Vencido': Clock,
  'Rechazado': XCircle,
  'Aprobado': CheckCircle2,
  'No Cumple': AlertCircle,
}

export default function DocumentMatrixClient({ initialDocuments, stats }: Props) {
  const [searchTerm, setSearchTerm] = useState('')

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
        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <Filter size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#0a2d4d]">USUARIO SISTEMA</span>
            <div className="w-10 h-10 rounded-lg bg-gray-200 border-2 border-white shadow-sm overflow-hidden">
               <img src="https://ui-avatars.com/api/?name=User&background=0a2d4d&color=fff" alt="User" />
            </div>
          </div>
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

      {/* Filters & Actions bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por ID o título..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 focus:outline-none">
          <option>DEPARTAMENTO</option>
        </select>

        <select className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 focus:outline-none">
          <option>ESTADO</option>
        </select>

        <button className="text-gray-400 hover:text-gray-600 flex items-center gap-2 text-sm font-medium px-4">
           LIMPIAR
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">ID</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">TÍTULO</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">DEPARTAMENTO</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">RESPONSABLE</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">ESTADO</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">CREACIÓN</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredDocuments.map((doc) => (
              <tr key={doc.document_id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4 text-xs font-bold text-[#0a2d4d]">{doc.document_id.slice(0, 8)}</td>
                <td className="px-6 py-4">
                  <span className="text-xs font-semibold text-gray-700 block max-w-xs truncate">{doc.title}</span>
                </td>
                <td className="px-6 py-4 text-[10px] font-bold text-gray-500">{doc.department_id.slice(0, 8)}</td>
                <td className="px-6 py-4">
                   <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                       U
                     </div>
                     <span className="text-[10px] font-bold text-gray-600">{doc.responsible_user_id.slice(0, 8)}</span>
                   </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-bold border ${statusStyles[doc.current_status]}`}>
                    ● {doc.current_status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-[10px] text-gray-500 font-medium">
                  {new Date(doc.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                  No se encontraron documentos.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination bar */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Página 1 de 1</span>
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              <button className="p-1 rounded bg-white border border-gray-200 text-gray-400 hover:text-gray-600">
                <ChevronLeft size={16} />
              </button>
              <button className="p-1 rounded bg-white border border-gray-200 text-gray-400 hover:text-gray-600">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FAB Button */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-[#0a2d4d] text-white rounded-xl shadow-xl flex items-center justify-center hover:scale-110 transition-transform group">
        <FileUp size={24} className="group-hover:animate-bounce" />
      </button>
    </div>
  )
}
