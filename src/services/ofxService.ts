import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface OFXTransaction {
  id: string;
  fitId: string; // ID único da transação no banco
  datePosted: string;
  dateUser: string;
  amount: number;
  memo: string;
  type: string;
  checkNum?: string;
  refNum?: string;
  sic?: string;
  payeeId?: string;
  name?: string;
  bankId?: string;
  accountId?: string;
}

export interface OFXAccount {
  bankId: string;
  accountId: string;
  accountType: string;
  accountKey?: string;
}

export interface OFXBalance {
  balanceAmount: number;
  dateAsOf: string;
}

export interface OFXData {
  account: OFXAccount;
  balance: OFXBalance;
  transactions: OFXTransaction[];
  startDate: string;
  endDate: string;
}

export interface ImportResult {
  success: boolean;
  message: string;
  importedCount: number;
  updatedCount?: number;
  skippedCount?: number;
  errorCount: number;
  errors: string[];
  data?: OFXData;
}

export class OFXService {
  
  // Parsear arquivo OFX
  async parseOFXFile(file: File): Promise<OFXData> {
    try {
      console.log('📁 Iniciando parse do arquivo OFX:', file.name);
      
      const text = await file.text();
      console.log('📄 Conteúdo do arquivo carregado, tamanho:', text.length);
      
      // Remover quebras de linha e espaços extras
      const cleanText = text.replace(/\r?\n/g, '').replace(/>\s+</g, '><');
      
      // Extrair dados usando regex (método simples)
      const account = this.extractAccount(cleanText);
      const balance = this.extractBalance(cleanText);
      const transactions = this.extractTransactions(cleanText);
      const dateRange = this.extractDateRange(cleanText);
      
      const ofxData: OFXData = {
        account,
        balance,
        transactions,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };
      
      console.log('✅ Parse OFX concluído:', {
        account: ofxData.account,
        balance: ofxData.balance,
        transactionsCount: ofxData.transactions.length,
        dateRange: `${ofxData.startDate} - ${ofxData.endDate}`
      });
      
      return ofxData;
      
    } catch (error) {
      console.error('❌ Erro ao parsear arquivo OFX:', error);
      throw new Error(`Erro ao processar arquivo OFX: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
  
  // Extrair informações da conta
  private extractAccount(ofxText: string): OFXAccount {
    const bankIdMatch = ofxText.match(/<BANKID>([^<]+)<\/BANKID>/);
    const accountIdMatch = ofxText.match(/<ACCTID>([^<]+)<\/ACCTID>/);
    const accountTypeMatch = ofxText.match(/<ACCTTYPE>([^<]+)<\/ACCTTYPE>/);
    
    return {
      bankId: bankIdMatch?.[1] || '',
      accountId: accountIdMatch?.[1] || '',
      accountType: accountTypeMatch?.[1] || 'CHECKING'
    };
  }
  
  // Extrair saldo
  private extractBalance(ofxText: string): OFXBalance {
    const balanceMatch = ofxText.match(/<BALAMT>([^<]+)<\/BALAMT>/);
    const dateMatch = ofxText.match(/<DTASOF>([^<]+)<\/DTASOF>/);
    
    return {
      balanceAmount: parseFloat(balanceMatch?.[1] || '0'),
      dateAsOf: this.parseOFXDate(dateMatch?.[1] || '')
    };
  }
  
  // Extrair transações
  private extractTransactions(ofxText: string): OFXTransaction[] {
    const transactions: OFXTransaction[] = [];
    
    // Encontrar todas as transações
    const transactionMatches = ofxText.match(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/g);
    
    if (!transactionMatches) {
      console.log('ℹ️ Nenhuma transação encontrada no arquivo OFX');
      return transactions;
    }
    
    console.log(`📊 Encontradas ${transactionMatches.length} transações no arquivo`);
    
    transactionMatches.forEach((transactionText, index) => {
      try {
        const transaction = this.parseTransaction(transactionText);
        if (transaction) {
          transactions.push(transaction);
        }
      } catch (error) {
        console.error(`❌ Erro ao parsear transação ${index + 1}:`, error);
      }
    });
    
    return transactions;
  }
  
  // Parsear uma transação individual
  private parseTransaction(transactionText: string): OFXTransaction | null {
    const fitIdMatch = transactionText.match(/<FITID>([^<]+)<\/FITID>/);
    const datePostedMatch = transactionText.match(/<DTPOSTED>([^<]+)<\/DTPOSTED>/);
    const dateUserMatch = transactionText.match(/<DTUSER>([^<]+)<\/DTUSER>/);
    const amountMatch = transactionText.match(/<TRNAMT>([^<]+)<\/TRNAMT>/);
    const memoMatch = transactionText.match(/<MEMO>([^<]+)<\/MEMO>/);
    const typeMatch = transactionText.match(/<TRNTYPE>([^<]+)<\/TRNTYPE>/);
    const checkNumMatch = transactionText.match(/<CHECKNUM>([^<]+)<\/CHECKNUM>/);
    const refNumMatch = transactionText.match(/<REFNUM>([^<]+)<\/REFNUM>/);
    const sicMatch = transactionText.match(/<SIC>([^<]+)<\/SIC>/);
    const payeeIdMatch = transactionText.match(/<PAYEEID>([^<]+)<\/PAYEEID>/);
    const nameMatch = transactionText.match(/<NAME>([^<]+)<\/NAME>/);
    
    if (!fitIdMatch || !datePostedMatch || !amountMatch) {
      console.warn('⚠️ Transação sem dados obrigatórios (FITID, DTPOSTED, TRNAMT)');
      return null;
    }
    
    return {
      id: crypto.randomUUID(),
      fitId: fitIdMatch[1],
      datePosted: this.parseOFXDate(datePostedMatch[1]),
      dateUser: dateUserMatch ? this.parseOFXDate(dateUserMatch[1]) : '',
      amount: parseFloat(amountMatch[1]),
      memo: memoMatch?.[1] || '',
      type: typeMatch?.[1] || 'OTHER',
      checkNum: checkNumMatch?.[1],
      refNum: refNumMatch?.[1],
      sic: sicMatch?.[1],
      payeeId: payeeIdMatch?.[1],
      name: nameMatch?.[1]
    };
  }
  
  // Extrair período das transações
  private extractDateRange(ofxText: string): { startDate: string; endDate: string } {
    const dtStartMatch = ofxText.match(/<DTSTART>([^<]+)<\/DTSTART>/);
    const dtEndMatch = ofxText.match(/<DTEND>([^<]+)<\/DTEND>/);
    
    return {
      startDate: dtStartMatch ? this.parseOFXDate(dtStartMatch[1]) : '',
      endDate: dtEndMatch ? this.parseOFXDate(dtEndMatch[1]) : ''
    };
  }
  
  // Converter data OFX (YYYYMMDDHHMMSS) para formato brasileiro
  private parseOFXDate(ofxDate: string): string {
    if (!ofxDate || ofxDate.length < 8) return '';
    
    try {
      const year = ofxDate.substring(0, 4);
      const month = ofxDate.substring(4, 6);
      const day = ofxDate.substring(6, 8);
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('❌ Erro ao converter data OFX:', ofxDate, error);
      return '';
    }
  }
  
  // Verificar se uma transação já existe no sistema
  private async checkExistingTransaction(
    transaction: OFXTransaction, 
    contaBancariaId: string
  ): Promise<{ exists: boolean; similarTransactions: any[]; exactMatch: any | null }> {
    try {
      const valor = Math.abs(transaction.amount);
      const dataTransacao = transaction.datePosted;
      const descricao = transaction.memo || transaction.name || '';
      
      // Buscar transações existentes com critérios de similaridade
      const { data: existingTransactions, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`valor.eq.${valor},valor.eq.${valor + 0.01},valor.eq.${valor - 0.01}`)
        .gte('data', this.subtractDays(dataTransacao, 3))
        .lte('data', this.addDays(dataTransacao, 3));
      
      if (error) {
        console.error('❌ Erro ao buscar transações existentes:', error);
        return { exists: false, similarTransactions: [], exactMatch: null };
      }
      
      if (!existingTransactions || existingTransactions.length === 0) {
        return { exists: false, similarTransactions: [], exactMatch: null };
      }
      
      // Filtrar transações similares com critérios mais específicos
      const similarTransactions = existingTransactions.filter(existing => {
        // Verificar se é a mesma transação (mesmo valor, data e descrição similar)
        const valorSimilar = Math.abs(existing.valor - valor) < 0.02; // Tolerância de R$ 0,02
        const dataSimilar = this.isDateSimilar(existing.data, dataTransacao);
        const descricaoSimilar = this.isDescriptionSimilar(existing.descricao, descricao);
        
        return valorSimilar && dataSimilar && descricaoSimilar;
      });
      
      // Verificar se há correspondência exata
      const exactMatch = similarTransactions.find(existing => 
        existing.valor === valor && 
        existing.data === dataTransacao &&
        existing.descricao.toLowerCase() === descricao.toLowerCase()
      );
      
      return {
        exists: similarTransactions.length > 0,
        similarTransactions,
        exactMatch
      };
      
    } catch (error) {
      console.error('❌ Erro ao verificar transação existente:', error);
      return { exists: false, similarTransactions: [], exactMatch: null };
    }
  }
  
  // Verificar se duas datas são similares (dentro de 1 dia)
  private isDateSimilar(date1: string, date2: string): boolean {
    try {
      const d1 = new Date(date1.split('/').reverse().join('-'));
      const d2 = new Date(date2.split('/').reverse().join('-'));
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 1;
    } catch (error) {
      return false;
    }
  }
  
  // Verificar se duas descrições são similares
  private isDescriptionSimilar(desc1: string, desc2: string): boolean {
    if (!desc1 || !desc2) return false;
    
    const clean1 = desc1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const clean2 = desc2.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Se uma descrição contém a outra (ou vice-versa)
    if (clean1.includes(clean2) || clean2.includes(clean1)) {
      return true;
    }
    
    // Calcular similaridade usando distância de Levenshtein simplificada
    const similarity = this.calculateSimilarity(clean1, clean2);
    return similarity > 0.7; // 70% de similaridade
  }
  
  // Calcular similaridade entre duas strings
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }
  
  // Distância de Levenshtein
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  // Adicionar dias a uma data
  private addDays(dateStr: string, days: number): string {
    try {
      const date = new Date(dateStr.split('/').reverse().join('-'));
      date.setDate(date.getDate() + days);
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      return dateStr;
    }
  }
  
  // Subtrair dias de uma data
  private subtractDays(dateStr: string, days: number): string {
    return this.addDays(dateStr, -days);
  }
  
  // Atualizar banco de uma transação existente
  private async updateTransactionBank(transactionId: string, newContaBancariaId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          conta: newContaBancariaId,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId);
      
      if (error) {
        console.error('❌ Erro ao atualizar banco da transação:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar banco da transação:', error);
      return false;
    }
  }
  
  // Importar transações OFX para o sistema com conciliação
  async importOFXTransactions(ofxData: OFXData, contaBancariaId: string): Promise<ImportResult> {
    try {
      console.log('📥 Iniciando importação de transações OFX com conciliação...');
      console.log('📊 Dados para importar:', {
        contaId: contaBancariaId,
        transactionsCount: ofxData.transactions.length,
        account: ofxData.account
      });
      
      const result: ImportResult = {
        success: false,
        message: '',
        importedCount: 0,
        errorCount: 0,
        errors: []
      };
      
      if (ofxData.transactions.length === 0) {
        result.message = 'Nenhuma transação encontrada no arquivo OFX';
        result.success = true;
        return result;
      }
      
      let importedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];
      
      // Processar cada transação individualmente
      for (const transaction of ofxData.transactions) {
        try {
          console.log(`🔍 Processando transação: ${transaction.memo || transaction.name} - R$ ${transaction.amount}`);
          
          // Verificar se a transação já existe
          const { exists, similarTransactions, exactMatch } = await this.checkExistingTransaction(transaction, contaBancariaId);
          
          if (exactMatch) {
            // Transação exata encontrada - verificar se precisa atualizar o banco
            if (exactMatch.conta !== contaBancariaId) {
              const updated = await this.updateTransactionBank(exactMatch.id, contaBancariaId);
              if (updated) {
                updatedCount++;
                console.log(`✅ Transação existente atualizada: ${exactMatch.descricao}`);
              }
            } else {
              skippedCount++;
              console.log(`⏭️ Transação já existe: ${exactMatch.descricao}`);
            }
            continue;
          }
          
          if (similarTransactions.length > 0) {
            // Transações similares encontradas - pular por segurança
            skippedCount++;
            console.log(`⚠️ Transação similar encontrada, pulando: ${transaction.memo || transaction.name}`);
            errors.push(`Transação similar encontrada: ${transaction.memo || transaction.name} - R$ ${transaction.amount}`);
            continue;
          }
          
          // Transação não existe - criar nova
          const novaTransacao = {
            data: transaction.datePosted,
            valor: Math.abs(transaction.amount),
            descricao: transaction.memo || transaction.name || 'Transação OFX',
            conta: contaBancariaId,
            tipo: transaction.amount > 0 ? 'receita' : 'despesa',
            status: 'confirmada',
            observacoes: `OFX Import - ${transaction.fitId || 'sem ID'}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const { error: insertError } = await supabase
            .from('transactions')
            .insert(novaTransacao);
          
          if (insertError) {
            console.error('❌ Erro ao inserir transação:', insertError);
            errors.push(`Erro ao inserir: ${transaction.memo || transaction.name} - ${insertError.message}`);
            result.errorCount++;
          } else {
            importedCount++;
            console.log(`✅ Nova transação importada: ${novaTransacao.descricao}`);
          }
          
        } catch (error) {
          console.error('❌ Erro ao processar transação:', error);
          errors.push(`Erro ao processar: ${transaction.memo || transaction.name} - ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          result.errorCount++;
        }
      }
      
      result.success = true;
      result.importedCount = importedCount;
      result.errors = errors;
      
      const summary = [
        `Importação concluída:`,
        `✅ ${importedCount} novas transações importadas`,
        `🔄 ${updatedCount} transações atualizadas`,
        `⏭️ ${skippedCount} transações puladas (já existiam)`,
        `❌ ${result.errorCount} erros`
      ].join('\n');
      
      result.message = summary;
      result.data = ofxData;
      
      console.log('✅ Importação OFX com conciliação concluída:', result);
      
      return result;
      
    } catch (error) {
      console.error('❌ Erro na importação OFX:', error);
      
      return {
        success: false,
        message: `Erro na importação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        importedCount: 0,
        errorCount: ofxData.transactions.length,
        errors: [error instanceof Error ? error.message : 'Erro desconhecido']
      };
    }
  }
  
  // Validar arquivo OFX
  validateOFXFile(file: File): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Verificar extensão
    if (!file.name.toLowerCase().endsWith('.ofx')) {
      errors.push('Arquivo deve ter extensão .ofx');
    }
    
    // Verificar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      errors.push('Arquivo muito grande (máximo 10MB)');
    }
    
    // Verificar se é arquivo de texto
    if (!file.type.includes('text') && file.type !== '') {
      errors.push('Arquivo deve ser um arquivo de texto OFX válido');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const ofxService = new OFXService();
