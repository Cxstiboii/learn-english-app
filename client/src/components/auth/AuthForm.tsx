import type { FormEvent } from 'react'
import type {
  AuthField,
  AuthFieldErrors,
  AuthFormValues,
  AuthMode,
} from '../../hooks/useAuthForm'
import { Button, Input } from '../ui'

interface AuthFormProps {
  mode: AuthMode
  values: AuthFormValues
  fieldErrors: AuthFieldErrors
  isLoading: boolean
  showPassword: boolean
  onFieldChange: (field: AuthField, value: string) => void
  onTogglePassword: () => void
  onForgotPassword: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function AuthForm({
  mode,
  values,
  fieldErrors,
  isLoading,
  showPassword,
  onFieldChange,
  onTogglePassword,
  onForgotPassword,
  onSubmit,
}: AuthFormProps) {
  const isRegister = mode === 'register'

  return (
    <form
      aria-labelledby={isRegister ? 'auth-tab-register' : 'auth-tab-signin'}
      className="flex flex-col gap-gutter-md"
      id="auth-form"
      noValidate
      onSubmit={onSubmit}
      role="tabpanel"
    >
      {isRegister && (
        <div className="flex flex-col gap-gutter-xs">
          <label className="font-label text-label-md text-light-on-surface" htmlFor="display-name">
            Display name
          </label>
          <Input
            autoComplete="name"
            disabled={isLoading}
            error={fieldErrors.displayName}
            id="display-name"
            onChange={(event) => onFieldChange('displayName', event.currentTarget.value)}
            placeholder="Carlos Mendoza"
            required
            value={values.displayName}
          />
        </div>
      )}

      <div className="flex flex-col gap-gutter-xs">
        <label className="font-label text-label-md text-light-on-surface" htmlFor="email">
          Email address
        </label>
        <Input
          autoComplete="email"
          disabled={isLoading}
          error={fieldErrors.email}
          id="email"
          onChange={(event) => onFieldChange('email', event.currentTarget.value)}
          placeholder="you@domain.dev"
          required
          type="email"
          value={values.email}
        />
      </div>

      <div className="flex flex-col gap-gutter-xs">
        <div className="flex items-center justify-between gap-gutter-sm">
          <label className="font-label text-label-md text-light-on-surface" htmlFor="password">
            Password
          </label>
          {!isRegister && (
            <button
              className="rounded-sm font-mono text-label-sm text-light-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary"
              disabled={isLoading}
              onClick={onForgotPassword}
              type="button"
            >
              Forgot password?
            </button>
          )}
        </div>
        <div className="relative">
          <Input
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            className="pr-12"
            disabled={isLoading}
            error={fieldErrors.password}
            id="password"
            onChange={(event) => onFieldChange('password', event.currentTarget.value)}
            placeholder="At least 8 characters"
            required
            type={showPassword ? 'text' : 'password'}
            value={values.password}
          />
          <Button
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute right-1 top-1.5 z-10"
            disabled={isLoading}
            onClick={onTogglePassword}
            size="icon"
            variant="ghost"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-body-lg">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </Button>
        </div>
      </div>

      <Button className="mt-gutter-xs w-full py-3" disabled={isLoading} type="submit">
        {isLoading ? 'Please wait…' : isRegister ? 'Create Workspace' : 'Sign in to Workspace'}
      </Button>
    </form>
  )
}
