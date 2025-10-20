import { createWorker, type Worker } from 'tesseract.js'
import type { CaptureToken } from '../../types/capture'
import { createId } from '../../utils/id'

export interface OCRRequest {
  image: ImageBitmap | HTMLCanvasElement | HTMLImageElement
  language?: string
}

export interface OCRResponse {
  text: string
  tokens: CaptureToken[]
}

const buildToken = (text: string): CaptureToken => {
  const normalized = Number(text.replace(/[^0-9.-]/g, ''))
  const hasParentheses = /\(.*\)/.test(text)
  const isNegative = hasParentheses || text.trim().startsWith('-')
  return {
    id: createId('token'),
    text,
    normalizedValue: Number.isFinite(normalized) ? normalized : null,
    isNegative,
    confidence: null,
    correctedByUser: false,
  }
}

export class OCRService {
  private worker: Worker | null = null
  private loading = false

  private async ensureWorker(language = 'eng') {
    if (this.worker || this.loading) {
      return this.worker
    }
    this.loading = true
    this.worker = await createWorker(language, 1)
    this.loading = false
    return this.worker
  }

  async recognize({ image, language }: OCRRequest): Promise<OCRResponse> {
    try {
      const worker = await this.ensureWorker(language)
      if (!worker) {
        return { text: '', tokens: [] }
      }
      const result = await worker.recognize(image)
      const tokens = (result?.data?.text || '')
        .split(/\s+/)
        .map((text) => text.trim())
        .filter(Boolean)
        .map((text) => ({ ...buildToken(text), confidence: result.data.confidence ?? null }))

      return {
        text: result.data.text ?? '',
        tokens,
      }
    } catch (error) {
      console.error('OCR error', error)
      return { text: '', tokens: [] }
    }
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
    }
  }
}

export const ocrService = new OCRService()
