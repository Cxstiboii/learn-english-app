import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { AuthContext } from './auth-context'
import { supabase } from '../lib/supabase'

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)

  useEffect(() => {
    let active = true
    let receivedAuthEvent = false
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      receivedAuthEvent = true
      if (!active) return
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setError(null)
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true)
      if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        setIsPasswordRecovery(false)
      }
      setLoading(false)
    })

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active || receivedAuthEvent) return
      if (sessionError) throw sessionError
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    }).catch(() => {
      if (!active || receivedAuthEvent) return
      // This diagnostic intentionally excludes session details and access tokens.
      // eslint-disable-next-line no-console
      console.error('Unable to restore the Supabase session.')
      setError('Unable to verify your session. Refresh the page to try again.')
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = useCallback(async () => {
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) throw signOutError
  }, [])

  const value = useMemo(
    () => ({ user, session, loading, error, isPasswordRecovery, signOut }),
    [user, session, loading, error, isPasswordRecovery, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
