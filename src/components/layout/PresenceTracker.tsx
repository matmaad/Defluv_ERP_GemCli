'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/cliente'

export default function PresenceTracker() {
  const supabase = createClient()
  const sessionIdRef = useRef<string | null>(null)

  useEffect(() => {
    const startSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Update last_seen_at in profiles
      await supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id)

      // 2. Create new entry in user_sessions
      const { data, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: user.id,
          login_at: new Date().toISOString(),
          duration_seconds: 0
        })
        .select('id')
        .single()

      if (data) {
        sessionIdRef.current = data.id
      }
    }

    const updatePresence = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Update Presence
      await supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id)

      // Update Session Duration (+60 seconds)
      if (sessionIdRef.current) {
        // We use RPC or raw increment if possible, or just fetch and add. 
        // For simplicity here, we'll increment local tracking and push.
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
              logout_at: new Date().toISOString() // Always update logout_at as "last active"
            })
            .eq('id', sessionIdRef.current)
        }
      }
    }

    startSession()

    const interval = setInterval(updatePresence, 60000)

    // Close session on tab close
    const handleUnload = () => {
      if (sessionIdRef.current) {
        // SendBeacon is better for unload but requires API endpoint. 
        // We'll rely on the 1-min intervals for now.
      }
    }

    window.addEventListener('beforeunload', handleUnload)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [])

  return null
}
