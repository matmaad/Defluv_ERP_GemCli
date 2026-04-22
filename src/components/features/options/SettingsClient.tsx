'use client'

import React, { useState } from 'react'
import { Lock, Mail, Loader2, CheckCircle2, AlertCircle, ShieldCheck, UserCircle, Shield } from 'lucide-react'
import { updateEmailAction, updatePasswordAction } from '@/app/actions/auth-actions'

interface Props {
  currentEmail: string
  userName: string
  userRole: string
}

export default function SettingsClient({ currentEmail, userName, userRole }: Props) {
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
    <div className="flex-1 p-8 space-y-12 bg-gray-50 overflow-y-auto font-sans text-[#0a2d4d]">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Profile Identity Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
           <div className="md:w-1/3 bg-[#0a2d4d] p-12 text-white flex flex-col items-center text-center space-y-6">
              <div className="relative group">
                 <div className="w-32 h-32 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden border-4 border-white/20 shadow-2xl transition-transform group-hover:scale-105 duration-500">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${userName}&background=0a2d4d&color=fff&size=256`} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                 </div>
                 <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-2 rounded-lg shadow-lg">
                    <ShieldCheck size={16} />
                 </div>
              </div>
              <div>
                 <h4 className="text-xl font-black uppercase tracking-tight leading-tight">{userName}</h4>
                 <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">{userRole === 'admin' ? 'ADMINISTRADOR TIER 1' : userRole.toUpperCase()}</p>
              </div>
              <div className="pt-6 w-full border-t border-white/10 flex flex-col items-center gap-4">
                 <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                    <Mail size={12} className="text-blue-300" />
                    <span className="text-[10px] font-bold uppercase">{currentEmail}</span>
                 </div>
              </div>
           </div>

           <div className="md:w-2/3 p-12 space-y-12">
              {/* Error Alert */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-[10px] font-black uppercase tracking-widest animate-shake">
                   <AlertCircle size={18} />
                   {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Email Section */}
                <div className="space-y-6">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                         <Mail size={20} />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-widest">Configurar Correo</h3>
                   </div>
                   <form onSubmit={handleUpdateEmail} className="space-y-4">
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Nueva Dirección</label>
                         <input 
                            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                         />
                      </div>
                      <button 
                        type="submit" disabled={emailLoading || email === currentEmail}
                        className="w-full py-3 bg-[#0a2d4d] text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-blue-900 transition-all disabled:opacity-50"
                      >
                         {emailLoading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Confirmar Email'}
                      </button>
                      {emailSuccess && <p className="text-[8px] text-green-600 font-bold uppercase text-center">Enlace de verificación enviado.</p>}
                   </form>
                </div>

                {/* Password Section */}
                <div className="space-y-6">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-50 rounded-xl text-orange-600">
                         <Lock size={20} />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-widest">Seguridad de Acceso</h3>
                   </div>
                   <form onSubmit={handleUpdatePassword} className="space-y-4">
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Nueva Clave</label>
                         <input 
                            type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Repetir Clave</label>
                         <input 
                            type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                         />
                      </div>
                      <button 
                        type="submit" disabled={passLoading || !newPassword}
                        className="w-full py-3 bg-[#0a2d4d] text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-blue-900 transition-all disabled:opacity-50"
                      >
                         {passLoading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Actualizar Password'}
                      </button>
                      {passSuccess && <p className="text-[8px] text-green-600 font-bold uppercase text-center">Contraseña actualizada.</p>}
                   </form>
                </div>
              </div>
           </div>
        </div>

        {/* Security Info Card */}
        <div className="p-8 bg-blue-50 rounded-xl border border-blue-100 flex gap-6 items-start shadow-inner">
           <Shield className="text-blue-600 mt-1" size={24} />
           <div className="space-y-1">
              <h4 className="text-[10px] font-black uppercase tracking-widest">Protocolo de Seguridad de Credenciales</h4>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider leading-relaxed">
                 Cualquier cambio en el acceso requiere validación por correo. Si sospecha que su cuenta ha sido comprometida, notifique de inmediato a soporte@defluv.cl.
              </p>
           </div>
        </div>
      </div>
    </div>
  )
}
