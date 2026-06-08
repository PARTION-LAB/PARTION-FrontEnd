export function formatWon(value) {
  return `${Number(value || 0).toLocaleString('ko-KR')}원`
}

export function formatHundredMillion(value) {
  return `${(Number(value || 0) / 100000000).toLocaleString('ko-KR', {
    maximumFractionDigits: 1,
  })}억원`
}
