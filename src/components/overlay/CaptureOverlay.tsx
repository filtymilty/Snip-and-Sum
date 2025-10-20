import { useEffect } from 'react'
import { useCaptureStore } from '../../state/captureStore'

const overlayHints = [
  'Click and drag to outline every number group you want to total.',
  'Press ESC any time to exit capture mode.',
  'Use the banner controls to flip between pages once you are done.',
]

export const CaptureOverlay = () => {
  const cancelCapture = useCaptureStore((state) => state.cancelCapture)

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        cancelCapture()
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [cancelCapture])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/85 backdrop-blur-xl">
      <div className="mt-32 w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-2xl">
        <h2 className="text-2xl font-semibold tracking-tight">Capture in progress</h2>
        <p className="mt-2 text-sm text-white/70">
          Screen sharing prototype coming soon. For now, imagine your live screen behind this overlay while you draw rectangles
          around each total.
        </p>
        <ul className="mt-6 space-y-3 text-sm text-white/70">
          {overlayHints.map((hint) => (
            <li key={hint} className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-xs font-semibold text-brand-200">
                ★
              </span>
              <span>{hint}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-8 button-secondary"
          onClick={cancelCapture}
        >
          Exit capture (Esc)
        </button>
      </div>
    </div>
  )
}
