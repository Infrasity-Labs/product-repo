/** Download a CSV file built from a header row and data rows (every value quoted). */
export function downloadCsv(name: string, head: string[], rows: unknown[][]) {
  const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const blob = new Blob([[head.map(q).join(','), ...rows.map((r) => r.map(q).join(','))].join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}
