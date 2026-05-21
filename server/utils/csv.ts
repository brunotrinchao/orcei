/**
 * Converte um array de objetos JSON para uma string CSV
 */
export function jsonToCsv(data: any[]): string {
  if (!data || data.length === 0) return ''

  // Extrair cabeçalhos (chaves do primeiro objeto)
  const headers = Object.keys(data[0])
  
  // Criar a linha de cabeçalho
  const csvRows = []
  csvRows.push(headers.join(','))

  // Criar as linhas de dados
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header]
      
      // Tratar valores nulos, undefined ou objetos complexos
      let cell = val === null || val === undefined ? '' : val
      
      if (typeof cell === 'object') {
        cell = JSON.stringify(cell)
      }
      
      // Escapar aspas duplas e envolver valores com vírgulas ou quebras de linha entre aspas
      const stringVal = String(cell)
      const escaped = stringVal.replace(/"/g, '""')
      
      if (escaped.search(/([",\n])/) !== -1) {
        return `"${escaped}"`
      }
      return escaped
    })
    
    csvRows.push(values.join(','))
  }

  return csvRows.join('\n')
}
