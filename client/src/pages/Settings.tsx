import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useBlocker, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLearnerSettings } from '../hooks/useLearnerSettings'
import { updatePreferences } from '../services/preferences'
import type { LearnerSettings } from '../types/preferences'
import { AccountSettings } from '../components/settings/AccountSettings'
import { GoalsSettings } from '../components/settings/GoalsSettings'
import { InterestsSettings } from '../components/settings/InterestsSettings'
import { PrivacySettings } from '../components/settings/PrivacySettings'
import { StudySettings } from '../components/settings/StudySettings'
import { TutorSettings } from '../components/settings/TutorSettings'
import { VoiceSettings } from '../components/settings/VoiceSettings'
import { SettingsTabNavigation } from '../components/settings/SettingsTabNavigation'
import type { SettingsTab } from '../components/settings/settingsTabs'
import { UnsavedChangesDialog } from '../components/settings/UnsavedChangesDialog'
import { Button } from '../components/ui'
import { SuggestionsForYouCard } from '../components/profileSuggestions/SuggestionsForYouCard'

export default function Settings() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const settingsQuery = useLearnerSettings()
  const [draft, setDraft] = useState<LearnerSettings | null>(null)
  const [activeTab, setActiveTab] = useState<SettingsTab>('goals')
  const [savedNotice, setSavedNotice] = useState('')
  const saveMutation = useMutation({
    mutationFn: updatePreferences,
    onSuccess: (savedSettings) => {
      setDraft(savedSettings)
      queryClient.setQueryData(['preferences'], savedSettings)
      setSavedNotice('Your settings have been saved.')
    },
  })

  const activeSettings = draft ?? settingsQuery.data ?? null
  const isDirty = Boolean(activeSettings && settingsQuery.data
    && JSON.stringify(activeSettings) !== JSON.stringify(settingsQuery.data))
  const blocker = useBlocker(isDirty)

  useEffect(() => {
    if (!isDirty) return
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  useEffect(() => {
    if (!isDirty && blocker.state === 'blocked') blocker.reset()
  }, [blocker, isDirty])

  function updateDraft(changes: Partial<LearnerSettings>) {
    setSavedNotice('')
    saveMutation.reset()
    setDraft((current) => {
      const currentSettings = current ?? settingsQuery.data
      return currentSettings ? { ...currentSettings, ...changes } : current
    })
  }

  function handleSave() {
    if (activeSettings) saveMutation.mutate(activeSettings)
  }

  function renderActivePanel(settings: LearnerSettings) {
    switch (activeTab) {
      case 'goals':
        return <GoalsSettings onChange={updateDraft} settings={settings} />
      case 'study':
        return <StudySettings onChange={updateDraft} settings={settings} />
      case 'tutor':
        return <TutorSettings onChange={updateDraft} settings={settings} />
      case 'voice':
        return <VoiceSettings onChange={updateDraft} settings={settings} />
      case 'interests':
        return <InterestsSettings onChange={updateDraft} settings={settings} />
      case 'privacy':
        return <PrivacySettings onChange={updateDraft} settings={settings} />
      case 'account':
        return (
          <AccountSettings
            email={user?.email ?? ''}
            onSignOut={async () => {
              await signOut()
              navigate('/login', { replace: true })
            }}
          />
        )
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-gutter-lg px-gutter-md py-gutter-lg sm:px-page-margin">
      <header>
        <span className="font-mono text-label-sm uppercase tracking-wider text-light-secondary">
          Your learning experience
        </span>
        <h1 className="mt-1 font-headline text-display-lg-mobile text-light-on-surface md:text-headline-lg">
          Settings
        </h1>
      </header>

      <SuggestionsForYouCard
        disabled={isDirty || saveMutation.isPending}
        onAccepted={() => setDraft(null)}
      />

      {settingsQuery.isLoading ? (
        <div aria-label="Loading settings" className="flex flex-col gap-gutter-md" role="status">
          <span className="sr-only">Loading settings</span>
          <div className="h-12 animate-pulse rounded-md bg-light-surface-container-high" />
          <div className="h-64 animate-pulse rounded-default bg-light-surface-container-high" />
        </div>
      ) : settingsQuery.isError ? (
        <div className="flex flex-wrap items-center justify-between gap-gutter-sm rounded-default border border-light-error bg-light-error-container px-gutter-md py-gutter-sm text-light-on-error-container" role="alert">
          <span>{settingsQuery.error.message}</span>
          <Button onClick={() => void settingsQuery.refetch()} size="sm" variant="secondary">Retry</Button>
        </div>
      ) : activeSettings ? (
        <>
          <SettingsTabNavigation activeTab={activeTab} onSelect={setActiveTab} />

          <section
            aria-labelledby={`settings-tab-${activeTab}`}
            className="min-h-72 rounded-default border border-light-outline-variant bg-light-surface-container-lowest p-gutter-md sm:p-gutter-lg"
            id={`settings-panel-${activeTab}`}
            role="tabpanel"
            tabIndex={0}
          >
            <fieldset
              className="min-w-0 border-0 p-0"
              disabled={saveMutation.isPending}
            >
              {renderActivePanel(activeSettings)}
            </fieldset>
          </section>

          <div className="flex flex-col gap-gutter-sm border-t border-light-outline-variant pt-gutter-md sm:flex-row sm:items-center sm:justify-between">
            <div aria-live="polite" className="min-h-6 text-body-sm">
              {isDirty && <span className="text-light-on-surface-variant">You have unsaved changes.</span>}
              {savedNotice && <span className="text-on-success-container" role="status">{savedNotice}</span>}
              {saveMutation.isError && (
                <span className="text-light-error" role="alert">
                  {saveMutation.error.message} Your changes are still here; please try again.
                </span>
              )}
            </div>
            <Button disabled={!isDirty || saveMutation.isPending} onClick={handleSave} type="button">
              {saveMutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </>
      ) : null}

      {blocker.state === 'blocked' && (
        <UnsavedChangesDialog
          onDiscard={() => blocker.proceed?.()}
          isSaving={saveMutation.isPending}
          onStay={() => blocker.reset?.()}
        />
      )}
    </div>
  )
}
