import { supabase } from '../lib/supabase'

export type OAuthProvider = 'github' | 'google'

export interface SignInInput {
  email: string
  password: string
}

export interface SignUpInput extends SignInInput {
  displayName: string
}

export interface AuthService {
  signIn(input: SignInInput): Promise<void>
  signUp(input: SignUpInput): Promise<boolean>
  signInWithOAuth(provider: OAuthProvider): Promise<void>
  signOut(): Promise<void>
  resetPassword(email: string): Promise<void>
  updatePassword(password: string): Promise<void>
}

export const authService: AuthService = {
  async signIn({ email, password }) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },

  async signUp({ email, password, displayName }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${window.location.origin}/path`,
      },
    })
    if (error) throw error
    return Boolean(data.session)
  },

  async signInWithOAuth(provider) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/path` },
    })
    if (error) throw error
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    if (error) throw error
  },

  async updatePassword(password) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  },
}
