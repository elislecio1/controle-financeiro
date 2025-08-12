import React, { useState, useRef } from 'react'
import { Upload, FileText, Download, AlertCircle, CheckCircle, X } from 'lucide-react'
import { supabaseService } from '../services/supabase'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

interface ColumnMapping {
  [key: string]: string
}

interface PreviewData {
  [key: string]: string
}

const DataImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<string>('')
  const [delimiter, setDelimiter] = useState<string>(',')
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({})
  const [previewData, setPreviewData] = useState<PreviewData[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [totalRows, setTotalRows] = useState(0)
  const [processedRows, setProcessedRows] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mapeamento padrão de colunas
  const defaultMapping: ColumnMapping = {
    'A': 'data',
    'B': 'descricao',
    'C': 'valor',
    'D': 'tipo',
    'E': 'status',
    'F': 'conta',
    'G': 'categoria',
    'H': 'subcategoria',
    'I': 'contato',
    'J': 'vencimento'
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setMessage(null)
    setPreviewData([])
    setTotalRows(0)
    setProcessedRows(0)

    // Determinar tipo de arquivo
    const fileName = selectedFile.name.toLowerCase()
    let detectedType = ''
    let detectedDelimiter = ','

    if (fileName.endsWith('.csv')) {
      detectedType = 'csv'
      // Tentar detectar delimitador automaticamente
      const text = await selectedFile.text()
      if (text.includes(';')) {
        detectedDelimiter = ';'
      } else if (text.includes(',')) {
        detectedDelimiter = ','
      } else if (text.includes('\t')) {
        detectedDelimiter = '\t'
      }
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      detectedType = 'excel'
    } else if (fileName.endsWith('.txt')) {
      detectedType = 'txt'
      // Tentar detectar delimitador para arquivos TXT
      const text = await selectedFile.text()
      if (text.includes(';')) {
        detectedDelimiter = ';'
      } else if (text.includes(',')) {
        detectedDelimiter = ','
      } else if (text.includes('\t')) {
        detectedDelimiter = '\t'
      }
    } else if (fileName.endsWith('.ofx')) {
      detectedType = 'ofx'
    } else {
      setMessage({ type: 'error', text: 'Formato de arquivo não suportado. Use CSV, XLSX, TXT ou OFX.' })
      return
    }

    setFileType(detectedType)
    setDelimiter(detectedDelimiter)

    // Processar arquivo para preview
    await processFileForPreview(selectedFile, detectedType, detectedDelimiter)
  }

  const processFileForPreview = async (file: File, type: string, delimiter: string) => {
    try {
      let data: any[] = []

      if (type === 'csv' || type === 'txt') {
        const text = await file.text()
        const result = Papa.parse(text, {
          delimiter: delimiter,
          header: false,
          skipEmptyLines: true
        })
        data = result.data as any[]
      } else if (type === 'excel') {
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[]
      } else if (type === 'ofx') {
        // Para OFX, vamos tentar processar como texto e extrair informações básicas
        const text = await file.text()
        data = processOFXFile(text)
      }

      if (data.length > 0) {
        // Pegar as primeiras 5 linhas para preview
        const previewRows = data.slice(0, 5)
        setPreviewData(previewRows)
        setTotalRows(data.length)
        
        // Detectar cabeçalhos automaticamente
        if (data.length > 0) {
          const headers = data[0]
          const autoMapping: ColumnMapping = {}
          
          // Criar mapeamento baseado na estrutura real do arquivo
          headers.forEach((header: string, index: number) => {
            const columnLetter = String.fromCharCode(65 + index) // A, B, C, etc.
            const detectedType = detectColumnType(header, data.slice(1))
            autoMapping[columnLetter] = detectedType
            
            console.log(`Coluna ${columnLetter}: "${header}" -> ${detectedType}`)
          })
          
          setColumnMapping(autoMapping)
          
          // Log para debug
          console.log('Mapeamento automático criado:', autoMapping)
          console.log('Primeiras linhas de dados:', data.slice(0, 3))
        }
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error)
      setMessage({ type: 'error', text: 'Erro ao processar arquivo. Verifique o formato.' })
    }
  }

  const processOFXFile = (content: string): any[] => {
    // Processamento básico de OFX - extrair transações
    const lines = content.split('\n')
    const transactions: any[] = []
    let currentTransaction: any = {}
    
    for (const line of lines) {
      if (line.includes('<STMTTRN>')) {
        currentTransaction = {}
      } else if (line.includes('</STMTTRN>')) {
        if (Object.keys(currentTransaction).length > 0) {
          transactions.push(currentTransaction)
        }
      } else if (line.includes('<DTPOSTED>')) {
        const date = line.replace('<DTPOSTED>', '').trim()
        currentTransaction.data = formatOFXDate(date)
      } else if (line.includes('<TRNAMT>')) {
        const amount = line.replace('<TRNAMT>', '').trim()
        currentTransaction.valor = parseFloat(amount)
        currentTransaction.tipo = parseFloat(amount) > 0 ? 'receita' : 'despesa'
      } else if (line.includes('<MEMO>')) {
        const memo = line.replace('<MEMO>', '').trim()
        currentTransaction.descricao = memo
      }
    }
    
    return transactions
  }

  const formatOFXDate = (ofxDate: string): string => {
    // Converter data OFX (YYYYMMDDHHMMSS) para formato brasileiro
    if (ofxDate.length >= 8) {
      const year = ofxDate.substring(0, 4)
      const month = ofxDate.substring(4, 6)
      const day = ofxDate.substring(6, 8)
      return `${day}/${month}/${year}`
    }
    return ofxDate
  }

  const detectColumnType = (header: string, sampleData: any[]): string => {
    const headerLower = header.toLowerCase()
    
    // Detectar tipo baseado no cabeçalho
    if (headerLower.includes('data') || headerLower.includes('date') || headerLower.includes('dt') || 
        headerLower.includes('vencimento') || headerLower.includes('pagamento')) {
      return 'data'
    } else if (headerLower.includes('desc') || headerLower.includes('memo') || headerLower.includes('obs') ||
               headerLower.includes('descrição') || headerLower.includes('descricao')) {
      return 'descricao'
    } else if (headerLower.includes('valor') || headerLower.includes('amount') || headerLower.includes('vl')) {
      return 'valor'
    } else if (headerLower.includes('tipo') || headerLower.includes('type')) {
      return 'tipo'
    } else if (headerLower.includes('status') || headerLower.includes('situacao') || 
               headerLower.includes('situação') || headerLower.includes('pagamento')) {
      return 'status'
    } else if (headerLower.includes('conta') || headerLower.includes('account') || 
               headerLower.includes('empresa') || headerLower.includes('banco')) {
      return 'conta'
    } else if (headerLower.includes('categoria') || headerLower.includes('category')) {
      return 'categoria'
    } else if (headerLower.includes('subcategoria') || headerLower.includes('subcategory')) {
      return 'subcategoria'
    } else if (headerLower.includes('contato') || headerLower.includes('contact') || 
               headerLower.includes('cliente') || headerLower.includes('fornecedor')) {
      return 'contato'
    } else if (headerLower.includes('vencimento') || headerLower.includes('due') || 
               headerLower.includes('venc')) {
      return 'vencimento'
    } else if (headerLower.includes('parcela') || headerLower.includes('parcelamento')) {
      return 'parcelas'
    }
    
    // Tentar detectar baseado no conteúdo da primeira linha
    if (sampleData.length > 0) {
      const firstValue = sampleData[0][0]
      if (firstValue && !isNaN(Date.parse(firstValue))) {
        return 'data'
      } else if (firstValue && !isNaN(parseFloat(firstValue))) {
        return 'valor'
      }
    }
    
    return 'descricao' // Padrão
  }

  const handleMappingChange = (column: string, field: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [column]: field
    }))
  }

  const resetToDefaultMapping = () => {
    setColumnMapping(defaultMapping)
  }

  const processFullFile = async () => {
    if (!file || !fileType) return

    setIsProcessing(true)
    setMessage(null)
    setProcessedRows(0)

    try {
      let data: any[] = []

      if (fileType === 'csv' || fileType === 'txt') {
        const text = await file.text()
        const result = Papa.parse(text, {
          delimiter: delimiter,
          header: false,
          skipEmptyLines: true
        })
        data = result.data as any[]
      } else if (fileType === 'excel') {
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[]
      } else if (fileType === 'ofx') {
        const text = await file.text()
        data = processOFXFile(text)
      }

      if (data.length === 0) {
        setMessage({ type: 'error', text: 'Nenhum dado encontrado no arquivo.' })
        return
      }

      // Pular cabeçalho se existir
      const dataRows = data.length > 1 && isHeaderRow(data[0]) ? data.slice(1) : data
      
      let successCount = 0
      let errorCount = 0

      // Processar em lotes de 50
      const batchSize = 50
      for (let i = 0; i < dataRows.length; i += batchSize) {
        const batch = dataRows.slice(i, i + batchSize)
        
        for (const row of batch) {
          try {
            const transaction = convertRowToTransaction(row)
            if (transaction) {
              await supabaseService.supabase.from('transactions').insert(transaction)
              successCount++
            }
          } catch (error) {
            console.error('Erro ao processar linha:', row, error)
            errorCount++
          }
          
          setProcessedRows(prev => prev + 1)
        }
        
        // Pequena pausa entre lotes para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      setMessage({
        type: 'success',
        text: `Importação concluída! ${successCount} transações importadas com sucesso. ${errorCount} erros.`
      })

    } catch (error) {
      console.error('Erro durante importação:', error)
      setMessage({
        type: 'error',
        text: 'Erro durante a importação. Verifique o console para mais detalhes.'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const isHeaderRow = (row: any[]): boolean => {
    // Verificar se a linha parece ser um cabeçalho
    return row.some(cell => 
      typeof cell === 'string' && 
      (cell.toLowerCase().includes('data') || 
       cell.toLowerCase().includes('valor') || 
       cell.toLowerCase().includes('descricao'))
    )
  }

  const convertRowToTransaction = (row: any[]): any => {
    try {
      // Mapear colunas para campos
      const mappedData: any = {}
      Object.entries(columnMapping).forEach(([column, field]) => {
        const index = column.charCodeAt(0) - 65 // A=0, B=1, etc.
        if (row[index] !== undefined && row[index] !== null && row[index] !== '') {
          mappedData[field] = row[index]
        }
      })

      // Validar campos obrigatórios
      if (!mappedData.data && !mappedData.vencimento) {
        return null
      }
      if (!mappedData.valor) {
        return null
      }

      // Converter data - priorizar vencimento, depois data de pagamento
      let dataISO = ''
      if (mappedData.vencimento) {
        dataISO = convertDateToISO(mappedData.vencimento.toString())
      } else if (mappedData.data) {
        dataISO = convertDateToISO(mappedData.data.toString())
      }

      // Converter valor - lidar com formato brasileiro (vírgula como decimal)
      let valor = 0
      if (mappedData.valor) {
        const valorStr = mappedData.valor.toString()
          .replace(/[^\d.,-]/g, '') // Remove caracteres especiais exceto dígitos, vírgula, ponto e hífen
          .replace(/\./g, '') // Remove pontos (separadores de milhares)
          .replace(',', '.') // Converte vírgula para ponto (decimal)
        
        valor = parseFloat(valorStr)
        if (isNaN(valor)) valor = 0
      }

      // Determinar tipo baseado no valor ou campo tipo
      let tipo = 'despesa'
      if (mappedData.tipo) {
        const tipoStr = mappedData.tipo.toString().toLowerCase()
        if (tipoStr.includes('receita') || tipoStr.includes('receipt') || tipoStr.includes('credit') || 
            tipoStr.includes('r') || tipoStr.includes('recebimento')) {
          tipo = 'receita'
        } else if (tipoStr.includes('transferencia') || tipoStr.includes('transfer') || 
                   tipoStr.includes('t') || tipoStr.includes('transf')) {
          tipo = 'transferencia'
        } else if (tipoStr.includes('despesa') || tipoStr.includes('d') || tipoStr.includes('pagamento')) {
          tipo = 'despesa'
        }
      } else if (valor > 0) {
        tipo = 'receita'
      }

      // Determinar status baseado no campo situação/pagamento
      let status = 'pendente'
      if (mappedData.status) {
        const statusStr = mappedData.status.toString().toLowerCase()
        if (statusStr.includes('pago') || statusStr.includes('paid') || statusStr.includes('liquidado') ||
            statusStr.includes('pagamento')) {
          status = 'pago'
        } else if (statusStr.includes('vencido') || statusStr.includes('overdue') || 
                   statusStr.includes('venc') || statusStr.includes('vencido')) {
          status = 'vencido'
        } else if (statusStr.includes('pendente') || statusStr.includes('pending')) {
          status = 'pendente'
        }
      }

      // Determinar conta padrão se não especificada
      let conta = mappedData.conta || 'Conta Principal'
      
      // Se o campo conta estiver vazio mas empresa estiver preenchido, usar empresa
      if (!conta || conta === 'Conta Principal') {
        if (mappedData.empresa) {
          conta = mappedData.empresa
        }
      }

      // Determinar categoria padrão
      let categoria = mappedData.categoria || 'Geral'
      if (!categoria || categoria === 'Geral') {
        // Tentar inferir categoria baseado na descrição
        const descricao = mappedData.descricao || ''
        if (descricao.toLowerCase().includes('energia') || descricao.toLowerCase().includes('água') || 
            descricao.toLowerCase().includes('agua')) {
          categoria = 'Serviços Públicos'
        } else if (descricao.toLowerCase().includes('aluguel') || descricao.toLowerCase().includes('rent')) {
          categoria = 'Moradia'
        } else if (descricao.toLowerCase().includes('honorários') || descricao.toLowerCase().includes('honorarios')) {
          categoria = 'Serviços Profissionais'
        } else if (descricao.toLowerCase().includes('funcionários') || descricao.toLowerCase().includes('funcionarios')) {
          categoria = 'Recursos Humanos'
        } else if (descricao.toLowerCase().includes('dar') || descricao.toLowerCase().includes('imposto')) {
          categoria = 'Impostos'
        }
      }

      // Determinar subcategoria
      let subcategoria = mappedData.subcategoria || ''
      if (!subcategoria) {
        // Tentar inferir subcategoria baseado na descrição
        const descricao = mappedData.descricao || ''
        if (descricao.toLowerCase().includes('energia')) {
          subcategoria = 'Energia Elétrica'
        } else if (descricao.toLowerCase().includes('água') || descricao.toLowerCase().includes('agua')) {
          subcategoria = 'Água e Esgoto'
        } else if (descricao.toLowerCase().includes('aluguel')) {
          subcategoria = 'Aluguel'
        }
      }

      // Determinar contato
      let contato = mappedData.contato || ''
      if (!contato) {
        // Tentar inferir contato baseado na empresa
        if (mappedData.empresa) {
          contato = mappedData.empresa
        }
      }

      // Determinar vencimento
      let vencimento = dataISO
      if (mappedData.vencimento) {
        vencimento = convertDateToISO(mappedData.vencimento.toString())
      } else if (mappedData.data) {
        vencimento = convertDateToISO(mappedData.data.toString())
      }

      return {
        data: dataISO,
        descricao: mappedData.descricao || 'Importação automática',
        valor: tipo === 'despesa' ? -Math.abs(valor) : Math.abs(valor),
        tipo: tipo,
        status: status,
        conta: conta,
        categoria: categoria,
        subcategoria: subcategoria,
        contato: contato,
        vencimento: vencimento,
        parcelas: mappedData.parcelas || '',
        created_at: new Date().toISOString()
      }
    } catch (error) {
      console.error('Erro ao converter linha:', row, error)
      return null
    }
  }

  const convertDateToISO = (dateStr: string): string => {
    try {
      // Limpar a string de data
      const cleanDateStr = dateStr.trim()
      if (!cleanDateStr || cleanDateStr === '') {
        return new Date().toISOString().split('T')[0]
      }

      // Tentar diferentes formatos de data brasileiros
      const formats = [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY
        /(\d{1,2})-(\d{1,2})-(\d{4})/,   // DD-MM-YYYY
        /(\d{1,2})\.(\d{1,2})\.(\d{4})/, // DD.MM.YYYY
        /(\d{4})-(\d{1,2})-(\d{1,2})/,   // YYYY-MM-DD
        /(\d{1,2})\/(\d{1,2})\/(\d{2})/, // DD/MM/YY (assumir 20XX)
      ]

      for (const format of formats) {
        const match = cleanDateStr.match(format)
        if (match) {
          if (match[1].length === 4) {
            // Formato YYYY-MM-DD
            return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
          } else {
            // Formato DD/MM/YYYY ou DD/MM/YY
            let year = match[3]
            if (year.length === 2) {
              year = '20' + year // Assumir século 21
            }
            return `${year}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
          }
        }
      }

      // Se nenhum formato funcionar, tentar parse direto
      const parsed = new Date(cleanDateStr)
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0]
      }

      // Se ainda não funcionar, tentar parse com Date.parse
      const timestamp = Date.parse(cleanDateStr)
      if (!isNaN(timestamp)) {
        return new Date(timestamp).toISOString().split('T')[0]
      }

      console.warn(`Não foi possível converter a data: "${dateStr}"`)
      return new Date().toISOString().split('T')[0]
    } catch (error) {
      console.error('Erro ao converter data:', dateStr, error)
      return new Date().toISOString().split('T')[0]
    }
  }

  const clearImport = () => {
    setFile(null)
    setFileType('')
    setDelimiter(',')
    setColumnMapping({})
    setPreviewData([])
    setMessage(null)
    setTotalRows(0)
    setProcessedRows(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const downloadTemplate = () => {
    const csvContent = 'Data,Descrição,Valor,Tipo,Status,Conta,Categoria,Subcategoria,Contato,Vencimento\n01/01/2024,Exemplo Receita,100.00,receita,pago,Conta Principal,Receitas,Salário,Cliente A,01/01/2024\n15/01/2024,Exemplo Despesa,-50.00,despesa,pago,Conta Principal,Despesas,Alimentação,Fornecedor B,15/01/2024'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'template_importacao.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getSupportedFormats = () => {
    return [
      { extension: '.csv', description: 'CSV (vírgula, ponto e vírgula, tab)' },
      { extension: '.xlsx', description: 'Excel (.xlsx)' },
      { extension: '.xls', description: 'Excel (.xls)' },
      { extension: '.txt', description: 'Texto (.txt)' },
      { extension: '.ofx', description: 'OFX (internet banking)' }
    ]
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Importação de Dados</h2>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={20} />
            Baixar Template
          </button>
        </div>

        {/* Formatos Suportados */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Formatos Suportados:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {getSupportedFormats().map((format, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-blue-700">
                <FileText size={16} />
                <span className="font-mono">{format.extension}</span>
                <span className="text-blue-600">-</span>
                <span>{format.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upload de Arquivo */}
        <div className="mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.txt,.ofx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="space-y-4">
              <Upload size={48} className="mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-700">
                  Clique para selecionar um arquivo ou arraste aqui
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Suporta CSV, Excel, TXT e OFX
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Selecionar Arquivo
              </button>
            </div>
          </div>
        </div>

        {/* Configurações de Arquivo */}
        {file && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Configurações do Arquivo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Arquivo
                </label>
                <p className="text-sm text-gray-600">{file.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Arquivo
                </label>
                <p className="text-sm text-gray-600 capitalize">{fileType}</p>
              </div>
              {(fileType === 'csv' || fileType === 'txt') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delimitador
                  </label>
                  <select
                    value={delimiter}
                    onChange={(e) => {
                      setDelimiter(e.target.value)
                      if (file) {
                        processFileForPreview(file, fileType, e.target.value)
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value=",">Vírgula (,)</option>
                    <option value=";">Ponto e vírgula (;)</option>
                    <option value="\t">Tabulação (Tab)</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total de Linhas
                </label>
                <p className="text-sm text-gray-600">{totalRows}</p>
              </div>
            </div>
          </div>
        )}

        {/* Mensagens */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' :
            message.type === 'error' ? 'bg-red-50 text-red-800' :
            'bg-blue-50 text-blue-800'
          }`}>
            {message.type === 'success' ? <CheckCircle size={20} /> :
             message.type === 'error' ? <AlertCircle size={20} /> :
             <FileText size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Mapeamento de Colunas */}
        {previewData.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Mapeamento de Colunas</h3>
              <button
                onClick={resetToDefaultMapping}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Resetar Mapeamento
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(columnMapping).map((column) => (
                <div key={column} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Coluna {column}
                  </label>
                  <select
                    value={columnMapping[column] || ''}
                    onChange={(e) => handleMappingChange(column, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Selecionar Campo --</option>
                    <option value="data">Data</option>
                    <option value="descricao">Descrição</option>
                    <option value="valor">Valor</option>
                    <option value="tipo">Tipo</option>
                    <option value="status">Status</option>
                    <option value="conta">Conta</option>
                    <option value="categoria">Categoria</option>
                    <option value="subcategoria">Subcategoria</option>
                    <option value="contato">Contato</option>
                    <option value="vencimento">Vencimento</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview dos Dados */}
        {previewData.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Preview dos Dados (Primeiras 5 linhas)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(columnMapping).map((column) => (
                      <th key={column} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        {column} → {columnMapping[column] || 'Não mapeado'}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {previewData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      {Object.keys(columnMapping).map((column) => (
                        <td key={column} className="px-4 py-3 text-sm text-gray-900 border-b">
                          {row[column] || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        {file && (
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={processFullFile}
              disabled={isProcessing || previewData.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processando... ({processedRows}/{totalRows})
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Importar Dados
                </>
              )}
            </button>
            
            <button
              onClick={clearImport}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <X size={20} className="inline mr-2" />
              Limpar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default DataImport
