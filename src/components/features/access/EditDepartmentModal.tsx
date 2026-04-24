'use client'

import React, { useState, useEffect } from 'react'
import { X, Edit3, Loader2, CheckCircle2, Box } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { updateDepartmentAction } from '@/app/actions/auth-actions'

interface Props {
  isOpen: boolean
  onClose: () => void
  department: { id: string; name: string } | null
}

export default function EditDepartmentModal({ isOpen, onClose, department }: Props) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [name, setName] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (department) {
      setName(department.name)
    }
  }, [department, isOpen])

  if (!isOpen || !department) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const result = await updateDepartmentAction(department.id, name)
      if (result.error) throw new Error(result.error)

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
        router.refresh()
      }, 1500)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#0a2d4d]/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg">
                <Edit3 size={20} />
             </div>
             <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-[#0a2d4d]">Editar Departamento</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Configuración del Sistema</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
             <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle2 size={32} />
             </div>
             <h4 className="text-lg font-black text-[#0a2d4d]">¡Actualizado!</h4>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nombre del Departamento</label>
              <div className="relative">
                <Box className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-bold text-zinc-900"
                />
              </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full py-4 bg-[#0a2d4d] text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-900 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Guardar Cambios'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
