import type { OAuthProvider } from '../../services/auth'
import { Button } from '../ui'

interface SocialButtonsProps {
  disabled: boolean
  onSelectProvider: (provider: OAuthProvider) => void
}

export function SocialButtons({ disabled, onSelectProvider }: SocialButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-gutter-sm">
      <Button
        disabled={disabled}
        onClick={() => onSelectProvider('github')}
        variant="secondary"
      >
        GitHub
      </Button>
      <Button
        disabled={disabled}
        onClick={() => onSelectProvider('google')}
        variant="secondary"
      >
        Google
      </Button>
    </div>
  )
}
