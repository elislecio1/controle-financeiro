const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração do Google Sheets
const GOOGLE_SHEETS_ID = '18QjPfOiWnkdn-OgdySJ9uugX8nAor7wDbBsPkneVrSE';
const GOOGLE_SHEETS_RANGE = 'A:H'; // Colunas A até H

// Função para autenticar com Google Sheets
async function authenticateGoogleSheets() {
  try {
    // Para uso em desenvolvimento, você pode usar uma chave de API
    // Em produção, considere usar OAuth2
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Arquivo de credenciais
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    return sheets;
  } catch (error) {
    console.error('❌ Erro na autenticação do Google Sheets:', error);
    throw error;
  }
}

// Função para ler dados da planilha
async function readGoogleSheets(sheets) {
  try {
    console.log('📊 Lendo dados da planilha...');
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: GOOGLE_SHEETS_RANGE,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      console.log('⚠️ Nenhum dado encontrado na planilha');
      return [];
    }

    // Remover cabeçalho
    const [headers, ...dataRows] = rows;
    console.log('📋 Cabeçalhos encontrados:', headers);
    console.log(`📊 Total de linhas de dados: ${dataRows.length}`);

    return dataRows;
  } catch (error) {
    console.error('❌ Erro ao ler planilha:', error);
    throw error;
  }
}

// Função para converter dados da planilha para formato do Supabase
function convertRowToTransaction(row, index) {
  try {
    // Estrutura da planilha: [VENCIMENTO, DESCRIÇÃO, EMPRESA, TIPO, VALOR, PARCELA, SITUAÇÃO, DATA_PAGAMENTO]
    const [vencimento, descricao, empresa, tipo, valor, parcela, situacao, dataPagamento] = row;

    // Converter data de vencimento (formato: DD/MM/YYYY)
    let dataVencimento = null;
    if (vencimento) {
      const [dia, mes, ano] = vencimento.split('/');
      dataVencimento = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }

    // Converter data de pagamento (formato: DD/MM/YYYY)
    let dataPagamentoConvertida = null;
    if (dataPagamento) {
      const [dia, mes, ano] = dataPagamento.split('/');
      dataPagamentoConvertida = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }

    // Determinar tipo da transação
    let tipoTransacao = 'despesa'; // Padrão
    if (valor && parseFloat(valor) > 0) {
      tipoTransacao = 'receita';
    }

    // Determinar status
    let status = 'pendente'; // Padrão
    if (situacao && situacao.toLowerCase().includes('pago')) {
      status = 'pago';
    } else if (situacao && situacao.toLowerCase().includes('vencido')) {
      status = 'vencido';
    }

    // Converter valor para número
    const valorNumerico = valor ? parseFloat(valor.replace(',', '.')) : 0;

    // Determinar conta (usar empresa como conta se não houver)
    const conta = empresa || 'Conta Padrão';

    const transaction = {
      data: dataVencimento,
      vencimento: dataVencimento,
      valor: tipoTransacao === 'despesa' ? -Math.abs(valorNumerico) : Math.abs(valorNumerico),
      descricao: descricao || 'Transação sem descrição',
      conta: conta,
      tipo: tipoTransacao,
      status: status,
      data_pagamento: dataPagamentoConvertida,
      observacoes: `Migrado da planilha - Empresa: ${empresa || 'N/A'}${parcela ? ` - Parcela: ${parcela}` : ''}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log(`✅ Linha ${index + 1} convertida:`, {
      descricao: transaction.descricao,
      valor: transaction.valor,
      tipo: transaction.tipo,
      status: transaction.status
    });

    return transaction;
  } catch (error) {
    console.error(`❌ Erro ao converter linha ${index + 1}:`, error, row);
    return null;
  }
}

// Função para inserir transações no Supabase
async function insertTransactions(transactions) {
  try {
    console.log(`🚀 Inserindo ${transactions.length} transações no Supabase...`);
    
    // Inserir em lotes para evitar timeout
    const batchSize = 50;
    let insertedCount = 0;
    
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('transactions')
        .insert(batch)
        .select();
      
      if (error) {
        console.error(`❌ Erro ao inserir lote ${Math.floor(i/batchSize) + 1}:`, error);
        throw error;
      }
      
      insertedCount += batch.length;
      console.log(`✅ Lote ${Math.floor(i/batchSize) + 1} inserido: ${batch.length} transações`);
    }
    
    console.log(`🎉 Total de transações inseridas: ${insertedCount}`);
    return insertedCount;
  } catch (error) {
    console.error('❌ Erro ao inserir transações:', error);
    throw error;
  }
}

// Função principal de migração
async function migrateGoogleSheetsToSupabase() {
  try {
    console.log('🚀 Iniciando migração do Google Sheets para Supabase...');
    console.log('📊 Planilha:', GOOGLE_SHEETS_ID);
    
    // Autenticar com Google Sheets
    const sheets = await authenticateGoogleSheets();
    
    // Ler dados da planilha
    const rows = await readGoogleSheets(sheets);
    
    if (rows.length === 0) {
      console.log('⚠️ Nenhum dado para migrar');
      return;
    }
    
    // Converter dados
    console.log('🔄 Convertendo dados...');
    const transactions = [];
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.length > 0 && row[0]) { // Verificar se a linha não está vazia
        const transaction = convertRowToTransaction(row, i);
        if (transaction) {
          transactions.push(transaction);
        }
      }
    }
    
    console.log(`✅ ${transactions.length} transações convertidas com sucesso`);
    
    if (transactions.length === 0) {
      console.log('⚠️ Nenhuma transação válida para inserir');
      return;
    }
    
    // Inserir no Supabase
    const insertedCount = await insertTransactions(transactions);
    
    console.log('🎉 Migração concluída com sucesso!');
    console.log(`📊 Resumo:`);
    console.log(`   - Linhas lidas da planilha: ${rows.length}`);
    console.log(`   - Transações convertidas: ${transactions.length}`);
    console.log(`   - Transações inseridas: ${insertedCount}`);
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

// Executar migração se o script for chamado diretamente
if (require.main === module) {
  migrateGoogleSheetsToSupabase();
}

module.exports = {
  migrateGoogleSheetsToSupabase,
  convertRowToTransaction,
  readGoogleSheets
};
