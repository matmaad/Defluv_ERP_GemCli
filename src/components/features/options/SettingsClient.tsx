'use client'

import React, { useState } from 'react'
import { Lock, Mail, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react'
import { updateEmailAction, updatePasswordAction } from '@/app/actions/auth-actions'

interface Props {
  currentEmail: string
  userName: string
}

export default function SettingsClient({ currentEmail, userName }: Props) {
  const [email, setEmail] = useState(currentEmail)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [emailLoading, setEmailLoading] = useState(false)
  const [passLoading, setPassLoading] = useState(false)
  
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [passSuccess, setPassSuccess] = useState(false)
  
  const [error, setError] = useState<string | null>(null)

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (email === currentEmail) return
    
    setEmailLoading(true)
    setError(null)
    
    const result = await updateEmailAction(email)
    if (result.error) {
      setError(result.error)
    } else {
      setEmailSuccess(true)
      setTimeout(() => setEmailSuccess(false), 3000)
    }
    setEmailLoading(false)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    
    setPassLoading(true)
    setError(null)
    
    const result = await updatePasswordAction(newPassword)
    if (result.error) {
      setError(result.error)
    } else {
      setPassSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPassSuccess(false), 3000)
    }
    setPassLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12">
      <div>
        <h1 className="text-2xl font-black text-[#0a2d4d] uppercase tracking-tight">Opciones de Cuenta</h1>
        <p className="text-gray-500 text-sm font-medium">Gestione su información de acceso y seguridad.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Email Form */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
          <div className="flex items-center gap-3 text-[#0a2d4d]">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Mail size={20} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest">Actualizar Correo</h3>
          </div>

          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Correo Electrónico Actual</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={emailLoading || email === currentEmail}
              className="w-full py-3 bg-[#0a2d4d] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:bg-blue-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {emailLoading ? <Loader2 size={14} className="animate-spin" /> : 'Guardar Cambios'}
              {emailSuccess && <CheckCircle2 size={14} />}
            </button>
            
            {emailSuccess && (
              <p className="text-[9px] text-green-600 font-bold uppercase text-center">
                Se ha enviado un enlace de confirmación a su nuevo correo.
              </p>
            )}
          </form>
        </div>

        {/* Password Form */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
          <div className="flex items-center gap-3 text-[#0a2d4d]">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Lock size={20} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest">Cambiar Contraseña</h3>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nueva Contraseña</label>
              <input 
                type="password" 
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Confirmar Contraseña</label>
              <input 
                type="password" 
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={passLoading || !newPassword}
              className="w-full py-3 bg-[#0a2d4d] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:bg-blue-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {passLoading ? <Loader2 size={14} className="animate-spin" /> : 'Actualizar Contraseña'}
              {passSuccess && <CheckCircle2 size={14} />}
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold uppercase tracking-widest">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Profile Info Summary */}
      <div className="p-8 bg-blue-50 rounded-3xl border border-blue-100 flex items-center justify-between shadow-inner">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-[#0a2d4d] flex items-center justify-center overflow-hidden shadow-xl border-4 border-white">
            <img 
              src={`https://ui-avatars.com/api/?name=${userName}&background=0a2d4d&color=fff`} 
              alt="Avatar" 
            />
          </div>
          <div>
            <h4 className="text-lg font-black text-[#0a2d4d] uppercase tracking-tight">{userName}</h4>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{currentEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-blue-100 shadow-sm">
          <ShieldCheck size={16} className="text-blue-600" />
          <span className="text-[10px] font-black text-[#0a2d4d] uppercase tracking-widest">Cuenta Verificada</span>
        </div>
      </div>
    </div>
  )
}
