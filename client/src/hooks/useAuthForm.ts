import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  authService,
  type OAuthProvider,
  type SignInInput,
  type SignUpInput,
} from '../services/auth'

export type AuthMode = 'signin' | 'register'
export type AuthField = 'displayName' | 'email' | 'password'

export interface AuthFormValues {
  displayName: string
  email: string
  password: string
}

export type AuthFieldErrors = Partial<Record<AuthField, string>>

const initialValues: AuthFormValues = {
  displayName: '',
  email: '',
  password: '',
}

function getEmailError(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ? ''
    : 'Enter a valid email address.'
}

function getPasswordError(password: string) {
  return password.length >= 8 ? '' : 'Password must be at least 8 characters.'
}

export function useAuthForm() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [values, setValues] = useState(initialValues)
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({})
  const [formError, setFormError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode)
    setFieldErrors({})
    setFormError('')
    setStatusMessage('')
  }

  function updateField(field: AuthField, value: string) {
    setValues((currentValues) => ({ ...currentValues, [field]: value }))
    setFieldErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }))
    setFormError('')
    setStatusMessage('')
  }

  function validate(): AuthFieldErrors {
    const errors: AuthFieldErrors = {}
    if (mode === 'register' && !values.displayName.trim()) {
      errors.displayName = 'Enter your display name.'
    }
    const emailError = getEmailError(values.email)
    const passwordError = getPasswordError(values.password)
    if (emailError) errors.email = emailError
    if (passwordError) errors.password = passwordError
    return errors
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatusMessage('')
    setFormError('')
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsLoading(true)
    try {
      if (mode === 'register') {
        const input: SignUpInput = {
          displayName: values.displayName.trim(),
          email: values.email.trim(),
          password: values.password,
        }
        const hasSession = await authService.signUp(input)
        if (hasSession) {
          navigate('/path', { replace: true })
        } else {
          setStatusMessage('Account created. Check your email to confirm your account.')
        }
      } else {
        const input: SignInInput = {
          email: values.email.trim(),
          password: values.password,
        }
        await authService.signIn(input)
        navigate('/path', { replace: true })
      }
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Authentication failed. Please try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function signInWithOAuth(provider: OAuthProvider) {
    setFormError('')
    setStatusMessage('')
    setIsLoading(true)
    try {
      await authService.signInWithOAuth(provider)
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Authentication failed. Please try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function resetPassword() {
    setFieldErrors({})
    setStatusMessage('')
    setFormError('')
    const emailError = getEmailError(values.email)
    if (emailError) {
      setFieldErrors({ email: emailError })
      return
    }

    setIsLoading(true)
    try {
      await authService.resetPassword(values.email.trim())
      setStatusMessage('If an account exists for this email, a reset link will be sent.')
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Unable to send a reset link. Please try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return {
    mode,
    changeMode,
    values,
    updateField,
    fieldErrors,
    formError,
    statusMessage,
    isLoading,
    showPassword,
    togglePasswordVisibility: () => setShowPassword((isVisible) => !isVisible),
    submit,
    signInWithOAuth,
    resetPassword,
  }
}
