import { SheetData, NewTransaction } from './googleSheets'

export interface LocalStorageService {
  getData(): Promise<SheetData[]>
  saveTransaction(transaction: NewTransaction): Promise<{ success: boolean; message: string }>
  updateTransaction(id: string, data: Partial<SheetData>): Promise<{ success: boolean; message: string }>
  deleteTransaction(id: string): Promise<{ success: boolean; message: string }>
  exportData(): Promise<string>
  importData(jsonData: string): Promise<{ success: boolean; message: string }>
}

class LocalStorageServiceImpl implements LocalStorageService {
  private readonly STORAGE_KEY = 'dashboard_transactions'
  private readonly BACKUP_KEY = 'dashboard_backup'

  async getData(): Promise<SheetData[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) {
        // Dados iniciais de exemplo
        const initialData: SheetData[] = [
          {
            id: '1',
            vencimento: '15/07/2025',
            descricao: 'ALUGUEL CENTRO',
            empresa: 'JOSE GOMES DE SIQUEIRA',
            tipo: 'Despesa',
            valor: 3500,
            parcela: '1',
            situacao: '1 pago',
            dataPagamento: '15/07/2025',
            status: 'pago'
          },
          {
            id: '2',
            vencimento: '20/07/2025',
            descricao: 'CONTA DE LUZ',
            empresa: 'ENEL',
            tipo: 'Despesa',
            valor: 250,
            parcela: '1',
            situacao: '',
            dataPagamento: '',
            status: 'pendente'
          }
        ]
        this.saveToStorage(initialData)
        return initialData
      }

      const data = JSON.parse(stored) as SheetData[]
      return data.map(item => ({
        ...item,
        valor: typeof item.valor === 'string' ? parseFloat(item.valor) : item.valor
      }))
    } catch (error) {
      console.error('Erro ao carregar dados locais:', error)
      return []
    }
  }

  async saveTransaction(transaction: NewTransaction): Promise<{ success: boolean; message: string }> {
    try {
      const currentData = await this.getData()
      const newId = (currentData.length + 1).toString()
      
      // Criar transação principal
      const newTransaction: SheetData = {
        id: newId,
        vencimento: transaction.vencimento,
        descricao: transaction.descricao,
        empresa: transaction.empresa,
        tipo: transaction.tipo,
        valor: transaction.valor,
        parcela: '1',
        situacao: '',
        dataPagamento: '',
        status: this.calculateStatus(transaction.vencimento)
      }

      const updatedData = [...currentData, newTransaction]

      // Se há múltiplas parcelas, criar transações adicionais
      if (transaction.parcelas > 1) {
        for (let i = 2; i <= transaction.parcelas; i++) {
          const nextDate = this.calculateNextDate(transaction.vencimento, i - 1)
          const parcelTransaction: SheetData = {
            id: (currentData.length + i).toString(),
            vencimento: nextDate,
            descricao: transaction.descricao,
            empresa: transaction.empresa,
            tipo: transaction.tipo,
            valor: transaction.valor,
            parcela: `${i}/${transaction.parcelas}`,
            situacao: '',
            dataPagamento: '',
            status: this.calculateStatus(nextDate)
          }
          updatedData.push(parcelTransaction)
        }
      }

      this.saveToStorage(updatedData)
      this.createBackup(updatedData)

      return {
        success: true,
        message: `${transaction.parcelas} transação(ões) salva(s) com sucesso!`
      }
    } catch (error) {
      console.error('Erro ao salvar transação:', error)
      return {
        success: false,
        message: 'Erro ao salvar transação. Tente novamente.'
      }
    }
  }

  async updateTransaction(id: string, data: Partial<SheetData>): Promise<{ success: boolean; message: string }> {
    try {
      const currentData = await this.getData()
      const index = currentData.findIndex(item => item.id === id)
      
      if (index === -1) {
        return {
          success: false,
          message: 'Transação não encontrada.'
        }
      }

      currentData[index] = { ...currentData[index], ...data }
      this.saveToStorage(currentData)
      this.createBackup(currentData)

      return {
        success: true,
        message: 'Transação atualizada com sucesso!'
      }
    } catch (error) {
      console.error('Erro ao atualizar transação:', error)
      return {
        success: false,
        message: 'Erro ao atualizar transação.'
      }
    }
  }

  async deleteTransaction(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const currentData = await this.getData()
      const filteredData = currentData.filter(item => item.id !== id)
      
      this.saveToStorage(filteredData)
      this.createBackup(filteredData)

      return {
        success: true,
        message: 'Transação excluída com sucesso!'
      }
    } catch (error) {
      console.error('Erro ao excluir transação:', error)
      return {
        success: false,
        message: 'Erro ao excluir transação.'
      }
    }
  }

  async exportData(): Promise<string> {
    try {
      const data = await this.getData()
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: data
      }
      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      console.error('Erro ao exportar dados:', error)
      throw new Error('Erro ao exportar dados')
    }
  }

  async importData(jsonData: string): Promise<{ success: boolean; message: string }> {
    try {
      const parsed = JSON.parse(jsonData)
      if (!parsed.data || !Array.isArray(parsed.data)) {
        return {
          success: false,
          message: 'Formato de arquivo inválido.'
        }
      }

      this.saveToStorage(parsed.data)
      this.createBackup(parsed.data)

      return {
        success: true,
        message: `${parsed.data.length} transações importadas com sucesso!`
      }
    } catch (error) {
      console.error('Erro ao importar dados:', error)
      return {
        success: false,
        message: 'Erro ao importar dados. Verifique o formato do arquivo.'
      }
    }
  }

  private saveToStorage(data: SheetData[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
  }

  private createBackup(data: SheetData[]): void {
    const backup = {
      timestamp: new Date().toISOString(),
      data: data
    }
    localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup))
  }

  private calculateStatus(vencimento: string): 'pago' | 'pendente' | 'vencido' {
    try {
      const [dia, mes, ano] = vencimento.split('/')
      const dataVencimento = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
      const hoje = new Date()
      
      if (dataVencimento < hoje) {
        return 'vencido'
      } else if (dataVencimento.toDateString() === hoje.toDateString()) {
        return 'pendente'
      } else {
        return 'pendente'
      }
    } catch (error) {
      return 'pendente'
    }
  }

  private calculateNextDate(dataInicial: string, mesesAdicionais: number): string {
    try {
      const [dia, mes, ano] = dataInicial.split('/')
      const data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
      data.setMonth(data.getMonth() + mesesAdicionais)
      return data.toLocaleDateString('pt-BR')
    } catch (error) {
      return dataInicial
    }
  }
}

export const localStorageService = new LocalStorageServiceImpl() 