export const settingsTabs = [
  { id: 'goals', label: 'Goals & level' },
  { id: 'study', label: 'Study plan' },
  { id: 'tutor', label: 'Tutor' },
  { id: 'voice', label: 'Voice' },
  { id: 'interests', label: 'Interests' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'account', label: 'Account' },
] as const
export type SettingsTab = (typeof settingsTabs)[number]['id']
