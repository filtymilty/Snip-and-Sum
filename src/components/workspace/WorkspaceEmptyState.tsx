import { formatCurrency } from '../../utils/format'
import { useCaptureStore } from '../../state/captureStore'

export const WorkspaceEmptyState = () => {
  const activePageId = useCaptureStore((state) => state.activePageId)
  const getPageTotal = useCaptureStore((state) => state.getPageTotal)
  const beginCapture = useCaptureStore((state) => state.beginCapture)
  const selectionCount = useCaptureStore((state) => state.selection.regionIds.length)

  const pageTotal = activePageId ? getPageTotal(activePageId) : 0

  return (
    <div className="glass-panel relative mx-auto flex max-w-3xl flex-col gap-6 p-10 text-white">
      <div className="absolute inset-x-10 -top-5 flex justify-center">
        <span className="rounded-full border border-brand-400/40 bg-brand-500/20 px-5 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-brand-100">
          Step one
        </span>
      </div>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight">
        Start capturing numbers to build your first Snip &amp; Sum workspace
      </h2>
      <p className="text-base text-white/70">
        Click “Start capture” in the banner to open the overlay. Draw rectangles around each cluster of numbers—Snip &amp; Sum will
        OCR the values, guess their sign, and surface quick totals for every area you select.
      </p>
      <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Selections</p>
          <p className="mt-1 text-2xl font-semibold text-white">{selectionCount}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Current page total</p>
          <p className="mt-1 text-2xl font-semibold text-white">{formatCurrency(pageTotal)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Next steps</p>
          <p className="mt-1 text-sm">Capture a rectangle or add another page to start batching totals.</p>
        </div>
      </div>
      <div>
        <button type="button" className="button-primary" onClick={beginCapture}>
          Start capture
        </button>
      </div>
    </div>
  )
}
