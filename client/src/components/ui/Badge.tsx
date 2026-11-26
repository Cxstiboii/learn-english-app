import type { HTMLAttributes } from 'react'

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'error'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral:
    'border border-light-outline-variant bg-light-surface-container-high text-light-on-surface',
  success: 'bg-success-container text-on-success-container',
  warning: 'bg-warning-container text-on-warning-container',
  error: 'bg-light-error-container text-light-on-error-container',
}

export function Badge({
  children,
  className = '',
  role = 'status',
  variant = 'neutral',
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 font-mono text-label-sm ${variantClasses[variant]} ${className}`}
      role={role}
      {...props}
    >
      {children}
    </span>
  )
}
