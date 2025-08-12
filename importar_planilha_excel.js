const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Função para converter data brasileira para ISO
function converterDataParaISO(dataStr) {
  if (!dataStr || dataStr === '') return null;
  
  // Se for um número (serial number do Excel), converter
  if (typeof dataStr === 'number' || !isNaN(Number(dataStr))) {
    const serialNumber = Number(dataStr);
    
    // Excel usa 1 de janeiro de 1900 como data base (serial number 1)
    // Mas Excel tem um bug: considera 1900 como ano bissexto, então ajustamos
    const excelEpoch = new Date(1900, 0, 1);
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    
    // Ajustar para o bug do Excel (1900 não foi bissexto)
    let adjustedSerial = serialNumber;
    if (serialNumber > 59) {
      adjustedSerial = serialNumber - 1;
    }
    
    const date = new Date(excelEpoch.getTime() + (adjustedSerial - 1) * millisecondsPerDay);
    
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  // Tentar diferentes formatos de data brasileiros
  const formatos = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY
    /(\d{1,2})-(\d{1,2})-(\d{4})/,   // DD-MM-YYYY
    /(\d{4})-(\d{1,2})-(\d{1,2})/,   // YYYY-MM-DD
    /(\d{1,2})\/(\d{1,2})\/(\d{2})/, // DD/MM/YY (assumir 20XX)
  ];

  for (const formato of formatos) {
    const match = dataStr.toString().match(formato);
    if (match) {
      if (match[1].length === 4) {
        // Formato YYYY-MM-DD
        return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      } else {
        // Formato DD/MM/YYYY ou DD/MM/YY
        let year = match[3];
        if (year.length === 2) {
          year = '20' + year // Assumir século 21
        }
        return `${year}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
      }
    }
  }

  // Se nenhum formato funcionar, tentar parse direto
  const parsed = new Date(dataStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  // Se ainda não funcionar, tentar parse com Date.parse
  const timestamp = Date.parse(dataStr);
  if (!isNaN(timestamp)) {
    return new Date(timestamp).toISOString().split('T')[0];
  }

  console.warn(`Não foi possível converter a data: "${dataStr}"`);
  return null;
}

// Função para converter valor brasileiro
function converterValor(valorStr) {
  if (!valorStr || valorStr === '') return 0;
  
  const valorLimpo = valorStr.toString()
    .replace(/[^\d.,-]/g, '') // Remove caracteres especiais
    .replace(/\./g, '') // Remove pontos (separadores de milhares)
    .replace(',', '.'); // Converte vírgula para ponto
  
  const valor = parseFloat(valorLimpo);
  return isNaN(valor) ? 0 : valor;
}

// Função para determinar tipo de transação
function determinarTipo(descricao, valor) {
  const descricaoLower = descricao.toLowerCase();
  
  // Palavras-chave para receitas
  const receitas = ['receita', 'recebimento', 'pagamento', 'salário', 'venda', 'faturamento'];
  if (receitas.some(palavra => descricaoLower.includes(palavra))) {
    return 'receita';
  }
  
  // Se valor é positivo, provavelmente é receita
  if (valor > 0) {
    return 'receita';
  }
  
  return 'despesa';
}

// Função para determinar status
function determinarStatus(situacao) {
  if (!situacao) return 'pendente';
  
  const situacaoStr = situacao.toString().toLowerCase();
  if (situacaoStr.includes('pago') || situacaoStr.includes('liquidado')) {
    return 'pago';
  } else if (situacaoStr.includes('vencido')) {
    return 'vencido';
  }
  
  return 'pendente';
}

// Função para determinar categoria
function determinarCategoria(descricao) {
  const descricaoLower = descricao.toLowerCase();
  
  if (descricaoLower.includes('energia') || descricaoLower.includes('água') || descricaoLower.includes('agua')) {
    return 'Serviços Públicos';
  } else if (descricaoLower.includes('aluguel') || descricaoLower.includes('rent')) {
    return 'Moradia';
  } else if (descricaoLower.includes('honorários') || descricaoLower.includes('honorarios')) {
    return 'Serviços Profissionais';
  } else if (descricaoLower.includes('funcionários') || descricaoLower.includes('funcionarios')) {
    return 'Recursos Humanos';
  } else if (descricaoLower.includes('dar') || descricaoLower.includes('imposto') || descricaoLower.includes('fgts')) {
    return 'Impostos';
  } else if (descricaoLower.includes('cartão') || descricaoLower.includes('cartao')) {
    return 'Cartão de Crédito';
  }
  
  return 'Geral';
}

// Função para determinar subcategoria
function determinarSubcategoria(descricao) {
  const descricaoLower = descricao.toLowerCase();
  
  if (descricaoLower.includes('energia')) {
    return 'Energia Elétrica';
  } else if (descricaoLower.includes('água') || descricaoLower.includes('agua')) {
    return 'Água e Esgoto';
  } else if (descricaoLower.includes('aluguel')) {
    return 'Aluguel';
  } else if (descricaoLower.includes('honorários') || descricaoLower.includes('honorarios')) {
    return 'Honorários';
  } else if (descricaoLower.includes('funcionários') || descricaoLower.includes('funcionarios')) {
    return 'Salários';
  }
  
  return '';
}

// Função para gerar UUID único baseado nos dados
function gerarUUIDUnico(descricao, valor, data, conta) {
  const dados = `${descricao}_${valor}_${data}_${conta}`;
  const hash = require('crypto').createHash('md5').update(dados).digest('hex');
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
}

// Função principal
function processarPlanilha() {
  try {
    console.log('🚀 Iniciando processamento da planilha...');
    
    // Ler a planilha Excel
    const planilhaPath = path.join(__dirname, 'PLANEJAMENTO FINANCEIRO 2025.xlsx');
    const workbook = XLSX.readFile(planilhaPath);
    
    console.log('📊 Abas encontradas:', workbook.SheetNames);
    
    let todasTransacoes = [];
    let duplicatasEncontradas = [];
    let transacoesUnicas = new Set();
    
    // Processar cada aba
    workbook.SheetNames.forEach((nomeAba, indexAba) => {
      console.log(`\n📋 Processando aba: ${nomeAba}`);
      
      try {
        const worksheet = workbook.Sheets[nomeAba];
        const dados = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (dados.length <= 1) {
          console.log(`⚠️  Aba ${nomeAba} está vazia ou tem apenas cabeçalho`);
          return;
        }
        
        // Pegar cabeçalhos da primeira linha
        const cabecalhos = dados[0];
        console.log('📝 Cabeçalhos:', cabecalhos);
        
        // Processar linhas de dados (pular cabeçalho)
        for (let i = 1; i < dados.length; i++) {
          const linha = dados[i];
          
          // Verificar se a linha tem dados suficientes
          if (!linha || linha.length < 3) continue;
          
          try {
            // Mapear colunas baseado nos cabeçalhos
            const mapeamento = {};
            cabecalhos.forEach((cabecalho, index) => {
              if (cabecalho && linha[index] !== undefined) {
                mapeamento[cabecalho.toString().toLowerCase().trim()] = linha[index];
              }
            });
            
            // Extrair dados com fallbacks para diferentes estruturas
            const vencimento = mapeamento['vencimento'] || mapeamento['data'] || mapeamento['dt'];
            const descricao = mapeamento['descrição'] || mapeamento['descricao'] || mapeamento['desc'] || '';
            const empresa = mapeamento['empresa'] || mapeamento['conta'] || mapeamento['banco'] || '';
            const tipo = mapeamento['tipo'] || '';
            const valor = mapeamento['valor'] || mapeamento['vl'] || 0;
            const situacao = mapeamento['situação'] || mapeamento['situacao'] || mapeamento['status'] || '';
            const dataPagamento = mapeamento['data_pagamento'] || mapeamento['pagamento'] || mapeamento['data pagamento'] || '';
            const parcela = mapeamento['parcela'] || mapeamento['parcelamento'] || '';
            
            // Validar dados obrigatórios
            if (!vencimento || !descricao || valor === 0) {
              console.log(`⚠️  Linha ${i + 1} da aba ${nomeAba} ignorada - dados insuficientes`);
              continue;
            }
            
            // Converter dados
            const dataISO = converterDataParaISO(vencimento);
            if (!dataISO) {
              console.log(`⚠️  Linha ${i + 1} da aba ${nomeAba} ignorada - data inválida: ${vencimento}`);
              continue;
            }
            
            const valorConvertido = converterValor(valor);
            if (valorConvertido === 0) {
              console.log(`⚠️  Linha ${i + 1} da aba ${nomeAba} ignorada - valor inválido: ${valor}`);
              continue;
            }
            
            const tipoTransacao = determinarTipo(descricao, valorConvertido);
            const status = determinarStatus(situacao);
            const categoria = determinarCategoria(descricao);
            const subcategoria = determinarSubcategoria(descricao);
            const conta = empresa || 'Conta Principal';
            const contato = empresa || '';
            
            // Gerar chave única para verificar duplicatas
            const chaveUnica = `${descricao}_${valorConvertido}_${dataISO}_${conta}`;
            
            if (transacoesUnicas.has(chaveUnica)) {
              duplicatasEncontradas.push({
                aba: nomeAba,
                linha: i + 1,
                descricao,
                valor: valorConvertido,
                data: dataISO,
                conta
              });
              continue;
            }
            
            transacoesUnicas.add(chaveUnica);
            
            // Criar objeto de transação
            const transacao = {
              id: gerarUUIDUnico(descricao, valorConvertido, dataISO, conta),
              data: dataISO,
              descricao: descricao.trim(),
              valor: tipoTransacao === 'despesa' ? -Math.abs(valorConvertido) : Math.abs(valorConvertido),
              tipo: tipoTransacao,
              status: status,
              conta: conta,
              categoria: categoria,
              subcategoria: subcategoria,
              contato: contato,
              vencimento: dataISO,
              parcelas: parcela || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            todasTransacoes.push(transacao);
            
          } catch (error) {
            console.error(`❌ Erro ao processar linha ${i + 1} da aba ${nomeAba}:`, error.message);
            continue;
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao processar aba ${nomeAba}:`, error.message);
      }
    });
    
    console.log(`\n📊 Resumo do processamento:`);
    console.log(`✅ Transações únicas encontradas: ${todasTransacoes.length}`);
    console.log(`⚠️  Duplicatas ignoradas: ${duplicatasEncontradas.length}`);
    
    if (duplicatasEncontradas.length > 0) {
      console.log('\n🔍 Duplicatas encontradas:');
      duplicatasEncontradas.slice(0, 20).forEach((dup, index) => {
        console.log(`${index + 1}. Aba: ${dup.aba}, Linha: ${dup.linha}, ${dup.descricao} - R$ ${dup.valor}`);
      });
      
      if (duplicatasEncontradas.length > 20) {
        console.log(`... e mais ${duplicatasEncontradas.length - 20} duplicatas`);
      }
    }
    
    // Gerar SQL
    if (todasTransacoes.length > 0) {
      gerarSQL(todasTransacoes);
    } else {
      console.log('❌ Nenhuma transação válida encontrada para importar');
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar planilha:', error);
  }
}

// Função para gerar SQL
function gerarSQL(transacoes) {
  console.log('\n🔧 Gerando SQL...');
  
  let sql = `-- =====================================================
-- SCRIPT DE IMPORTAÇÃO DE TRANSAÇÕES DO EXCEL
-- Gerado automaticamente em ${new Date().toLocaleString('pt-BR')}
-- Total de transações: ${transacoes.length}
-- =====================================================

-- Primeiro, vamos verificar se já existem transações similares
-- para evitar duplicatas baseadas em descrição, valor, data e conta

-- Inserir transações únicas
INSERT INTO transactions (
  id, data, valor, descricao, conta, forma, tipo_transferencia, 
  categoria, subcategoria, contato, vencimento, 
  created_at, updated_at
) VALUES
`;

  transacoes.forEach((transacao, index) => {
    const isLast = index === transacoes.length - 1;
    
    // Determinar forma de pagamento baseado no status
    let forma = 'dinheiro';
    if (transacao.status === 'pago') {
      if (transacao.conta.toLowerCase().includes('cartão') || transacao.conta.toLowerCase().includes('cartao')) {
        forma = 'cartão';
      } else if (transacao.conta.toLowerCase().includes('pix') || transacao.conta.toLowerCase().includes('transferência')) {
        forma = 'pix';
      } else if (transacao.conta.toLowerCase().includes('boleto')) {
        forma = 'boleto';
      } else {
        forma = 'transferência';
      }
    } else {
      forma = 'pendente';
    }
    
    sql += `(
  '${transacao.id}',
  '${transacao.data}',
  ${transacao.valor},
  '${transacao.descricao.replace(/'/g, "''")}',
  '${transacao.conta.replace(/'/g, "''")}',
  '${forma}',
  '${transacao.tipo === 'transferencia' ? 'sim' : 'nao'}',
  '${transacao.categoria.replace(/'/g, "''")}',
  '${transacao.subcategoria.replace(/'/g, "''")}',
  '${transacao.contato.replace(/'/g, "''")}',
  '${transacao.vencimento}',
  '${transacao.created_at}',
  '${transacao.updated_at}'
)${isLast ? ';' : ','}\n`;
  });
  
  sql += `

-- Verificar se as inserções foram bem-sucedidas
SELECT 
  COUNT(*) as total_inseridas,
  COUNT(CASE WHEN tipo = 'receita' THEN 1 END) as receitas,
  COUNT(CASE WHEN tipo = 'despesa' THEN 1 END) as despesas,
  COUNT(CASE WHEN status = 'pago' THEN 1 END) as pagas,
  COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
  COUNT(CASE WHEN status = 'vencido' THEN 1 END) as vencidas
FROM transactions 
WHERE created_at >= '${new Date().toISOString().split('T')[0]}';

-- Mostrar algumas transações inseridas para verificação
SELECT 
  data, descricao, valor, tipo, status, conta, categoria, forma
FROM transactions 
WHERE created_at >= '${new Date().toISOString().split('T')[0]}'
ORDER BY data DESC
LIMIT 10;
`;

  // Salvar SQL em arquivo
  const sqlPath = path.join(__dirname, 'importacao_transacoes.sql');
  fs.writeFileSync(sqlPath, sql, 'utf8');
  
  console.log(`✅ SQL gerado com sucesso!`);
  console.log(`📁 Arquivo salvo: ${sqlPath}`);
  console.log(`📊 Total de transações no SQL: ${transacoes.length}`);
  
  // Mostrar algumas transações como exemplo
  console.log('\n📋 Exemplos de transações que serão importadas:');
  transacoes.slice(0, 5).forEach((transacao, index) => {
    console.log(`${index + 1}. ${transacao.data} - ${transacao.descricao} - R$ ${transacao.valor} (${transacao.tipo})`);
  });
  
  if (transacoes.length > 5) {
    console.log(`... e mais ${transacoes.length - 5} transações`);
  }
}

// Executar o script
if (require.main === module) {
  processarPlanilha();
}

module.exports = { processarPlanilha, gerarSQL };
