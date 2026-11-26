import type { HTMLAttributes } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'muted'
}

const paddingClasses: Record<NonNullable<CardProps['padding']>, string> = {
  none: 'p-0',
  sm: 'p-gutter-sm',
  md: 'p-gutter-md',
  lg: 'p-gutter-lg',
}

const variantClasses: Record<NonNullable<CardProps['variant']>, string> = {
  default: 'border-light-outline-variant bg-light-surface-container-lowest',
  muted: 'border-light-outline-variant bg-light-surface-container-low',
}

export function Card({
  className = '',
  padding = 'md',
  variant = 'default',
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-default border ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
      {...props}
    />
  )
}
