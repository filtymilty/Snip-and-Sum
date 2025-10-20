import { CaptureBanner } from './components/banner/CaptureBanner'
import { CaptureOverlay } from './components/overlay/CaptureOverlay'
import { PageSummaryPanel } from './components/panels/PageSummaryPanel'
import { WorkspaceEmptyState } from './components/workspace/WorkspaceEmptyState'
import { useCaptureStore } from './state/captureStore'

function App() {
  const overlayMode = useCaptureStore((state) => state.overlayMode)
  const bannerVisible = useCaptureStore((state) => state.bannerVisible)
  const activePageId = useCaptureStore((state) => state.activePageId)
  const pages = useCaptureStore((state) => state.pages)
  const regions = useCaptureStore((state) => state.regions)

  const activePage = activePageId ? pages[activePageId] : undefined
  const hasRegions = activePage ? activePage.regionIds.length > 0 : Object.keys(regions).length > 0

  return (
    <div className="flex min-h-screen flex-col bg-surface text-white">
      {bannerVisible && <CaptureBanner />}
      <div className="flex flex-1 flex-col lg:flex-row">
        <main className="flex-1 bg-gradient-to-b from-surface via-slate-950/40 to-slate-950 px-6 py-10">
          {hasRegions ? (
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center text-white/60">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
                <h2 className="text-xl font-semibold text-white">Capture canvas coming soon</h2>
                <p className="mt-2 text-sm">
                  We are building the multi-rectangle selector and OCR pipeline next. Once ready, your captured screenshots and
                  detected values will live right here.
                </p>
              </div>
            </div>
          ) : (
            <WorkspaceEmptyState />
          )}
        </main>
        <PageSummaryPanel />
      </div>
      {overlayMode === 'capturing' && <CaptureOverlay />}
    </div>
  )
}

export default App
