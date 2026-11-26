import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../services/auth'
import AuthLayout from '../layout/AuthLayout'
import { Button, Card, Input } from '../ui'

export function PasswordRecoveryForm() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setIsLoading(true)
    try {
      await authService.updatePassword(password)
      navigate('/path', { replace: true })
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'Unable to update your password. Request a new reset link.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <Card className="flex flex-col gap-gutter-lg" padding="lg">
        <div>
          <h1 className="font-headline text-headline-md text-light-on-surface">Choose a new password</h1>
          <p className="font-body text-body-sm text-light-on-surface-variant">
            Enter a new password for your account.
          </p>
        </div>
        <form className="flex flex-col gap-gutter-md" onSubmit={submit}>
          <label className="flex flex-col gap-gutter-xs font-label text-label-md text-light-on-surface" htmlFor="new-password">
            New password
            <Input
              autoComplete="new-password"
              disabled={isLoading}
              id="new-password"
              minLength={8}
              onChange={(event) => setPassword(event.currentTarget.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <Button disabled={isLoading} type="submit">
            {isLoading ? 'Please wait…' : 'Update password'}
          </Button>
        </form>
        {error && <p className="font-body text-body-sm text-light-error" role="alert">{error}</p>}
      </Card>
    </AuthLayout>
  )
}
