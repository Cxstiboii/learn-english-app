import { Button } from '../ui'

interface RecordControlsProps {
  isListening: boolean
  isSupported: boolean
  hasTranscript: boolean
  isEvaluating: boolean
  onRecordToggle: () => void
  onEvaluate: () => void
}

export function RecordControls({
  isListening,
  isSupported,
  hasTranscript,
  isEvaluating,
  onRecordToggle,
  onEvaluate,
}: RecordControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-gutter-sm">
      <Button
        aria-pressed={isListening}
        className="gap-2 border-light-secondary bg-light-secondary text-light-on-secondary hover:opacity-90"
        disabled={!isSupported && !isListening}
        onClick={onRecordToggle}
      >
        <span aria-hidden="true" className="material-symbols-outlined text-body-lg">
          {isListening ? 'stop' : 'mic'}
        </span>
        {isListening ? 'Stop' : 'Record Answer'}
      </Button>

      <Button
        disabled={!hasTranscript || isListening || isEvaluating}
        onClick={onEvaluate}
      >
        {isEvaluating ? 'Evaluating…' : 'Evaluate Transcript'}
      </Button>
    </div>
  )
}
