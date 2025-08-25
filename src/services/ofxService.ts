import { createClient } from '@supabase/supabase-js';

// Importar a única instância do Supabase
import { supabase } from './supabase'

export interface OFXTransaction {
  fitId: string;
  name: string;
  memo?: string;
  amount: number;
  datePosted: string;
  categoria?: string;
  contato?: string;
  forma?: string;
}

export interface OFXAccount {
  bankId: string;
  accountId: string;
  accountType: string;
  balance: number;
  dateAsOf: string;
}

export interface OFXData {
  account: OFXAccount;
  transactions: OFXTransaction[];
}

export interface OFXImportResult {
  success: boolean;
  message: string;
  importedCount: number;
  errorCount: number;
  errors: string[];
  data?: OFXData;
}

export interface SimilarTransaction {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria?: string;
  contato?: string;
  forma?: string;
}

export interface ReconciliationOption {
  action: 'conciliar' | 'marcar_pago' | 'importar' | 'pular';
  transactionId?: string;
}

export interface ImportResult {
  success: boolean;
  message: string;
  importedCount: number;
  errorCount: number;
  errors: string[];
  data?: OFXData;
  similarTransactions?: {
    ofxTransaction: OFXTransaction;
    similarTransactions: SimilarTransaction[];
  }[];
  needsReconciliation?: boolean;
}

class OFXService {
  // Verificar se uma transação já existe
  async checkExistingTransaction(
    transaction: OFXTransaction, 
    contaBancariaId: string
  ): Promise<{
    exists: boolean;
    similarTransactions: SimilarTransaction[];
    exactMatch: boolean;
    isExactDuplicate: boolean;
    suggestions: any;
  }> {
    try {
      const { data: existingTransactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('conta', contaBancariaId)
        .eq('valor', Math.abs(transaction.amount))
        .gte('vencimento', this.subtractDays(transaction.datePosted, 7))
        .lte('vencimento', this.addDays(transaction.datePosted, 7));

      if (error) {
        console.error('❌ Erro ao verificar transações existentes:', error);
        return {
          exists: false,
          similarTransactions: [],
          exactMatch: false,
          isExactDuplicate: false,
          suggestions: {}
        };
      }

      const similarTransactions: SimilarTransaction[] = (existingTransactions || [])
        .map(t => ({
          id: t.id,
          descricao: t.descricao,
          valor: t.valor,
          data: t.vencimento,
          categoria: t.categoria,
          contato: t.contato,
          forma: t.forma
        }))
        .filter(t => this.isDescriptionSimilar(t.descricao, transaction.memo || transaction.name));

      const exactMatch = similarTransactions.some(t => 
        t.descricao.toLowerCase() === (transaction.memo || transaction.name).toLowerCase() &&
        t.valor === Math.abs(transaction.amount)
      );

      const isExactDuplicate = exactMatch;

      return {
        exists: similarTransactions.length > 0,
        similarTransactions,
        exactMatch,
        isExactDuplicate,
        suggestions: {}
      };
    } catch (error) {
      console.error('❌ Erro ao verificar transação existente:', error);
      return {
        exists: false,
        similarTransactions: [],
        exactMatch: false,
        isExactDuplicate: false,
        suggestions: {}
      };
    }
  }

  // Verificar similaridade entre descrições
  private isDescriptionSimilar(desc1: string, desc2: string): boolean {
    const clean1 = desc1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const clean2 = desc2.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const similarity = this.calculateSimilarity(clean1, clean2);
    return similarity > 0.7; // 70% de similaridade
  }

  // Calcular similaridade entre strings
  private calculateSimilarity(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
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
    
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : (maxLength - matrix[str2.length][str1.length]) / maxLength;
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

  // Processar ações de conciliação
  async processReconciliation(
    ofxTransaction: OFXTransaction, 
    reconciliationOption: ReconciliationOption,
    contaBancariaId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      switch (reconciliationOption.action) {
        case 'conciliar':
          if (reconciliationOption.transactionId) {
            const { error } = await supabase
              .from('transactions')
              .update({ 
                status: 'pago',
                situacao: 'conciliada',
                updated_at: new Date().toISOString()
              })
              .eq('id', reconciliationOption.transactionId);
            
            if (error) {
              console.error('❌ Erro ao conciliar transação:', error);
              return { success: false, message: `Erro ao conciliar: ${error.message}` };
            }
            
            return { success: true, message: 'Transação conciliada com sucesso' };
          }
          break;
          
        case 'marcar_pago':
          if (reconciliationOption.transactionId) {
            const { error } = await supabase
              .from('transactions')
              .update({ 
                status: 'pago',
                updated_at: new Date().toISOString()
              })
              .eq('id', reconciliationOption.transactionId);
            
            if (error) {
              console.error('❌ Erro ao marcar como pago:', error);
              return { success: false, message: `Erro ao marcar como pago: ${error.message}` };
            }
            
            return { success: true, message: 'Transação marcada como paga' };
          }
          break;
          
        case 'importar':
          const novaTransacao = {
            valor: Math.abs(ofxTransaction.amount),
            descricao: ofxTransaction.memo || ofxTransaction.name || 'Transação OFX',
            conta: contaBancariaId,
            categoria: ofxTransaction.categoria || (ofxTransaction.amount > 0 ? 'Receitas' : 'Despesas'),
            contato: ofxTransaction.contato || null,
            forma: ofxTransaction.forma || 'PIX',
            tipo: ofxTransaction.amount > 0 ? 'receita' : 'despesa',
            vencimento: ofxTransaction.datePosted,
            situacao: 'pago',
            status: 'pago',
            observacoes: `OFX Import - ${ofxTransaction.fitId || 'sem ID'}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const { error: insertError } = await supabase
            .from('transactions')
            .insert(novaTransacao);
          
          if (insertError) {
            console.error('❌ Erro ao inserir transação:', insertError);
            return { success: false, message: `Erro ao importar: ${insertError.message}` };
          }
          
          return { success: true, message: 'Transação importada com sucesso' };
          
        case 'pular':
          return { success: true, message: 'Transação pulada' };
          
        default:
          return { success: false, message: 'Ação de conciliação inválida' };
      }
      
      return { success: false, message: 'Ação não processada' };
      
    } catch (error) {
      console.error('❌ Erro ao processar conciliação:', error);
      return { 
        success: false, 
        message: `Erro ao processar conciliação: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      };
    }
  }

  // Importar transações OFX para o sistema
  async importOFXTransactions(ofxData: OFXData, contaBancariaId: string): Promise<ImportResult> {
    try {
      console.log('📥 Iniciando importação de transações OFX...');
      
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
      let errorCount = 0;
      const errors: string[] = [];
      
      for (const transaction of ofxData.transactions) {
        try {
          console.log(`🔍 Processando transação: ${transaction.memo || transaction.name} - R$ ${transaction.amount}`);
          
          const novaTransacao = {
            valor: Math.abs(transaction.amount),
            descricao: transaction.memo || transaction.name || 'Transação OFX',
            conta: contaBancariaId,
            categoria: transaction.categoria || (transaction.amount > 0 ? 'Receitas' : 'Despesas'),
            contato: transaction.contato || null,
            forma: transaction.forma || 'PIX',
            tipo: transaction.amount > 0 ? 'receita' : 'despesa',
            vencimento: transaction.datePosted,
            situacao: 'pago',
            status: 'pago',
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
            errorCount++;
          } else {
            importedCount++;
            console.log(`✅ Nova transação importada: ${novaTransacao.descricao}`);
          }
          
        } catch (error) {
          console.error('❌ Erro ao processar transação:', error);
          errors.push(`Erro ao processar: ${transaction.memo || transaction.name} - ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          errorCount++;
        }
      }
      
      result.success = true;
      result.importedCount = importedCount;
      result.errorCount = errorCount;
      result.errors = errors;
      result.message = `Importação concluída: ${importedCount} transações importadas, ${errorCount} erros`;
      result.data = ofxData;
      
      console.log('✅ Importação OFX concluída:', result);
      
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
    
    if (!file.name.toLowerCase().endsWith('.ofx')) {
      errors.push('Arquivo deve ter extensão .ofx');
    }
    
    if (file.size > 10 * 1024 * 1024) {
      errors.push('Arquivo muito grande (máximo 10MB)');
    }
    
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
