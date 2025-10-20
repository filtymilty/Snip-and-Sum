import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { clsx } from 'clsx'
import { useCaptureStore } from '../../state/captureStore'
import type { Bounds } from '../../types/capture'

type DraftRectangle = {
  originDisplay: { x: number; y: number }
  originVideo: { x: number; y: number }
  currentDisplay: { x: number; y: number }
  currentVideo: { x: number; y: number }
}

const overlayHints = [
  'Click and drag to outline every number group you want to total.',
  'Press ESC any time to exit capture mode.',
  'Use the banner controls to flip between pages once you are done.',
]

const MIN_RECT_SIZE = 10

export const CaptureOverlay = () => {
  const cancelCaptureStore = useCaptureStore((state) => state.cancelCapture)
  const finishCapture = useCaptureStore((state) => state.finishCapture)
  const stageRegion = useCaptureStore((state) => state.stageRegion)
  const removeRegion = useCaptureStore((state) => state.removeRegion)
  const activePageId = useCaptureStore((state) => state.activePageId)
  const page = useCaptureStore((state) => state.pages[state.activePageId])
  const regions = useCaptureStore((state) => state.regions)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [draft, setDraft] = useState<DraftRectangle | null>(null)
  const [isRequestingStream, setIsRequestingStream] = useState(true)
  const [streamError, setStreamError] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  const pageRegions = useMemo(() => {
    if (!page) {
      return []
    }
    return page.regionIds
      .map((regionId) => regions[regionId])
      .filter((region): region is NonNullable<typeof region> => Boolean(region))
  }, [page, regions])

  const stopStream = useCallback(() => {
    const stream = streamRef.current
    if (!stream) {
      return
    }
    stream.getTracks().forEach((track) => {
      try {
        track.stop()
      } catch (error) {
        console.warn('Failed to stop capture track', error)
      }
    })
    streamRef.current = null
  }, [])

  const cancelCapture = useCallback(() => {
    stopStream()
    cancelCaptureStore()
  }, [cancelCaptureStore, stopStream])

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        cancelCapture()
      }
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        stopStream()
        finishCapture()
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [cancelCapture, finishCapture, stopStream])

  const requestStream = useCallback(async () => {
    setIsRequestingStream(true)
    setStreamError(null)
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: false,
      })

      const video = videoRef.current
      if (!video) {
        stream.getTracks().forEach((track) => track.stop())
        if (isMountedRef.current) {
          setStreamError('Unable to attach to video element.')
        }
        return
      }

      stopStream()
      streamRef.current = stream
      video.srcObject = stream
      try {
        await video.play()
      } catch (error) {
        console.warn('Autoplay rejected', error)
      }
    } catch (error) {
      console.error('Screen capture failed', error)
      if (isMountedRef.current) {
        setStreamError('Screen capture was blocked or cancelled. Try again to restart capture mode.')
      }
    } finally {
      if (isMountedRef.current) {
        setIsRequestingStream(false)
      }
    }
  }, [stopStream])

  useEffect(() => {
    isMountedRef.current = true
    requestStream()
    return () => {
      isMountedRef.current = false
      stopStream()
    }
  }, [requestStream, stopStream])

  const projectPoint = useCallback(
    (clientX: number, clientY: number) => {
      const video = videoRef.current
      if (!video) {
        return null
      }
      const rect = video.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) {
        return null
      }

      const videoWidth = video.videoWidth
      const videoHeight = video.videoHeight
      if (videoWidth === 0 || videoHeight === 0) {
        return null
      }

      const clampedClientX = Math.min(Math.max(clientX, rect.left), rect.right)
      const clampedClientY = Math.min(Math.max(clientY, rect.top), rect.bottom)

      const displayX = clampedClientX - rect.left
      const displayY = clampedClientY - rect.top

      const scaleX = videoWidth / rect.width
      const scaleY = videoHeight / rect.height

      return {
        display: { x: displayX, y: displayY },
        video: { x: displayX * scaleX, y: displayY * scaleY },
      }
    },
    [],
  )

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return
      }
      const projected = projectPoint(event.clientX, event.clientY)
      if (!projected) {
        return
      }
      event.currentTarget.setPointerCapture(event.pointerId)
      setDraft({
        originDisplay: projected.display,
        originVideo: projected.video,
        currentDisplay: projected.display,
        currentVideo: projected.video,
      })
    },
    [projectPoint],
  )

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!draft) {
        return
      }
      const projected = projectPoint(event.clientX, event.clientY)
      if (!projected) {
        return
      }

      setDraft((current) =>
        current
          ? {
              ...current,
              currentDisplay: projected.display,
              currentVideo: projected.video,
            }
          : current,
      )
    },
    [draft, projectPoint],
  )

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      setDraft((current) => {
        if (!current) {
          return null
        }

        const width = Math.abs(current.currentVideo.x - current.originVideo.x)
        const height = Math.abs(current.currentVideo.y - current.originVideo.y)
        if (width < MIN_RECT_SIZE || height < MIN_RECT_SIZE) {
          return null
        }

        const bounds: Bounds = {
          x: Math.min(current.originVideo.x, current.currentVideo.x),
          y: Math.min(current.originVideo.y, current.currentVideo.y),
          width,
          height,
        }

        stageRegion(bounds, activePageId)
        return null
      })
    },
    [activePageId, stageRegion],
  )

  const draftDisplayBounds = useMemo(() => {
    if (!draft) {
      return null
    }
    const x = Math.min(draft.originDisplay.x, draft.currentDisplay.x)
    const y = Math.min(draft.originDisplay.y, draft.currentDisplay.y)
    const width = Math.abs(draft.currentDisplay.x - draft.originDisplay.x)
    const height = Math.abs(draft.currentDisplay.y - draft.originDisplay.y)
    return { x, y, width, height }
  }, [draft])

  const translateRegionToDisplay = useCallback(
    (bounds: Bounds) => {
      const video = videoRef.current
      if (!video) {
        return null
      }
      const rect = video.getBoundingClientRect()
      const videoWidth = video.videoWidth
      const videoHeight = video.videoHeight
      if (rect.width === 0 || rect.height === 0 || videoWidth === 0 || videoHeight === 0) {
        return null
      }

      const scaleX = rect.width / videoWidth
      const scaleY = rect.height / videoHeight

      return {
        x: bounds.x * scaleX,
        y: bounds.y * scaleY,
        width: bounds.width * scaleX,
        height: bounds.height * scaleY,
      }
    },
    [],
  )

  const handleUndoLast = () => {
    if (!page || page.regionIds.length === 0) {
      return
    }
    const lastRegionId = page.regionIds[page.regionIds.length - 1]
    removeRegion(lastRegionId)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90">
      <video ref={videoRef} className="absolute inset-0 h-full w-full object-contain" muted playsInline />
      <div
        role="presentation"
        className="absolute inset-0 cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="pointer-events-none absolute inset-0">
          {pageRegions.map((region) => {
            const display = translateRegionToDisplay(region.bounds)
            if (!display) {
              return null
            }
            const index = page?.regionIds.indexOf(region.id) ?? 0
            return (
              <Fragment key={region.id}>
                <div
                  className="absolute rounded-xl border-2 border-brand-300/80 bg-brand-500/10"
                  style={{
                    left: display.x,
                    top: display.y,
                    width: display.width,
                    height: display.height,
                  }}
                />
                <div
                  className="absolute -translate-y-full rounded-full bg-brand-500/80 px-3 py-1 text-xs font-semibold text-slate-950 shadow-lg"
                  style={{ left: display.x, top: display.y }}
                >
                  Area {index + 1}
                </div>
              </Fragment>
            )
          })}
          {draftDisplayBounds && (
            <div
              className="absolute rounded-xl border-2 border-white/80 bg-white/10"
              style={{
                left: draftDisplayBounds.x,
                top: draftDisplayBounds.y,
                width: draftDisplayBounds.width,
                height: draftDisplayBounds.height,
              }}
            />
          )}
        </div>
      </div>

      <div className="pointer-events-auto absolute left-1/2 top-8 flex w-[min(560px,90vw)] -translate-x-1/2 flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/80 p-6 text-white shadow-2xl backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Capture in progress</h2>
            <p className="mt-1 text-sm text-white/70">
              Share your screen, draw rectangles around each group of numbers, then press “Done selecting” in the banner (or
              hit Enter) to start OCR.
            </p>
          </div>
          <span
            className={clsx(
              'inline-flex h-10 min-w-[2.5rem] items-center justify-center rounded-full border border-white/10 px-3 text-xs font-semibold uppercase tracking-[0.25em] text-white/60',
              isRequestingStream
                ? 'bg-white/5'
                : streamError
                  ? 'bg-red-500/20 text-red-200'
                  : 'bg-emerald-500/15 text-emerald-200',
            )}
          >
            {isRequestingStream ? '…' : streamError ? 'ERR' : 'LIVE'}
          </span>
        </div>
        <ul className="space-y-2 text-xs text-white/70">
          {overlayHints.map((hint) => (
            <li key={hint} className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-[0.6rem] font-semibold text-brand-200">
                ★
              </span>
              <span>{hint}</span>
            </li>
          ))}
        </ul>

        {streamError && (
          <div className="rounded-2xl border border-red-500/50 bg-red-500/20 px-4 py-3 text-xs text-red-100">
            {streamError}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs text-white/70">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            Areas captured: {pageRegions.length}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Active page: {page?.label ?? '—'}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="button-secondary" onClick={cancelCapture}>
            Exit capture (Esc)
          </button>
          {streamError && (
            <button type="button" className="button-secondary" onClick={requestStream}>
              Retry screen share
            </button>
          )}
          <button type="button" className="button-secondary" onClick={handleUndoLast} disabled={!page || page.regionIds.length === 0}>
            Undo last area
          </button>
          <button
            type="button"
            className="button-primary"
            onClick={() => {
              stopStream()
              finishCapture()
            }}
          >
            Done selecting (Enter)
          </button>
        </div>
      </div>
    </div>
  )
}
