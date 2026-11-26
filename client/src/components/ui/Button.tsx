import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'icon'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border border-light-primary border-b-2 bg-light-primary text-light-on-primary hover:bg-light-primary-container',
  secondary:
    'border border-light-outline-variant bg-light-surface-container-lowest text-light-on-surface hover:bg-light-surface-container-low',
  ghost:
    'border border-transparent bg-transparent text-light-on-surface-variant hover:bg-light-surface-container-low hover:text-light-on-surface',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'gap-1.5 rounded-md px-3 py-2 text-label-md',
  md: 'gap-2 rounded-md px-3.5 py-2.5 text-label-lg',
  icon: 'size-8 rounded-md p-1.5',
}

export function Button({
  className = '',
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center transition-colors duration-state-change ease-state-change focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      type={type}
      {...props}
    />
  )
}
