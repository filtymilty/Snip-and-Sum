export type OverlayMode = 'idle' | 'capturing' | 'reviewing'

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

export interface CaptureToken {
  id: string
  text: string
  normalizedValue: number | null
  isNegative: boolean
  confidence: number | null
  correctedByUser: boolean
}

export type CaptureStatus = 'idle' | 'pending' | 'complete' | 'error'

export interface CaptureRegion {
  id: string
  pageId: string
  bounds: Bounds
  status: CaptureStatus
  tokens: CaptureToken[]
  sum: number
  createdAt: number
  updatedAt: number
}

export interface CapturePage {
  id: string
  index: number
  label: string
  regionIds: string[]
  createdAt: number
  updatedAt: number
}

export interface SelectionState {
  regionIds: string[]
  tokenIds: string[]
}
