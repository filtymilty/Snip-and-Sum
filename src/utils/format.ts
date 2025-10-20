const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

export const formatCurrency = (value: number) => currencyFormatter.format(value)

export const formatDelta = (value: number) => {
  const formatted = formatCurrency(Math.abs(value))
  if (value === 0) {
    return formatted
  }
  return value < 0 ? `-${formatted}` : `+${formatted}`
}
