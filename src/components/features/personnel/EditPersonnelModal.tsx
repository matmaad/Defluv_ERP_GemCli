'use client'

import React, { useState, useEffect } from 'react'
import { X, Edit3, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/cliente'
import { useRouter } from 'next/navigation'
import { PersonalRecord } from '@/app/types/database'
import { logAction } from '@/utils/audit-helper'

interface Props {
  isOpen: boolean
  onClose: () => void
  record: PersonalRecord | null
}

const CARGOS = ['Chofer', 'Operador', 'Gerente General', 'Topógrafo', 'Contador']

export default function EditPersonnelModal({ isOpen, onClose, record }: Props) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [rut, setRut] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [cargo, setCargo] = useState('')
  const [centroCostos, setCentroCostos] = useState('')
  const [entryDate, setEntryDate] = useState('')
  const [status, setStatus] = useState('')
  const [comment, setComment] = useState('')

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (record) {
      setRut(record.rut)
      setFirstName(record.first_name)
      setLastName(record.last_name)
      setCargo(record.cargo || CARGOS[0])
      setCentroCostos(record.centro_costos || '')
      setEntryDate(record.entry_date)
      setStatus(record.status)
      setComment(record.comments || '')
    }
  }, [record])

  if (!isOpen || !record) return null

  const isStatusChanged = status !== record.status

  // Función para formatear RUT mientras se escribe
  const formatRut = (value: string) => {
    let clean = value.replace(/[^0-9kK]/g, '').toUpperCase()
    if (clean.length === 0) return ''
    let dv = clean.slice(-1)
    let body = clean.slice(0, -1)
    let formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    if (clean.length > 1) {
      return `${formattedBody}-${dv}`
    } else {
      return dv
    }
  }

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    const rawValue = input.replace(/[^0-9kK]/g, '')
    if (rawValue.length <= 9) {
      setRut(formatRut(rawValue))
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isStatusChanged && !comment.trim()) {
      alert('Debe ingresar un comentario justificando el cambio de estado.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('personal_records')
        .update({
          rut,
          first_name: firstName,
          last_name: lastName,
          cargo,
          centro_costos: centroCostos,
          entry_date: entryDate,
          status,
          comments: comment
        })
        .eq('id', record.id)

      if (error) throw error

      await logAction(
        'ACTUALIZACIÓN',
        'personnel',
        record.id,
        { 
          old_status: record.status, 
          new_status: status,
          updates: { firstName, lastName, cargo, centroCostos }
        },
        comment || `Actualización de datos de colaborador: ${firstName} ${lastName}`
      )

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
        router.refresh()
      }, 2000)
    } catch (error: any) {
      console.error('Error updating personnel:', error)
      alert(`Error al actualizar personal: ${error.message || 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#0a2d4d]/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 text-[#0a2d4d]">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-900/20">
                <Edit3 size={20} />
             </div>
             <div>
                <h3 className="text-sm font-bold uppercase tracking-widest">Editar Colaborador</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">ID: {record.id.slice(0,8)}</p>
             </div>
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
             <h4 className="text-xl font-black text-[#0a2d4d]">¡Cambios Guardados!</h4>
             <p className="text-sm text-gray-500">La información del colaborador ha sido actualizada.</p>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="p-8 space-y-5 text-[#0a2d4d]">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nombres</label>
                <input 
                  type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-zinc-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Apellidos</label>
                <input 
                  type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-zinc-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">RUT</label>
                <input 
                  type="text" required value={rut} onChange={handleRutChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-zinc-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Cargo</label>
                <select 
                  value={cargo} onChange={(e) => setCargo(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-black text-[#0a2d4d]"
                >
                  {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Centro de Costos</label>
                <input 
                  type="text" required value={centroCostos} onChange={(e) => setCentroCostos(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-zinc-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Estado</label>
                <select 
                  value={status} onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-black text-[#0a2d4d]"
                >
                  <option value="Vinculado">Vinculado</option>
                  <option value="En Suspensión">En Suspensión</option>
                  <option value="Desvinculado">Desvinculado</option>
                </select>
              </div>

              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Fecha de Ingreso</label>
                <input 
                  type="date" required value={entryDate} onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-zinc-900"
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                  Comentarios {isStatusChanged && <span className="text-red-500 font-black">(OBLIGATORIO POR CAMBIO DE ESTADO)</span>}
                </label>
                <textarea 
                  required={isStatusChanged}
                  value={comment} onChange={(e) => setComment(e.target.value)}
                  className={`w-full h-24 px-4 py-3 bg-gray-50 border ${isStatusChanged ? 'border-red-200 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-100 focus:ring-blue-500/20 focus:border-blue-500'} rounded-xl outline-none transition-all text-sm font-medium text-zinc-900 resize-none`}
                  placeholder="Justifique el cambio de estado o agregue observaciones..."
                ></textarea>
              </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full py-4 bg-[#0a2d4d] text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-900/30 hover:bg-blue-900 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Actualizar Información'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
