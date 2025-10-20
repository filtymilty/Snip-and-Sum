const amountFormatter = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const formatAmount = (value: number) => amountFormatter.format(value)

export const formatDelta = (value: number) => {
  const formatted = formatAmount(Math.abs(value))
  if (value === 0) {
    return formatted
  }
  return value < 0 ? `-${formatted}` : `+${formatted}`
}
