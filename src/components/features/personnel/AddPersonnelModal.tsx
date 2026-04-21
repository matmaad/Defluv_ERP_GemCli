'use client'

import React, { useState } from 'react'
import { X, UserPlus, Loader2, CheckCircle2, FileSpreadsheet, Calendar } from 'lucide-react'
import { createClient } from '@/utils/supabase/cliente'
import { useRouter } from 'next/navigation'
import { logAction } from '@/utils/audit-helper'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const CARGOS = ['Chofer', 'Operador', 'Gerente General', 'Topógrafo', 'Contador']

export default function AddPersonnelModal({ isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [mode, setMode] = useState<'single' | 'bulk'>('single')
  
  // Single Entry State
  const [rut, setRut] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLast] = useState('')
  const [cargo, setCargo] = useState(CARGOS[0])
  const [centroCostos, setCentroCostos] = useState('')
  const [entryDate, setEntryDate] = useState('') // Format: YYYY-MM-DD for native input
  const [status, setStatus] = useState('Vinculado')

  const supabase = createClient()
  const router = useRouter()

  if (!isOpen) return null

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

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('personal_records')
        .insert({
          rut,
          first_name: firstName,
          last_name: lastName,
          cargo,
          centro_costos: centroCostos,
          entry_date: entryDate,
          status
        })
        .select()
        .single()

      if (error) throw error

      await logAction(
        'CREACIÓN',
        'personnel',
        data.id,
        { rut, name: `${firstName} ${lastName}`, cargo },
        `Registro de nuevo colaborador: ${firstName} ${lastName}`
      )

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
        router.refresh()
      }, 2000)
    } catch (error: any) {
      console.error('Error adding personnel:', error)
      alert(`Error al registrar personal: ${error.message || 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a2d4d]/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 text-[#0a2d4d]">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-[#0a2d4d] text-white flex items-center justify-center shadow-lg shadow-blue-900/20">
                <UserPlus size={20} />
             </div>
             <div>
                <h3 className="text-sm font-bold text-[#0a2d4d] uppercase tracking-widest">Gestionar Personal</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Matriz de Recursos Humanos</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex bg-gray-50 p-1 m-6 mb-0 rounded-xl border border-gray-100">
           <button 
            onClick={() => setMode('single')}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${mode === 'single' ? 'bg-white text-[#0a2d4d] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
           >
             Ingreso Individual
           </button>
           <button 
            onClick={() => setMode('bulk')}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${mode === 'bulk' ? 'bg-white text-[#0a2d4d] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
           >
             Carga Masiva (CSV)
           </button>
        </div>

        {success ? (
          <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
             <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle2 size={48} />
             </div>
             <h4 className="text-xl font-black text-[#0a2d4d]">¡Operación Exitosa!</h4>
             <p className="text-sm text-gray-500">La matriz de personal ha sido actualizada.</p>
          </div>
        ) : mode === 'single' ? (
          <form onSubmit={handleSingleSubmit} className="p-8 space-y-5 text-[#0a2d4d]">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nombres</label>
                <input 
                  type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-zinc-900"
                  placeholder="Ej: Juan"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Apellidos</label>
                <input 
                  type="text" required value={lastName} onChange={(e) => setLast(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-zinc-900"
                  placeholder="Ej: Perez"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">RUT</label>
                <input 
                  type="text" required value={rut} onChange={handleRutChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-zinc-900"
                  placeholder="12.345.678-9"
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
                  placeholder="Ej: Obra Norte"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Estado</label>
                <select 
                  value={status} onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-black text-[#0a2d4d]"
                >
                  <option>Vinculado</option>
                  <option>En Suspensión</option>
                  <option>Desvinculado</option>
                </select>
              </div>

              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Fecha de Ingreso</label>
                <div className="relative">
                  <input 
                    type="date" 
                    required 
                    value={entryDate} 
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-zinc-900 lowercase"
                  />
                  <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full py-4 bg-[#0a2d4d] text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-900/30 hover:bg-blue-900 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Registrar Colaborador'}
            </button>
          </form>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center space-y-6 text-center text-[#0a2d4d]">
             <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <FileSpreadsheet size={32} />
             </div>
             <div>
                <h4 className="text-sm font-black uppercase tracking-widest">Carga desde CSV</h4>
                <p className="text-xs text-gray-500 mt-2 px-8 font-medium">Descargue la plantilla, complete los datos y suba el archivo para procesar múltiples registros a la vez.</p>
             </div>
             <div className="flex gap-4 w-full px-8">
                <button className="flex-1 py-3 border border-gray-200 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50">Descargar Plantilla</button>
                <button className="flex-[2] py-3 bg-[#0a2d4d] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:bg-blue-900">Seleccionar CSV</button>
             </div>
             <p className="text-[9px] text-orange-600 font-black uppercase tracking-widest">Nota: El sistema validará RUTs duplicados automáticamente.</p>
          </div>
        )}
      </div>
    </div>
  )
}
