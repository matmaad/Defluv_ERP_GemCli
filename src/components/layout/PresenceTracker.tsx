'use client'

import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/cliente'

export default function PresenceTracker() {
  const supabase = createClient()

  useEffect(() => {
    const updatePresence = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', user.id)
    }

    // Update once on load
    updatePresence()

    // Update every 60 seconds
    const interval = setInterval(updatePresence, 60000)

    return () => clearInterval(interval)
  }, [])

  return null // Invisible component
}
