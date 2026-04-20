'use client'

import React, { useState } from 'react'
import { X, UserPlus, Loader2, CheckCircle2, FileSpreadsheet } from 'lucide-react'
import { createClient } from '@/utils/supabase/cliente'
import { useRouter } from 'next/navigation'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function AddPersonnelModal({ isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [mode, setMode] = useState<'single' | 'bulk'>('single')
  
  // Single Entry State
  const [rut, setRut] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLast] = useState('')
  const [entryDate, setEntryDate] = useState('')
  const [status, setStatus] = useState('Vinculado')

  const supabase = createClient()
  const router = useRouter()

  if (!isOpen) return null

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase
        .from('personal_records')
        .insert({
          rut,
          first_name: firstName,
          last_name: lastName,
          entry_date: entryDate,
          status
        })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
        router.refresh()
      }, 2000)
    } catch (error) {
      console.error('Error adding personnel:', error)
      alert('Error al registrar personal. Verifique si el RUT ya existe.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a2d4d]/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-[#0a2d4d] text-white flex items-center justify-center shadow-lg shadow-blue-900/20">
                <UserPlus size={20} />
             </div>
             <div>
                <h3 className="text-sm font-bold text-[#0a2d4d] uppercase tracking-widest">Gestionar Personal</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Matriz de Recursos Humanos</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
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
             <h4 className="text-xl font-bold text-[#0a2d4d]">¡Operación Exitosa!</h4>
             <p className="text-sm text-gray-500">La matriz de personal ha sido actualizada.</p>
          </div>
        ) : mode === 'single' ? (
          <form onSubmit={handleSingleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">RUT (Sin puntos, con guion)</label>
                <input 
                  type="text" required value={rut} onChange={(e) => setRut(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-zinc-900 placeholder:text-gray-500"
                  placeholder="12345678-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">Estado Inicial</label>
                <select 
                  value={status} onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-zinc-900"
                >
                  <option>Vinculado</option>
                  <option>En Suspensión</option>
                  <option>Desvinculado</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">Nombres</label>
                <input 
                  type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-zinc-900 placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">Apellidos</label>
                <input 
                  type="text" required value={lastName} onChange={(e) => setLast(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-zinc-900 placeholder:text-gray-500"
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">Fecha de Ingreso</label>
                <input 
                  type="date" required value={entryDate} onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-zinc-900"
                />
              </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full py-4 bg-[#0a2d4d] text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-900/30 hover:bg-blue-900 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Registrar Colaborador'}
            </button>
          </form>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center space-y-6 text-center">
             <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <FileSpreadsheet size={32} />
             </div>
             <div>
                <h4 className="text-sm font-bold text-[#0a2d4d] uppercase tracking-widest">Carga desde CSV</h4>
                <p className="text-xs text-gray-500 mt-2 px-8">Descargue la plantilla, complete los datos y suba el archivo para procesar múltiples registros a la vez.</p>
             </div>
             <div className="flex gap-4 w-full px-8">
                <button className="flex-1 py-3 border border-gray-200 rounded-xl text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:bg-gray-50">Descargar Plantilla</button>
                <button className="flex-[2] py-3 bg-[#0a2d4d] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:bg-blue-900">Seleccionar CSV</button>
             </div>
             <p className="text-[9px] text-orange-600 font-bold uppercase tracking-tighter">Nota: El sistema validará RUTs duplicados automáticamente.</p>
          </div>
        )}
      </div>
    </div>
  )
}
