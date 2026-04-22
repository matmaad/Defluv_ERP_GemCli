'use client'

import React, { useState, useEffect } from 'react'
import { X, Edit3, Loader2, CheckCircle2, Mail, User, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { updateUserAction } from '@/app/actions/auth-actions'
import { Profile } from '@/app/types/database'

interface Props {
  isOpen: boolean
  onClose: () => void
  user: Profile | null
}

export default function EditUserModal({ isOpen, onClose, user }: Props) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<'admin' | 'sub_admin' | 'regular_user'>('regular_user')
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  useEffect(() => {
    if (user) {
      setEmail(user.email)
      setFirstName(user.first_name)
      setLastName(user.last_name)
      setRole(user.role as any)
    }
  }, [user])

  if (!isOpen || !user) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await updateUserAction(user.id, {
        email,
        first_name: firstName,
        last_name: lastName,
        role
      })

      if (result.error) {
        throw new Error(result.error)
      }

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
        router.refresh()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el usuario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#0a2d4d]/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 text-[#0a2d4d]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-900/20">
                <Edit3 size={20} />
             </div>
             <div>
                <h3 className="text-sm font-black uppercase tracking-widest">Editar Operador</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Modificar perfil de acceso</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="p-16 flex flex-col items-center justify-center text-center space-y-4">
             <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle2 size={48} />
             </div>
             <h4 className="text-xl font-black">¡Cambios Guardados!</h4>
             <p className="text-sm text-gray-500">El perfil ha sido actualizado correctamente.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[10px] font-bold uppercase tracking-widest text-center">
                {error}
              </div>
            )}

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
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-zinc-900"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Rol en el Sistema</label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select 
                  value={role} onChange={(e) => setRole(e.target.value as any)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-black uppercase text-[#0a2d4d]"
                >
                  <option value="regular_user">Usuario Regular (TIER 3)</option>
                  <option value="sub_admin">Sub-Admin / Gestor (TIER 2)</option>
                  <option value="admin">Administrador (TIER 1)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-50">
               <button 
                type="button" onClick={onClose}
                className="flex-1 py-3.5 border border-gray-200 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest"
               >
                 Cancelar
               </button>
               <button 
                type="submit" disabled={loading}
                className="flex-[2] py-3.5 bg-[#0a2d4d] text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-900/30 hover:bg-blue-900 transition-all flex items-center justify-center gap-2"
               >
                 {loading ? <Loader2 size={16} className="animate-spin" /> : 'Guardar Cambios'}
               </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
