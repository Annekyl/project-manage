function escapeCell(cell) {
  const str = String(cell ?? '')
  return str.includes(',') || str.includes('"') || str.includes('\n')
    ? `"${str.replace(/"/g, '""')}"`
    : str
}

export function exportCsv(filename, headers, rows, raw = false) {
  const lines = []
  if (!raw && headers.length > 0) {
    lines.push(headers.map(escapeCell).join(','))
  }
  rows.forEach(row => {
    if (Array.isArray(row)) {
      lines.push(row.map(escapeCell).join(','))
    }
  })

  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
