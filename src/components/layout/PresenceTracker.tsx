'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/cliente'
import { useRouter } from 'next/navigation'

export default function PresenceTracker() {
  const supabase = createClient()
  const router = useRouter()
  const sessionIdRef = useRef<string | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  useEffect(() => {
    const INACTIVITY_LIMIT = 30 * 60 * 1000 // 30 minutes in ms

    const startSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id)

      const { data } = await supabase
        .from('user_sessions')
        .insert({
          user_id: user.id,
          login_at: new Date().toISOString(),
          duration_seconds: 0
        })
        .select('id')
        .single()

      if (data) sessionIdRef.current = data.id
    }

    const updatePresence = async () => {
      // Check for inactivity
      if (Date.now() - lastActivityRef.current > INACTIVITY_LIMIT) {
        handleAutoLogout()
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id)

      if (sessionIdRef.current) {
        const { data: current } = await supabase
          .from('user_sessions')
          .select('duration_seconds')
          .eq('id', sessionIdRef.current)
          .single()
        
        if (current) {
          await supabase
            .from('user_sessions')
            .update({ 
              duration_seconds: (current.duration_seconds || 0) + 60,
              logout_at: new Date().toISOString()
            })
            .eq('id', sessionIdRef.current)
        }
      }
    }

    const handleAutoLogout = async () => {
      await supabase.auth.signOut()
      router.push('/login?reason=inactivity')
      window.location.reload() // Force clear state
    }

    const resetActivity = () => {
      lastActivityRef.current = Date.now()
    }

    // Interaction Listeners
    window.addEventListener('mousemove', resetActivity)
    window.addEventListener('keydown', resetActivity)
    window.addEventListener('click', resetActivity)
    window.addEventListener('scroll', resetActivity)

    startSession()
    const interval = setInterval(updatePresence, 60000)

    return () => {
      clearInterval(interval)
      window.removeEventListener('mousemove', resetActivity)
      window.removeEventListener('keydown', resetActivity)
      window.removeEventListener('click', resetActivity)
      window.removeEventListener('scroll', resetActivity)
    }
  }, [])

  return null
}
