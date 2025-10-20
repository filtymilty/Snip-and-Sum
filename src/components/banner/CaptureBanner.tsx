import { memo, useMemo, type ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { useCaptureStore } from '../../state/captureStore'
import { formatCurrency } from '../../utils/format'

const BannerButton = ({
  variant = 'primary',
  children,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }) => (
  <button
    type="button"
    className={clsx(variant === 'primary' ? 'button-primary' : 'button-secondary', className)}
    {...rest}
  >
    {children}
  </button>
)

export const CaptureBanner = memo(function CaptureBanner() {
  const overlayMode = useCaptureStore((state) => state.overlayMode)
  const beginCapture = useCaptureStore((state) => state.beginCapture)
  const cancelCapture = useCaptureStore((state) => state.cancelCapture)
  const finishCapture = useCaptureStore((state) => state.finishCapture)
  const addPage = useCaptureStore((state) => state.addPage)
  const goToPage = useCaptureStore((state) => state.goToPage)
  const activePageId = useCaptureStore((state) => state.activePageId)
  const pageOrder = useCaptureStore((state) => state.pageOrder)
  const pages = useCaptureStore((state) => state.pages)
  const selectionCount = useCaptureStore((state) => state.selection.regionIds.length)
  const getPageTotal = useCaptureStore((state) => state.getPageTotal)
  const grandTotal = useCaptureStore((state) => state.getGrandTotal())

  const activeIndex = pageOrder.findIndex((id) => id === activePageId)
  const activePage = activePageId ? pages[activePageId] : undefined
  const isCapturing = overlayMode === 'capturing'
  const isReviewing = overlayMode === 'reviewing'

  const pageTotal = activePageId ? getPageTotal(activePageId) : 0

  const pageSummary = useMemo(() => {
    if (!activePage) {
      return 'No page selected'
    }
    const indexDisplay = activeIndex >= 0 ? `Page ${activeIndex + 1} of ${pageOrder.length}` : 'Page overview'
    return `${indexDisplay} • Regions ${activePage.regionIds.length}`
  }, [activeIndex, activePage, pageOrder.length])

  const goPrevious = () => {
    if (activeIndex > 0) {
      goToPage(pageOrder[activeIndex - 1])
    }
  }

  const goNext = () => {
    if (activeIndex >= 0 && activeIndex < pageOrder.length - 1) {
      goToPage(pageOrder[activeIndex + 1])
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-surface/90 shadow-banner backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/40">Snip &amp; Sum</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-2 text-white">
            <h1 className="text-xl font-semibold tracking-tightest">Workspace</h1>
            {activePage && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70">
                {pageSummary}
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/60">
            <span>{overlayMode === 'capturing' ? 'Capture mode' : overlayMode === 'reviewing' ? 'Review mode' : 'Idle mode'}</span>
            <span>Selected areas: {selectionCount}</span>
            <span>Page total: {formatCurrency(pageTotal)}</span>
            <span>Grand total: {formatCurrency(grandTotal)}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isCapturing ? (
            <BannerButton onClick={beginCapture} disabled={isCapturing}>
              Start capture
            </BannerButton>
          ) : (
            <div className="flex items-center gap-2">
              <BannerButton variant="secondary" onClick={cancelCapture}>
                Exit capture
              </BannerButton>
              <BannerButton onClick={finishCapture}>Done selecting</BannerButton>
            </div>
          )}

          <BannerButton variant="secondary" onClick={() => addPage()}>Add page</BannerButton>

          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
            <button
              type="button"
              className="rounded-full px-2 py-1 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={goPrevious}
              disabled={activeIndex <= 0}
            >
              Prev
            </button>
            <span className="min-w-[72px] text-center font-medium">
              {pageOrder.length > 0 ? `${activeIndex + 1} / ${pageOrder.length}` : '—'}
            </span>
            <button
              type="button"
              className="rounded-full px-2 py-1 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={goNext}
              disabled={activeIndex === -1 || activeIndex >= pageOrder.length - 1}
            >
              Next
            </button>
          </div>

          {isReviewing && (
            <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-200">
              Review active
            </span>
          )}
        </div>
      </div>
    </header>
  )
})
