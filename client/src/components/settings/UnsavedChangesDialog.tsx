import { Button } from '../ui'

interface UnsavedChangesDialogProps {
  isSaving: boolean
  onStay: () => void
  onDiscard: () => void
}

export function UnsavedChangesDialog({
  isSaving,
  onStay,
  onDiscard,
}: UnsavedChangesDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-gutter-md">
      <section
        aria-labelledby="unsaved-dialog-title"
        aria-modal="true"
        className="w-full max-w-md rounded-default bg-light-surface-container-lowest p-gutter-lg shadow-xl"
        role="dialog"
      >
        <h2 className="font-headline text-headline-md" id="unsaved-dialog-title">
          Unsaved changes
        </h2>
        <p className="mt-gutter-xs text-body-md text-light-on-surface-variant">
          {isSaving
            ? 'Your settings are being saved. Please stay on this page until the save finishes.'
            : 'You have changes that haven’t been saved. Leave this page and discard them?'}
        </p>
        <div className="mt-gutter-md flex justify-end gap-gutter-sm">
          <Button autoFocus onClick={onStay} variant="secondary">Stay</Button>
          {!isSaving && <Button onClick={onDiscard}>Discard changes</Button>}
        </div>
      </section>
    </div>
  )
}
