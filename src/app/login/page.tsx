'use client'

import React, { useState } from 'react'
import { createClient } from '@/utils/supabase/cliente'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Lock, Mail, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('Credenciales inválidas. Por favor, intente de nuevo.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a2d4d] relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-400 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-8">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0a2d4d] text-white shadow-xl shadow-blue-900/20 mb-2">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#0a2d4d] tracking-tight uppercase">DEFLUV SGC</h1>
              <p className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase">Sistema de Gestión de Calidad</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-8 pt-0 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-xs font-bold animate-shake">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder="ejemplo@defluv.cl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-200 text-[#0a2d4d] focus:ring-blue-500" />
                <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-600 uppercase tracking-wider">Recordarme</span>
              </label>
              <button type="button" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider">¿Olvidaste tu clave?</button>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#0a2d4d] text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-900/30 hover:bg-blue-900 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando Sesión...' : 'Entrar al Sistema'}
            </button>
          </form>

          {/* Footer */}
          <div className="p-6 bg-gray-50 text-center">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
              Acceso restringido solo a personal autorizado de DEFLUV SA.<br/>
              Todos los ingresos son monitoreados.
            </p>
          </div>
        </div>
        
        <p className="mt-8 text-center text-[10px] font-bold text-white/40 uppercase tracking-widest">
          © 2026 DEFLUV SA • Gestión de Calidad
        </p>
      </div>
    </div>
  )
}
