'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Bot, Send, User, Loader2, Sparkles, ShieldCheck, Zap } from 'lucide-react'
import { analyzeDocument, warmUpAI } from '@/app/actions/ai-actions'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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
      timestamp: '' 
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isWarmingUp, setIsWarmingUp] = useState(true)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Set initial timestamp on mount to avoid hydration mismatch
    setMessages(prev => [
      { 
        ...prev[0], 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }
    ])

    // Warm up the AI instance on load
    const warmUp = async () => {
      await warmUpAI()
      setIsWarmingUp(false)
    }
    warmUp()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e?: React.FormEvent, directText?: string) => {
    if (e) e.preventDefault()
    
    const messageText = directText || input
    if (!messageText.trim() || loading) return

    const userMsg: Message = { 
      role: 'user', 
      text: messageText, 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
    setMessages(prev => [...prev, userMsg])
    if (!directText) setInput('')
    setLoading(true)

    try {
      // Map local history to Gemini format
      const history = messages.slice(1).map(m => ({
        role: (m.role === 'bot' ? 'model' : 'user') as 'model' | 'user',
        parts: [{ text: m.text }]
      }))

      const response = await analyzeDocument(null, 'Consulta General ERP', messageText, history)
      
      const botMsg: Message = { 
        role: 'bot', 
        text: response.text || response.error || 'No pude procesar tu solicitud.', 
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
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-tighter">Motor Gemini 3.1 Flash Lite Activo</span>
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
                   <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : 'prose-slate'} 
                      prose-p:leading-relaxed prose-strong:font-black prose-strong:text-blue-900
                      ${msg.role === 'user' ? 'prose-strong:text-white' : ''}
                    `}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                   </div>
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
           {/* Quick Actions */}
           <div className="flex flex-wrap gap-2 mb-6">
              {[
                { label: '📊 ¿Cómo va mi departamento?', query: '¿Cómo va el cumplimiento de mi departamento actualmente?' },
                { label: '📝 Mis tareas pendientes', query: '¿Qué tareas tengo asignadas y cuáles están pendientes?' },
                { label: '🛡️ Alertas de calidad', query: '¿Hay documentos vencidos o rechazados que requieran mi atención?' },
                { label: '💡 Consejo ISO-9001', query: 'Dame un consejo rápido para mejorar la gestión de calidad hoy.' }
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(undefined, action.query)}
                  className="px-4 py-2 bg-blue-50 hover:bg-[#0a2d4d] hover:text-white text-[#0a2d4d] text-[10px] font-black uppercase tracking-widest rounded-xl border border-blue-100 transition-all active:scale-95"
                >
                  {action.label}
                </button>
              ))}
           </div>

           <form onSubmit={(e) => handleSendMessage(e)} className="relative group">
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
