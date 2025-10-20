import { useMemo } from 'react'
import { useCaptureStore } from '../../state/captureStore'
import { formatCurrency, formatDelta } from '../../utils/format'

const PlaceholderRow = () => (
  <div className="flex items-center justify-between rounded-xl border border-dashed border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
    <span>Regions will appear here once you finish a capture.</span>
    <span className="font-medium text-white/70">—</span>
  </div>
)

export const PageSummaryPanel = () => {
  const activePageId = useCaptureStore((state) => state.activePageId)
  const pages = useCaptureStore((state) => state.pages)
  const regions = useCaptureStore((state) => state.regions)
  const getPageTotal = useCaptureStore((state) => state.getPageTotal)
  const selectionTotal = useCaptureStore((state) => state.getSelectionTotal())
  const selection = useCaptureStore((state) => state.selection)
  const toggleRegionSelection = useCaptureStore((state) => state.toggleRegionSelection)

  const activePage = activePageId ? pages[activePageId] : undefined
  const pageTotal = activePageId ? getPageTotal(activePageId) : 0

  const rows = useMemo(() => {
    if (!activePage) {
      return []
    }
    return activePage.regionIds.map((regionId) => {
      const region = regions[regionId]
      return {
        id: regionId,
        label: `Area ${activePage.regionIds.indexOf(regionId) + 1}`,
        sum: region?.sum ?? 0,
        count: region?.tokens.length ?? 0,
        selected: selection.regionIds.includes(regionId),
      }
    })
  }, [activePage, regions, selection.regionIds])

  return (
    <aside className="w-full border-t border-white/5 bg-surface/80 px-6 py-8 text-white backdrop-blur-xl lg:max-w-sm lg:border-t-0 lg:border-l">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Page summary</h2>
          <p className="mt-1 text-sm text-white/60">
            Review totals for the current page. Select areas to build an on-the-fly subtotal.
          </p>
        </div>

        <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm font-medium text-brand-100 shadow-inner">
          <div className="flex items-center justify-between">
            <span>Page total</span>
            <span className="text-base font-semibold text-white">{formatCurrency(pageTotal)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-brand-100/70">
            <span>Selected subtotal</span>
            <span className="font-semibold text-brand-100">{formatDelta(selectionTotal)}</span>
          </div>
        </div>

        <div className="space-y-3">
          {rows.length === 0 && <PlaceholderRow />}
          {rows.map((row) => (
            <button
              key={row.id}
              type="button"
              className={
                'w-full rounded-xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950'
              }
              style={{
                borderColor: row.selected ? 'rgba(56, 189, 248, 0.45)' : 'rgba(255, 255, 255, 0.08)',
                backgroundColor: row.selected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.35)',
              }}
              onClick={() => toggleRegionSelection(row.id)}
            >
              <div className="flex items-center justify-between text-sm text-white">
                <span className="font-medium">{row.label}</span>
                <span className="font-semibold">{formatCurrency(row.sum)}</span>
              </div>
              <div className="mt-1 text-xs text-white/60">{row.count} detected values</div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
