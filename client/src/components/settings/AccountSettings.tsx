import { useState, type FormEvent } from 'react'
import { authService } from '../../services/auth'
import { Button } from '../ui'
import { SettingsField, settingsInputClass } from './SettingsControls'

interface AccountSettingsProps {
  email: string
  onSignOut: () => Promise<void>
}

export function AccountSettings({ email, onSignOut }: AccountSettingsProps) {
  const [password, setPassword] = useState('')
  const [passwordNotice, setPasswordNotice] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [signOutError, setSignOutError] = useState('')
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordError('')
    setPasswordNotice('')
    setIsUpdatingPassword(true)
    try {
      await authService.updatePassword(password)
      setPassword('')
      setPasswordNotice('Your password has been updated.')
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Unable to update your password.')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  async function handleSignOut() {
    setSignOutError('')
    setIsSigningOut(true)
    try {
      await onSignOut()
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'Unable to sign out. Please try again.')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <section aria-labelledby="account-heading" className="flex flex-col gap-gutter-lg">
      <div>
        <h2 className="font-headline text-headline-md" id="account-heading">Account</h2>
        <p className="mt-1 text-body-md text-light-on-surface-variant">
          Manage your sign-in details.
        </p>
      </div>
      <SettingsField label="Email">
        <input aria-readonly="true" className={`${settingsInputClass} opacity-70`} readOnly value={email} />
      </SettingsField>
      <form className="flex max-w-lg flex-col items-start gap-gutter-sm" onSubmit={handlePasswordChange}>
        <SettingsField label="New password">
          <input
            autoComplete="new-password"
            className={settingsInputClass}
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </SettingsField>
        {passwordError && <p className="text-body-sm text-light-error" role="alert">{passwordError}</p>}
        {passwordNotice && <p className="text-body-sm text-on-success-container" role="status">{passwordNotice}</p>}
        <Button disabled={isUpdatingPassword} type="submit">
          {isUpdatingPassword ? 'Updating…' : 'Change password'}
        </Button>
      </form>
      <div className="flex flex-col items-start gap-gutter-xs border-t border-light-outline-variant pt-gutter-md">
        <h3 className="font-title text-title-sm">Sign out</h3>
        <p className="text-body-sm text-light-on-surface-variant">Sign out of this account on this device.</p>
        {signOutError && <p className="text-body-sm text-light-error" role="alert">{signOutError}</p>}
        <Button disabled={isSigningOut} onClick={() => void handleSignOut()} variant="secondary">
          {isSigningOut ? 'Signing out…' : 'Sign out'}
        </Button>
      </div>
    </section>
  )
}
