import axios from 'axios'

// Importando configurações do config.js
const GOOGLE_SHEETS_API_KEY = 'AIzaSyBL8UXVkErRmaKbNaLTqJnr05_qAL2aR5Q'
const SPREADSHEETS_ID = '18QjPfOiWnkdn-OgdySJ9uugX8nAor7wDbBsPkneVrSE'

export interface SheetData {
  id: string
  vencimento: string
  descricao: string
  empresa: string
  tipo: string
  valor: number
  parcela: string
  situacao: string
  dataPagamento: string
  status: 'pago' | 'pendente' | 'vencido'
}

export interface NewTransaction {
  descricao: string
  empresa: string
  tipo: string
  valor: number
  vencimento: string
  parcelas: number
  status?: string
}

export class GoogleSheetsService {
  private static instance: GoogleSheetsService
  private baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets'

  private constructor() {}

  public static getInstance(): GoogleSheetsService {
    if (!GoogleSheetsService.instance) {
      GoogleSheetsService.instance = new GoogleSheetsService()
    }
    return GoogleSheetsService.instance
  }

  async getSheetData(sheetName: string = 'GERAL', range: string = 'A:Z'): Promise<SheetData[]> {
    try {
      console.log('🔍 Conectando com Google Sheets...')
      console.log('📊 Spreadsheet ID:', SPREADSHEETS_ID)
      console.log('📋 Aba:', sheetName)
      console.log('📏 Range:', range)
      
      const response = await axios.get(`${this.baseUrl}/${SPREADSHEETS_ID}/values/${sheetName}!${range}`, {
        params: {
          key: GOOGLE_SHEETS_API_KEY,
          majorDimension: 'ROWS',
          // Adiciona timestamp para evitar cache
          _t: Date.now()
        },
        timeout: 10000 // 10 segundos de timeout
      })

      const rows = response.data.values || []
      console.log('📋 Dados recebidos:', rows.length, 'linhas')
      console.log('📊 Resposta completa:', response.data)
      
      if (rows.length === 0) {
        console.error('❌ Planilha vazia ou sem dados')
        throw new Error('Planilha vazia ou sem dados. Verifique se a planilha contém dados.')
      }

      const headers = rows[0] || []
      const dataRows = rows.slice(1)
      
      console.log('📝 Cabeçalhos encontrados:', headers)
      console.log('📊 Dados encontrados:', dataRows.length, 'registros')

      // Mapeia as colunas específicas da sua planilha com mais flexibilidade
      const vencimentoIndex = headers.findIndex((h: string) => 
        h.toLowerCase().includes('vencimento') || 
        h.toLowerCase().includes('data vencimento')
      )
      
      const descricaoIndex = headers.findIndex((h: string) => 
        h.toLowerCase().includes('descrição') || 
        h.toLowerCase().includes('descricao') ||
        h.toLowerCase().includes('desc')
      )
      
      const empresaIndex = headers.findIndex((h: string) => 
        h.toLowerCase().includes('empresa') ||
        h.toLowerCase().includes('fornecedor') ||
        h.toLowerCase().includes('cliente')
      )
      
      const tipoIndex = headers.findIndex((h: string) => 
        h.toLowerCase().includes('tipo') ||
        h.toLowerCase().includes('categoria')
      )
      
      const valorIndex = headers.findIndex((h: string) => 
        h.toLowerCase().includes('valor') ||
        h.toLowerCase().includes('amount')
      )
      
      const parcelaIndex = headers.findIndex((h: string) => 
        h.toLowerCase().includes('parcela') ||
        h.toLowerCase().includes('installment')
      )
      
      const situacaoIndex = headers.findIndex((h: string) => 
        h.toLowerCase().includes('situação') || 
        h.toLowerCase().includes('situacao') ||
        h.toLowerCase().includes('status')
      )
      
      const dataPagamentoIndex = headers.findIndex((h: string) => 
        h.toLowerCase().includes('data pagamento') || 
        h.toLowerCase().includes('data de pagamento') ||
        h.toLowerCase().includes('pagamento')
      )

      console.log('🔍 Índices mapeados:', {
        vencimento: vencimentoIndex,
        descricao: descricaoIndex,
        empresa: empresaIndex,
        tipo: tipoIndex,
        valor: valorIndex,
        parcela: parcelaIndex,
        situacao: situacaoIndex,
        dataPagamento: dataPagamentoIndex
      })

      // Valida se encontrou pelo menos as colunas essenciais
      if (vencimentoIndex === -1 || descricaoIndex === -1 || valorIndex === -1) {
        console.error('❌ Colunas essenciais não encontradas na planilha')
        console.error('❌ Colunas necessárias: Vencimento, Descrição, Valor')
        console.error('❌ Cabeçalhos encontrados:', headers)
        throw new Error('Estrutura da planilha inválida. Verifique se as colunas Vencimento, Descrição e Valor estão presentes.')
      }

      const processedData = dataRows
        .filter((row: any[]) => {
          // Filtra linhas vazias ou sem dados essenciais
          return row && row.length > 0 && 
                 (row[vencimentoIndex] || row[descricaoIndex] || row[valorIndex])
        })
        .map((row: any[], index: number) => {
          // Processa o valor removendo formatação brasileira
          let valor = 0
          if (row[valorIndex]) {
            const valorStr = row[valorIndex].toString()
            // Remove pontos de milhares e substitui vírgula por ponto
            valor = parseFloat(valorStr.replace(/\./g, '').replace(',', '.')) || 0
          }
          
          const situacao = row[situacaoIndex] || ''
          const dataPagamento = row[dataPagamentoIndex] || ''
          
          // Determina o status baseado na situação e data de pagamento
          let status: 'pago' | 'pendente' | 'vencido' = 'pendente'
          if (situacao.toLowerCase().includes('pago') || dataPagamento) {
            status = 'pago'
          } else if (row[vencimentoIndex]) {
            try {
              const vencimento = new Date(row[vencimentoIndex].split('/').reverse().join('-'))
              const hoje = new Date()
              if (vencimento < hoje) {
                status = 'vencido'
              }
            } catch (error) {
              console.warn('⚠️ Erro ao processar data de vencimento:', row[vencimentoIndex])
            }
          }

          return {
            id: (index + 1).toString(),
            vencimento: row[vencimentoIndex] || '',
            descricao: row[descricaoIndex] || '',
            empresa: row[empresaIndex] || '',
            tipo: row[tipoIndex] || '',
            valor: valor,
            parcela: row[parcelaIndex] || '',
            situacao: situacao,
            dataPagamento: dataPagamento,
            status: status
          }
        })

      // Valida se processou dados válidos
      if (processedData.length === 0) {
        console.error('❌ Nenhum dado válido encontrado após processamento')
        throw new Error('Nenhum dado válido encontrado na planilha. Verifique se há dados nas colunas corretas.')
      }

      console.log('✅ Dados processados com sucesso:', processedData.length, 'registros')
      return processedData

    } catch (error: any) {
      console.error('❌ Erro ao buscar dados do Google Sheets:', error)
      console.error('❌ Detalhes do erro:', error.response?.data || error.message)
      console.error('❌ Status do erro:', error.response?.status)
      
      // Não retorna dados simulados, apenas re-lança o erro
      throw error
    }
  }

  async saveTransaction(transaction: NewTransaction): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('💾 Salvando nova transação na planilha...')
      console.log('📊 Dados da transação:', transaction)

      // Preparar dados para a planilha
      const values = [
        [
          transaction.vencimento,
          transaction.descricao,
          transaction.empresa,
          transaction.tipo,
          transaction.valor.toString(),
          '1', // parcela
          '', // situação
          '' // data pagamento
        ]
      ]

      // Se há múltiplas parcelas, criar uma transação para cada parcela
      if (transaction.parcelas > 1) {
        for (let i = 2; i <= transaction.parcelas; i++) {
          const proximaData = this.calcularProximaData(transaction.vencimento, i - 1)
          values.push([
            proximaData,
            transaction.descricao,
            transaction.empresa,
            transaction.tipo,
            transaction.valor.toString(),
            `${i}/${transaction.parcelas}`,
            '', // situação
            '' // data pagamento
          ])
        }
      }

      console.log('📋 Valores para salvar:', values)

      // Usar a API do Google Sheets para adicionar dados
      const response = await axios.post(`${this.baseUrl}/${SPREADSHEETS_ID}/values/GERAL!A:H:append`, {
        values: values
      }, {
        params: {
          key: GOOGLE_SHEETS_API_KEY,
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS'
        },
        timeout: 15000
      })

      console.log('✅ Transação salva com sucesso:', response.data)

      return {
        success: true,
        message: `${values.length} transação(ões) salva(s) com sucesso na planilha!`,
        data: response.data
      }

    } catch (error: any) {
      console.error('❌ Erro ao salvar transação:', error)
      console.error('❌ Detalhes do erro:', error.response?.data || error.message)
      
      let errorMessage = 'Erro desconhecido ao salvar transação'
      if (error.response?.status === 403) {
        errorMessage = 'Acesso negado. A planilha precisa ter permissões de escrita.'
      } else if (error.response?.status === 400) {
        errorMessage = 'Dados inválidos. Verifique o formato dos dados.'
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Timeout na conexão. Verifique sua internet.'
      }

      return {
        success: false,
        message: errorMessage
      }
    }
  }

  // Função para calcular próxima data baseada na data inicial
  private calcularProximaData(dataInicial: string, mesesAdicionais: number): string {
    try {
      const [dia, mes, ano] = dataInicial.split('/')
      const data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
      data.setMonth(data.getMonth() + mesesAdicionais)
      return data.toLocaleDateString('pt-BR')
    } catch (error) {
      console.error('Erro ao calcular próxima data:', error)
      return dataInicial
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('🧪 Testando conexão com Google Sheets...')
      
      const response = await axios.get(`${this.baseUrl}/${SPREADSHEETS_ID}`, {
        params: {
          key: GOOGLE_SHEETS_API_KEY,
          includeGridData: false
        },
        timeout: 10000
      })
      
      console.log('✅ Conexão bem-sucedida!')
      console.log('📊 Informações da planilha:', response.data.properties)
      
      return {
        success: true,
        message: 'Conexão estabelecida com sucesso!',
        data: response.data.properties
      }
    } catch (error: any) {
      console.error('❌ Erro na conexão:', error.response?.data || error.message)
      
      let errorMessage = 'Erro desconhecido'
      if (error.response?.status === 403) {
        errorMessage = 'Acesso negado. Verifique se a planilha está pública ou se a API key tem permissões.'
      } else if (error.response?.status === 404) {
        errorMessage = 'Planilha não encontrada. Verifique o Spreadsheet ID.'
      } else if (error.response?.status === 400) {
        errorMessage = 'API Key inválida ou sem permissões.'
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Timeout na conexão. Verifique sua internet.'
      }
      
      return {
        success: false,
        message: errorMessage
      }
    }
  }

  async updateSheetData(data: SheetData[]): Promise<boolean> {
    try {
      const values = data.map(item => [
        item.vencimento, 
        item.descricao, 
        item.empresa, 
        item.tipo, 
        item.valor, 
        item.parcela, 
        item.situacao, 
        item.dataPagamento
      ])
      
      await axios.put(`${this.baseUrl}/${SPREADSHEETS_ID}/values/GERAL!A:H`, {
        values: [['VENCIMENTO', 'DESCRIÇÃO', 'EMPRESA', 'TIPO', 'VALOR', 'PARCELA', 'SITUAÇÃO', 'DATA PAGAMENTO'], ...values]
      }, {
        params: {
          key: GOOGLE_SHEETS_API_KEY,
          valueInputOption: 'RAW'
        }
      })

      return true
    } catch (error) {
      console.error('Erro ao atualizar dados do Google Sheets:', error)
      return false
    }
  }
}

export default GoogleSheetsService.getInstance() 