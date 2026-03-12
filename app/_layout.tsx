import { useEffect, useState } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { View, ActivityIndicator } from 'react-native'

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (loading) return
    const inAuthGroup = segments[0] === '(auth)'
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup) {
      router.replace('/(game)/home')
    }
  }, [session, loading, segments])

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0005', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#DC143C" size="large" />
      </View>
    )
  }

  return <Slot />
}