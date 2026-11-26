import { useId, type InputHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export function Input({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  className = '',
  error,
  ...props
}: InputProps) {
  const errorId = useId()
  const describedBy = [ariaDescribedBy, error ? errorId : undefined]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="flex flex-col gap-1">
      <input
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : ariaInvalid}
        className={`min-h-10 w-full rounded-md border border-light-outline-variant bg-light-surface-container-lowest px-3 py-2 text-body-md text-light-on-surface placeholder:text-light-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-light-surface-container-low disabled:opacity-60 ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-body-sm text-light-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
