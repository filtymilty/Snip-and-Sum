import { create } from 'zustand'
import type {
  Bounds,
  CapturePage,
  CaptureRegion,
  CaptureStatus,
  CaptureToken,
  OverlayMode,
  SelectionState,
} from '../types/capture'
import { createId } from '../utils/id'

const computeRegionSum = (tokens: CaptureToken[]) =>
  tokens.reduce((total, token) => {
    if (token.normalizedValue === null || Number.isNaN(token.normalizedValue)) {
      return total
    }
    const magnitude = Math.abs(token.normalizedValue)
    return token.isNegative ? total - magnitude : total + magnitude
  }, 0)

const createPage = (index: number, label?: string): CapturePage => {
  const id = createId('page')
  const timestamp = Date.now()
  return {
    id,
    index,
    label: label ?? `Page ${index}`,
    regionIds: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

const createRegion = (pageId: string, bounds: Bounds): CaptureRegion => {
  const id = createId('region')
  const timestamp = Date.now()
  return {
    id,
    pageId,
    bounds,
    status: 'pending',
    tokens: [],
    sum: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

interface CaptureStore {
  pages: Record<string, CapturePage>
  regions: Record<string, CaptureRegion>
  pageOrder: string[]
  activePageId: string
  overlayMode: OverlayMode
  bannerVisible: boolean
  selection: SelectionState
  beginCapture: () => void
  finishCapture: () => void
  cancelCapture: () => void
  toggleBanner: (nextState?: boolean) => void
  addPage: (label?: string) => string
  goToPage: (pageId: string) => void
  renamePage: (pageId: string, label: string) => void
  stageRegion: (bounds: Bounds, pageId?: string) => CaptureRegion
  updateRegionTokens: (regionId: string, tokens: CaptureToken[]) => void
  removeRegion: (regionId: string) => void
  toggleRegionSelection: (regionId: string) => void
  resetSelection: () => void
  setRegionStatus: (regionId: string, status: CaptureStatus) => void
  getPageTotal: (pageId: string) => number
  getGrandTotal: () => number
  getSelectionTotal: () => number
}

const initialPage = createPage(1)

export const useCaptureStore = create<CaptureStore>((set, get) => ({
  pages: { [initialPage.id]: initialPage },
  regions: {},
  pageOrder: [initialPage.id],
  activePageId: initialPage.id,
  overlayMode: 'idle',
  bannerVisible: true,
  selection: { regionIds: [], tokenIds: [] },
  beginCapture: () =>
    set(() => ({
      overlayMode: 'capturing',
      bannerVisible: true,
      selection: { regionIds: [], tokenIds: [] },
    })),
  finishCapture: () =>
    set({
      overlayMode: 'reviewing',
    }),
  cancelCapture: () =>
    set({
      overlayMode: 'idle',
      selection: { regionIds: [], tokenIds: [] },
    }),
  toggleBanner: (nextState) =>
    set((state) => ({
      bannerVisible: typeof nextState === 'boolean' ? nextState : !state.bannerVisible,
    })),
  addPage: (label) => {
    const { pageOrder } = get()
    const newPage = createPage(pageOrder.length + 1, label)
    set((state) => ({
      pages: { ...state.pages, [newPage.id]: newPage },
      pageOrder: [...state.pageOrder, newPage.id],
      activePageId: newPage.id,
    }))
    return newPage.id
  },
  goToPage: (pageId) =>
    set((state) => ({
      activePageId: state.pages[pageId] ? pageId : state.activePageId,
    })),
  renamePage: (pageId, label) =>
    set((state) => {
      const page = state.pages[pageId]
      if (!page || page.label === label) {
        return state
      }
      return {
        pages: {
          ...state.pages,
          [pageId]: {
            ...page,
            label,
            updatedAt: Date.now(),
          },
        },
      }
    }),
  stageRegion: (bounds, explicitPageId) => {
    const state = get()
    const targetPageId = explicitPageId ?? state.activePageId
    const page = state.pages[targetPageId]
    if (!page) {
      throw new Error('Unable to stage region without an active page')
    }
    const region = createRegion(targetPageId, bounds)
    set((current) => ({
      regions: { ...current.regions, [region.id]: region },
      pages: {
        ...current.pages,
        [targetPageId]: {
          ...current.pages[targetPageId],
          regionIds: [...current.pages[targetPageId].regionIds, region.id],
          updatedAt: Date.now(),
        },
      },
    }))
    return region
  },
  updateRegionTokens: (regionId, tokens) => {
    set((state) => {
      const region = state.regions[regionId]
      if (!region) {
        return state
      }
      const sum = computeRegionSum(tokens)
      return {
        regions: {
          ...state.regions,
          [regionId]: {
            ...region,
            tokens,
            sum,
            status: 'complete',
            updatedAt: Date.now(),
          },
        },
      }
    })
  },
  removeRegion: (regionId) =>
    set((state) => {
      const region = state.regions[regionId]
      if (!region) {
        return state
      }
      const restRegions = { ...state.regions }
      delete restRegions[regionId]
      const page = state.pages[region.pageId]
      const updatedRegionIds = page.regionIds.filter((id) => id !== regionId)
      return {
        regions: restRegions,
        pages: {
          ...state.pages,
          [page.id]: {
            ...page,
            regionIds: updatedRegionIds,
            updatedAt: Date.now(),
          },
        },
        selection: {
          regionIds: state.selection.regionIds.filter((id) => id !== regionId),
          tokenIds: state.selection.tokenIds.filter((id) => !id.startsWith(`${regionId}:`)),
        },
      }
    }),
  setRegionStatus: (regionId, status) =>
    set((state) => {
      const region = state.regions[regionId]
      if (!region || region.status === status) {
        return state
      }
      return {
        regions: {
          ...state.regions,
          [regionId]: {
            ...region,
            status,
            updatedAt: Date.now(),
          },
        },
      }
    }),
  toggleRegionSelection: (regionId) =>
    set((state) => {
      const isSelected = state.selection.regionIds.includes(regionId)
      return {
        selection: {
          regionIds: isSelected
            ? state.selection.regionIds.filter((id) => id !== regionId)
            : [...state.selection.regionIds, regionId],
          tokenIds: state.selection.tokenIds,
        },
      }
    }),
  resetSelection: () =>
    set({
      selection: { regionIds: [], tokenIds: [] },
    }),
  getPageTotal: (pageId) => {
    const { pages, regions } = get()
    const page = pages[pageId]
    if (!page) {
      return 0
    }
    return page.regionIds.reduce((total, regionId) => total + (regions[regionId]?.sum ?? 0), 0)
  },
  getGrandTotal: () => {
    const state = get()
    return state.pageOrder.reduce((total, pageId) => total + state.getPageTotal(pageId), 0)
  },
  getSelectionTotal: () => {
    const state = get()
    return state.selection.regionIds.reduce((total, regionId) => total + (state.regions[regionId]?.sum ?? 0), 0)
  },
}))
