export function formatWon(value) {
  return `${Number(value || 0).toLocaleString('ko-KR')}원`
}

export function formatHundredMillion(value) {
  const amount = Number(value || 0)
  const absoluteAmount = Math.abs(amount)

  if (absoluteAmount >= 100000000) {
    return `${(amount / 100000000).toLocaleString('ko-KR', {
      maximumFractionDigits: 1,
    })}억원`
  }

  if (absoluteAmount >= 10000) {
    return `${(amount / 10000).toLocaleString('ko-KR', {
      maximumFractionDigits: 1,
    })}만원`
  }

  return formatWon(amount)
}
