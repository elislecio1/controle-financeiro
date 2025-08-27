import { createClient } from '@supabase/supabase-js';

// Importar a única instância do Supabase
import { supabase } from './supabase'
import { supabaseService } from './supabase';

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
  balance?: number;
  startDate?: string;
  endDate?: string;
}

export interface OFXImportResult {
  success: boolean;
  message: string;
  importedCount: number;
  errorCount: number;
  errors: string[];
  data?: OFXData;
  updatedCount?: number;
  skippedCount?: number;
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
  updatedCount?: number;
  skippedCount?: number;
}

class OFXService {
  // Parsear arquivo OFX
  async parseOFXFile(file: File): Promise<OFXData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const ofxData = this.parseOFXContent(content);
          resolve(ofxData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file);
    });
  }

  // Parsear conteúdo OFX
  private parseOFXContent(content: string): OFXData {
    // Implementação simplificada do parser OFX
    const lines = content.split('\n');
    const transactions: OFXTransaction[] = [];
    let account: OFXAccount = {
      bankId: '',
      accountId: '',
      accountType: '',
      balance: 0,
      dateAsOf: new Date().toISOString()
    };

    // Parsear informações básicas
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.includes('<BANKID>')) {
        account.bankId = line.replace('<BANKID>', '').replace('</BANKID>', '');
      } else if (line.includes('<ACCTID>')) {
        account.accountId = line.replace('<ACCTID>', '').replace('</ACCTID>', '');
      } else if (line.includes('<STMTTRN>')) {
        // Parsear transação
        const transaction = this.parseTransaction(lines, i);
        if (transaction) {
          transactions.push(transaction);
        }
      }
    }
    
    return {
      account,
      transactions,
      balance: account.balance,
      startDate: transactions.length > 0 ? transactions[0].datePosted : new Date().toISOString(),
      endDate: transactions.length > 0 ? transactions[transactions.length - 1].datePosted : new Date().toISOString()
    };
  }

  // Parsear transação individual
  private parseTransaction(lines: string[], startIndex: number): OFXTransaction | null {
    const transaction: Partial<OFXTransaction> = {
      fitId: '',
      name: '',
      amount: 0,
      datePosted: new Date().toISOString()
    };

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.includes('</STMTTRN>')) {
        break;
      } else if (line.includes('<FITID>')) {
        transaction.fitId = line.replace('<FITID>', '').replace('</FITID>', '');
      } else if (line.includes('<NAME>')) {
        transaction.name = line.replace('<NAME>', '').replace('</NAME>', '');
      } else if (line.includes('<MEMO>')) {
        transaction.memo = line.replace('<MEMO>', '').replace('</MEMO>', '');
      } else if (line.includes('<TRNAMT>')) {
        const amount = line.replace('<TRNAMT>', '').replace('</TRNAMT>', '');
        transaction.amount = parseFloat(amount) || 0;
      } else if (line.includes('<DTPOSTED>')) {
        const dateStr = line.replace('<DTPOSTED>', '').replace('</DTPOSTED>', '');
        transaction.datePosted = this.parseOFXDate(dateStr);
      }
    }

    return transaction as OFXTransaction;
  }

  // Parsear data OFX
  private parseOFXDate(dateStr: string): string {
    try {
      // Formato OFX: YYYYMMDDHHMMSS
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return `${year}-${month}-${day}`;
    } catch (error) {
      return new Date().toISOString();
    }
  }

  // Formatar data OFX para o formato brasileiro
  private formatOFXDateForBrazil(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear());
      return `${day}/${month}/${year}`; // Formato brasileiro DD/MM/YYYY
    } catch (error) {
      return dateStr; // Retorna a data original em caso de erro
    }
  }
  
     // Verificar se uma transação já existe
   async checkExistingTransaction(
      transaction: OFXTransaction, 
      nomeConta: string
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
         .eq('conta', nomeConta)
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
        errors: [],
        updatedCount: 0,
        skippedCount: 0
      };
      
      if (ofxData.transactions.length === 0) {
        result.message = 'Nenhuma transação encontrada no arquivo OFX';
        result.success = true;
        return result;
      }
      
      // Buscar o nome da conta bancária pelo ID
      let nomeConta = 'Conta Bancária';
      try {
        const contas = await supabaseService.getContas();
        const contaEncontrada = contas.find(conta => conta.id === contaBancariaId);
        if (contaEncontrada) {
          nomeConta = contaEncontrada.nome;
          console.log(`🏦 Usando conta: ${nomeConta} (ID: ${contaBancariaId})`);
        } else {
          console.warn(`⚠️ Conta bancária com ID ${contaBancariaId} não encontrada`);
        }
      } catch (error) {
        console.error('❌ Erro ao buscar conta bancária:', error);
      }
      
      let importedCount = 0;
      let errorCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];
      
      for (const transaction of ofxData.transactions) {
        try {
          console.log(`🔍 Processando transação: ${transaction.memo || transaction.name} - R$ ${transaction.amount}`);
          
          // Converter a data OFX para formato brasileiro
          const dataFormatada = this.formatOFXDateForBrazil(transaction.datePosted);
          
          // Verificar se já existe uma transação similar
          const existingCheck = await this.checkExistingTransaction(transaction, nomeConta);
          
          if (existingCheck.exists && existingCheck.similarTransactions.length > 0) {
            // Transação similar encontrada - oferecer opção de atualizar
            const similarTransaction = existingCheck.similarTransactions[0]; // Pegar a primeira similar
            
            console.log(`🔄 Transação similar encontrada: ${similarTransaction.descricao} (ID: ${similarTransaction.id})`);
            
            // Preparar dados para atualização
            const updateData = {
              descricao: transaction.memo || transaction.name || 'Transação OFX',
              categoria: transaction.categoria || (transaction.amount > 0 ? 'Receitas' : 'Despesas'),
              contato: transaction.contato || undefined,
              forma: transaction.forma || 'PIX',
              observacoes: `OFX Import - ${transaction.fitId || 'sem ID'}`,
              dataCompetencia: dataFormatada,
              numeroDocumento: transaction.fitId || undefined,
              tags: ['OFX Import'],
              updated_at: new Date().toISOString()
            };
            
            // Atualizar a transação existente
            const { success, message } = await supabaseService.updateTransaction(similarTransaction.id, updateData);
            
            if (success) {
              updatedCount++;
              console.log(`✅ Transação atualizada: ${updateData.descricao}`);
            } else {
              console.error('❌ Erro ao atualizar transação:', message);
              errors.push(`Erro ao atualizar: ${transaction.memo || transaction.name} - ${message}`);
              errorCount++;
            }
          } else {
            // Nova transação - inserir normalmente
            const novaTransacao = {
              valor: Math.abs(transaction.amount),
              descricao: transaction.memo || transaction.name || 'Transação OFX',
              conta: nomeConta, // Usar o nome da conta em vez do ID
              categoria: transaction.categoria || (transaction.amount > 0 ? 'Receitas' : 'Despesas'),
              contato: transaction.contato || undefined,
              forma: transaction.forma || 'PIX',
              tipo: (transaction.amount > 0 ? 'receita' : 'despesa') as 'receita' | 'despesa' | 'transferencia' | 'investimento',
              data: dataFormatada, // Usar a data formatada
              vencimento: dataFormatada, // Usar a data formatada
              situacao: 'pago',
              status: 'pago',
              observacoes: `OFX Import - ${transaction.fitId || 'sem ID'}`,
              dataCompetencia: dataFormatada, // Adicionar data de competência
              numeroDocumento: transaction.fitId || undefined,
              tags: ['OFX Import'],
              projeto: undefined,
              centro: undefined,
              contaTransferencia: undefined,
              cartao: undefined,
              subcategoria: undefined
            };
            
            // Usar o supabaseService.saveTransaction que tem a lógica correta para datas
            const { success, message } = await supabaseService.saveTransaction(novaTransacao);
            
            if (!success) {
              console.error('❌ Erro ao inserir transação:', message);
              errors.push(`Erro ao inserir: ${transaction.memo || transaction.name} - ${message}`);
              errorCount++;
            } else {
              importedCount++;
              console.log(`✅ Nova transação importada: ${novaTransacao.descricao}`);
            }
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
      result.updatedCount = updatedCount;
      result.skippedCount = skippedCount;
      result.errors = errors;
      result.message = `Importação concluída: ${importedCount} transações importadas, ${updatedCount} atualizadas, ${errorCount} erros`;
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
  
     // Importar transações OFX com opções de atualização
   async importOFXTransactionsWithOptions(
     ofxData: OFXData, 
     contaBancariaId: string,
     options: {
       updateExisting?: boolean;
       updateFields?: string[];
       skipDuplicates?: boolean;
     } = {}
   ): Promise<ImportResult> {
     try {
       console.log('📥 Iniciando importação de transações OFX com opções...');
       
       const result: ImportResult = {
         success: false,
         message: '',
         importedCount: 0,
         errorCount: 0,
         errors: [],
         updatedCount: 0,
         skippedCount: 0
       };
       
       if (ofxData.transactions.length === 0) {
         result.message = 'Nenhuma transação encontrada no arquivo OFX';
         result.success = true;
         return result;
       }
       
       // Buscar o nome da conta bancária pelo ID
       let nomeConta = 'Conta Bancária';
       try {
         const contas = await supabaseService.getContas();
         const contaEncontrada = contas.find(conta => conta.id === contaBancariaId);
         if (contaEncontrada) {
           nomeConta = contaEncontrada.nome;
           console.log(`🏦 Usando conta: ${nomeConta} (ID: ${contaBancariaId})`);
         } else {
           console.warn(`⚠️ Conta bancária com ID ${contaBancariaId} não encontrada`);
         }
       } catch (error) {
         console.error('❌ Erro ao buscar conta bancária:', error);
       }
       
       let importedCount = 0;
       let errorCount = 0;
       let updatedCount = 0;
       let skippedCount = 0;
       const errors: string[] = [];
       
       for (const transaction of ofxData.transactions) {
         try {
           console.log(`🔍 Processando transação: ${transaction.memo || transaction.name} - R$ ${transaction.amount}`);
           
           // Converter a data OFX para formato brasileiro
           const dataFormatada = this.formatOFXDateForBrazil(transaction.datePosted);
           
           // Verificar se já existe uma transação similar
           const existingCheck = await this.checkExistingTransaction(transaction, nomeConta);
           
           if (existingCheck.exists && existingCheck.similarTransactions.length > 0) {
             // Transação similar encontrada
             const similarTransaction = existingCheck.similarTransactions[0];
             
             if (options.skipDuplicates) {
               // Pular transações duplicadas
               skippedCount++;
               console.log(`⏭️ Transação pulada (duplicada): ${transaction.memo || transaction.name}`);
               continue;
             }
             
             if (options.updateExisting) {
               // Atualizar transação existente
               console.log(`🔄 Atualizando transação existente: ${similarTransaction.descricao} (ID: ${similarTransaction.id})`);
               
               const updateData: any = {};
               
               // Atualizar apenas os campos especificados ou todos os campos relevantes
               const fieldsToUpdate = options.updateFields || [
                 'descricao', 'categoria', 'contato', 'forma', 'observacoes', 
                 'dataCompetencia', 'numeroDocumento', 'tags'
               ];
               
               if (fieldsToUpdate.includes('descricao')) {
                 updateData.descricao = transaction.memo || transaction.name || 'Transação OFX';
               }
               if (fieldsToUpdate.includes('categoria')) {
                 updateData.categoria = transaction.categoria || (transaction.amount > 0 ? 'Receitas' : 'Despesas');
               }
               if (fieldsToUpdate.includes('contato')) {
                 updateData.contato = transaction.contato || undefined;
               }
               if (fieldsToUpdate.includes('forma')) {
                 updateData.forma = transaction.forma || 'PIX';
               }
               if (fieldsToUpdate.includes('observacoes')) {
                 updateData.observacoes = `OFX Import - ${transaction.fitId || 'sem ID'}`;
               }
               if (fieldsToUpdate.includes('dataCompetencia')) {
                 updateData.dataCompetencia = dataFormatada;
               }
               if (fieldsToUpdate.includes('numeroDocumento')) {
                 updateData.numeroDocumento = transaction.fitId || undefined;
               }
               if (fieldsToUpdate.includes('tags')) {
                 updateData.tags = ['OFX Import'];
               }
               
               updateData.updated_at = new Date().toISOString();
               
               // Atualizar a transação existente
               const { success, message } = await supabaseService.updateTransaction(similarTransaction.id, updateData);
               
               if (success) {
                 updatedCount++;
                 console.log(`✅ Transação atualizada: ${updateData.descricao || similarTransaction.descricao}`);
               } else {
                 console.error('❌ Erro ao atualizar transação:', message);
                 errors.push(`Erro ao atualizar: ${transaction.memo || transaction.name} - ${message}`);
                 errorCount++;
               }
             } else {
               // Pular transação existente
               skippedCount++;
               console.log(`⏭️ Transação pulada (já existe): ${transaction.memo || transaction.name}`);
             }
           } else {
             // Nova transação - inserir normalmente
             const novaTransacao = {
               valor: Math.abs(transaction.amount),
               descricao: transaction.memo || transaction.name || 'Transação OFX',
               conta: nomeConta,
               categoria: transaction.categoria || (transaction.amount > 0 ? 'Receitas' : 'Despesas'),
               contato: transaction.contato || undefined,
               forma: transaction.forma || 'PIX',
               tipo: (transaction.amount > 0 ? 'receita' : 'despesa') as 'receita' | 'despesa' | 'transferencia' | 'investimento',
               data: dataFormatada,
               vencimento: dataFormatada,
               situacao: 'pago',
               status: 'pago',
               observacoes: `OFX Import - ${transaction.fitId || 'sem ID'}`,
               dataCompetencia: dataFormatada,
               numeroDocumento: transaction.fitId || undefined,
               tags: ['OFX Import'],
               projeto: undefined,
               centro: undefined,
               contaTransferencia: undefined,
               cartao: undefined,
               subcategoria: undefined
             };
             
             const { success, message } = await supabaseService.saveTransaction(novaTransacao);
             
             if (!success) {
               console.error('❌ Erro ao inserir transação:', message);
               errors.push(`Erro ao inserir: ${transaction.memo || transaction.name} - ${message}`);
               errorCount++;
             } else {
               importedCount++;
               console.log(`✅ Nova transação importada: ${novaTransacao.descricao}`);
             }
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
       result.updatedCount = updatedCount;
       result.skippedCount = skippedCount;
       result.errors = errors;
       result.message = `Importação concluída: ${importedCount} transações importadas, ${updatedCount} atualizadas, ${skippedCount} puladas, ${errorCount} erros`;
       result.data = ofxData;
       
       console.log('✅ Importação OFX com opções concluída:', result);
       
       return result;
       
     } catch (error) {
       console.error('❌ Erro na importação OFX com opções:', error);
       
       return {
         success: false,
         message: `Erro na importação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
         importedCount: 0,
         errorCount: ofxData.transactions.length,
         errors: [error instanceof Error ? error.message : 'Erro desconhecido'],
         updatedCount: 0,
         skippedCount: 0
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
