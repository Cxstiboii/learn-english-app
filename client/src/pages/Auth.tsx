import type { KeyboardEvent } from 'react'
import { AuthForm } from '../components/auth/AuthForm'
import { SocialButtons } from '../components/auth/SocialButtons'
import AuthLayout from '../components/layout/AuthLayout'
import { useAuthForm } from '../hooks/useAuthForm'
import { Card } from '../components/ui'
import { PasswordRecoveryForm } from '../components/auth/PasswordRecoveryForm'
import { useAuth } from '../hooks/useAuth'

export default function Auth() {
  const { isPasswordRecovery } = useAuth()
  const auth = useAuthForm()

  if (isPasswordRecovery) return <PasswordRecoveryForm />

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const tabs = Array.from(
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
    )
    const currentIndex = tabs.indexOf(event.currentTarget)
    let nextIndex: number | null = null

    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      nextIndex = (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = tabs.length - 1
    }

    if (nextIndex !== null) {
      event.preventDefault()
      tabs[nextIndex].focus()
      tabs[nextIndex].click()
    }
  }

  return (
    <AuthLayout>
      <Card
        aria-label="Authentication"
        className="flex flex-col gap-gutter-lg"
        padding="lg"
        role="region"
      >
        <h1 className="sr-only">Sign in or create your DevFluent account</h1>
        <div
          aria-label="Authentication mode"
          className="grid grid-cols-2 gap-1 rounded-md border border-light-outline-variant bg-light-surface-container p-1"
          role="tablist"
        >
          <button
            aria-controls="auth-form"
            aria-selected={auth.mode === 'signin'}
            className={`rounded-sm py-2 font-label text-label-md transition-colors duration-state-change focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary ${
              auth.mode === 'signin'
                ? 'border border-light-outline-variant bg-light-surface-container-lowest text-light-on-surface'
                : 'text-light-on-surface-variant hover:text-light-on-surface'
            }`}
            disabled={auth.isLoading}
            id="auth-tab-signin"
            onClick={() => auth.changeMode('signin')}
            onKeyDown={handleTabKeyDown}
            role="tab"
            tabIndex={auth.mode === 'signin' ? 0 : -1}
            type="button"
          >
            Sign In
          </button>
          <button
            aria-controls="auth-form"
            aria-selected={auth.mode === 'register'}
            className={`rounded-sm py-2 font-label text-label-md transition-colors duration-state-change focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary ${
              auth.mode === 'register'
                ? 'border border-light-outline-variant bg-light-surface-container-lowest text-light-on-surface'
                : 'text-light-on-surface-variant hover:text-light-on-surface'
            }`}
            disabled={auth.isLoading}
            id="auth-tab-register"
            onClick={() => auth.changeMode('register')}
            onKeyDown={handleTabKeyDown}
            role="tab"
            tabIndex={auth.mode === 'register' ? 0 : -1}
            type="button"
          >
            Create Account
          </button>
        </div>

        <SocialButtons
          disabled={auth.isLoading}
          onSelectProvider={auth.signInWithOAuth}
        />

        <div className="flex items-center gap-gutter-sm" role="separator">
          <span aria-hidden="true" className="flex-1 border-t border-light-outline-variant" />
          <span className="font-mono text-label-sm text-light-on-surface-variant">
            or with email
          </span>
          <span aria-hidden="true" className="flex-1 border-t border-light-outline-variant" />
        </div>

        <AuthForm
          fieldErrors={auth.fieldErrors}
          isLoading={auth.isLoading}
          mode={auth.mode}
          onFieldChange={auth.updateField}
          onForgotPassword={auth.resetPassword}
          onSubmit={auth.submit}
          onTogglePassword={auth.togglePasswordVisibility}
          showPassword={auth.showPassword}
          values={auth.values}
        />

        {auth.formError && (
          <p
            aria-live="assertive"
            className="rounded-default border border-light-error bg-light-error-container px-gutter-md py-gutter-sm font-body text-body-sm text-light-on-error-container"
            role="alert"
          >
            {auth.formError}
          </p>
        )}
        {auth.statusMessage && (
          <p
            aria-live="polite"
            className="rounded-default border border-success bg-success-container px-gutter-md py-gutter-sm font-body text-body-sm text-on-success-container"
            role="status"
          >
            {auth.statusMessage}
          </p>
        )}
      </Card>
    </AuthLayout>
  )
}
