import type { ReactNode } from 'react'

interface SelectOption<Value extends string> {
  value: Value
  label: string
}

interface SettingsSelectProps<Value extends string> {
  label: string
  value: Value
  options: readonly SelectOption<Value>[]
  onChange: (value: Value) => void
}

export function SettingsSelect<Value extends string>({
  label,
  value,
  options,
  onChange,
}: SettingsSelectProps<Value>) {
  return (
    <label className="flex flex-col gap-1 font-label text-label-md">
      {label}
      <select
        className="min-h-11 rounded-md border border-light-outline-variant bg-light-surface-container-lowest px-3 font-body text-body-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary"
        onChange={(event) => {
          const option = options.find((item) => item.value === event.target.value)
          if (option) onChange(option.value)
        }}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}

export function SettingsField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="flex flex-col gap-1 font-label text-label-md">
      {label}
      {children}
    </label>
  )
}

export const settingsInputClass = 'min-h-11 w-full rounded-md border border-light-outline-variant bg-light-surface-container-lowest px-3 font-body text-body-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-primary'
