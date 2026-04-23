'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Bot, Send, User, Loader2, Sparkles, ShieldCheck, Zap } from 'lucide-react'
import { analyzeDocument } from '@/app/actions/ai-actions'

interface Message {
  role: 'bot' | 'user'
  text: string
  timestamp: string
}

interface Props {
  userName: string
}

export default function DefluvotClient({ userName }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'bot', 
      text: '¡Hola! Soy DEFLUVOT, tu asistente inteligente de gestión de calidad. ¿En qué puedo ayudarte hoy?', 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg: Message = { 
      role: 'user', 
      text: input, 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
    setMessages(prev => [...prev, userMsg])
    const currentInput = input
    setInput('')
    setLoading(true)

    try {
      // General ERP assistant logic (using the existing AI action but with general prompt)
      const response = await analyzeDocument(null, 'Consulta General ERP', currentInput)
      
      const botMsg: Message = { 
        role: 'bot', 
        text: response.text || response.error || 'Lo siento, no pude procesar tu solicitud en este momento.', 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }
      setMessages(prev => [...prev, botMsg])
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 p-8 flex flex-col items-center justify-center overflow-hidden">
      <div className="w-full max-w-4xl h-full flex flex-col bg-white rounded-3xl shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden">
        
        {/* Header de la Card */}
        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#0a2d4d] text-white flex items-center justify-center shadow-xl shadow-blue-900/20">
                 <Bot size={32} />
              </div>
              <div>
                 <h3 className="text-lg font-black uppercase tracking-widest text-[#0a2d4d]">DEFLUVOT</h3>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-tighter">Motor Gemini Flash v1.5 Activo</span>
                 </div>
              </div>
           </div>
           <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl flex items-center gap-2 border border-blue-100">
                 <ShieldCheck size={16} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Soporte SGC</span>
              </div>
           </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-gray-50/20">
           {messages.map((msg, idx) => (
             <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}>
                <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                   {msg.role === 'bot' ? <><Bot size={14} className="text-[#0a2d4d]" /> DEFLUVOT</> : <>OPERADOR <User size={14} /></>}
                </div>
                <div className={`max-w-[80%] p-6 rounded-3xl text-sm font-medium leading-relaxed shadow-sm border ${
                  msg.role === 'user' 
                    ? 'bg-[#0a2d4d] text-white rounded-tr-none border-blue-900' 
                    : 'bg-white text-[#0a2d4d] rounded-tl-none border-gray-100'
                }`}>
                   {msg.text}
                </div>
                <span className="text-[9px] font-bold text-gray-300 uppercase px-2">{msg.timestamp}</span>
             </div>
           ))}
           {loading && (
             <div className="flex items-center gap-4 text-gray-400 animate-pulse px-4">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">Analizando consulta técnica...</span>
             </div>
           )}
           <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-8 bg-white border-t border-gray-50">
           <form onSubmit={handleSendMessage} className="relative group">
              <input 
                 type="text" 
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 placeholder="Escribe tu consulta sobre el ERP o Norma ISO..." 
                 className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-8 pr-16 py-5 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#0a2d4d] focus:bg-white transition-all text-zinc-900"
              />
              <button 
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-[#0a2d4d] text-white rounded-xl hover:bg-blue-900 transition-all disabled:opacity-30 active:scale-95 shadow-lg shadow-blue-900/20"
              >
                 {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
           </form>
           <div className="mt-4 flex items-center justify-center gap-6">
              <p className="text-[9px] text-gray-400 font-bold uppercase flex items-center gap-2"><Zap size={10} className="text-orange-400" /> Respuestas instantáneas</p>
              <p className="text-[9px] text-gray-400 font-bold uppercase flex items-center gap-2"><Sparkles size={10} className="text-blue-400" /> Basado en IA Avanzada</p>
           </div>
        </div>
      </div>
    </div>
  )
}
