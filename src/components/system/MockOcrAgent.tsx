import { useEffect, useRef } from 'react'
import { useCaptureStore } from '../../state/captureStore'
import { createId } from '../../utils/id'
import type { CaptureToken } from '../../types/capture'

const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

const buildMockToken = (value: number): CaptureToken => {
  const magnitude = Math.abs(value)
  const isNegative = value < 0
  return {
    id: createId('token'),
    text: isNegative ? `(${magnitude.toFixed(2)})` : magnitude.toFixed(2),
    normalizedValue: Number(magnitude.toFixed(2)),
    isNegative,
    confidence: Number(randomInRange(0.75, 0.98).toFixed(2)),
    correctedByUser: false,
  }
}

const generateMockTokens = () => {
  const count = Math.floor(randomInRange(2, 5))
  return Array.from({ length: count }, () => {
    const value = randomInRange(25, 750) * (Math.random() < 0.3 ? -1 : 1)
    return buildMockToken(value)
  })
}

const processingDelay = () => randomInRange(600, 1400)

export const MockOcrAgent = () => {
  const pendingRegions = useCaptureStore((state) =>
    Object.values(state.regions).filter((region) => region.status === 'pending'),
  )
  const setRegionStatus = useCaptureStore((state) => state.setRegionStatus)
  const updateRegionTokens = useCaptureStore((state) => state.updateRegionTokens)

  const processingRef = useRef(new Set<string>())
  const timeoutsRef = useRef(new Map<string, number>())

  useEffect(() => {
    pendingRegions.forEach((region) => {
      if (processingRef.current.has(region.id)) {
        return
      }
      processingRef.current.add(region.id)
      setRegionStatus(region.id, 'processing')
      const timeoutId = window.setTimeout(() => {
        const tokens = generateMockTokens()
        updateRegionTokens(region.id, tokens)
        processingRef.current.delete(region.id)
        timeoutsRef.current.delete(region.id)
      }, processingDelay())
      timeoutsRef.current.set(region.id, timeoutId)
    })
  }, [pendingRegions, setRegionStatus, updateRegionTokens])

  useEffect(
    () => () => {
      timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
      timeoutsRef.current.clear()
      processingRef.current.clear()
    },
    [],
  )

  return null
}

export default MockOcrAgent
