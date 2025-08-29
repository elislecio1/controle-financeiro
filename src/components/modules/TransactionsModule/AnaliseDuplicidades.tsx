import React, { useState, useMemo } from 'react';
import { 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Trash2,
  Eye,
  DollarSign,
  Calendar,
  User,
  Building
} from 'lucide-react';
import { supabaseService } from '../../../services/supabase';

interface AnalisesFinanceirasProps {
  data: any[];
  onDataChange: (data: any[]) => void;
}

interface DuplicateGroup {
  id: string;
  transactions: any[];
  similarityScore: number;
  reason: string;
}

// Funções auxiliares movidas para fora do componente
const jaroWinklerSimilarity = (str1: string, str2: string): number => {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;
  
  const matchWindow = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
  if (matchWindow < 0) return 0.0;
  
  const str1Matches = new Array(str1.length).fill(false);
  const str2Matches = new Array(str2.length).fill(false);
  
  let matches = 0;
  let transpositions = 0;
  
  // Encontrar matches
  for (let i = 0; i < str1.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(str2.length, i + matchWindow + 1);
    
    for (let j = start; j < end; j++) {
      if (str2Matches[j] || str1[i] !== str2[j]) continue;
      str1Matches[i] = true;
      str2Matches[j] = true;
      matches++;
      break;
    }
  }
  
  if (matches === 0) return 0.0;
  
  // Calcular transposições
  let k = 0;
  for (let i = 0; i < str1.length; i++) {
    if (!str1Matches[i]) continue;
    while (!str2Matches[k]) k++;
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }
  
  const jaroDistance = (matches / str1.length + matches / str2.length + (matches - transpositions / 2) / matches) / 3;
  
  // Aplicar Winkler prefix bonus
  let prefixLength = 0;
  const maxPrefixLength = Math.min(4, Math.min(str1.length, str2.length));
  
  for (let i = 0; i < maxPrefixLength; i++) {
    if (str1[i] === str2[i]) {
      prefixLength++;
    } else {
      break;
    }
  }
  
  return jaroDistance + (prefixLength * 0.1 * (1 - jaroDistance));
};

const stringSimilarity = (str1: string, str2: string): number => {
  // Usar Jaro-Winkler para similaridade de texto
  return jaroWinklerSimilarity(str1.toLowerCase(), str2.toLowerCase());
};

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
};

const calculateSimilarity = (t1: any, t2: any) => {
  console.log('AnaliseDuplicidades - calculateSimilarity chamada com:', { t1, t2 });
  
  try {
    let score = 0;

    // 1. Valor (50% do peso) - Igual ou diferença ≤ R$0,01
    if (Math.abs(t1.valor - t2.valor) <= 0.01) {
      score += 0.5;
      console.log('AnaliseDuplicidades - Mesmo valor detectado:', t1.valor);
    }
    console.log('AnaliseDuplicidades - Score após valor:', score);

    // 2. Data (20% do peso) - ±3 dias
    if (t1.data && t2.data) {
      try {
        const date1 = new Date(t1.data.split('/').reverse().join('-'));
        const date2 = new Date(t2.data.split('/').reverse().join('-'));
        const daysDiff = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);
        console.log('AnaliseDuplicidades - Diferença de dias:', daysDiff);
        
        if (daysDiff <= 3) {
          score += 0.2;
          console.log('AnaliseDuplicidades - Datas dentro do período (±3 dias)');
        }
      } catch (dateError) {
        console.error('AnaliseDuplicidades - Erro ao processar datas:', dateError);
      }
    }
    console.log('AnaliseDuplicidades - Score após data:', score);

    // 3. Descrição (30% do peso) - ≥ 80% de similaridade
    if (t1.descricao && t2.descricao) {
      const similarity = stringSimilarity(t1.descricao, t2.descricao);
      console.log('AnaliseDuplicidades - Similaridade de descrição (Jaro-Winkler):', similarity);
      
      if (similarity >= 0.8) {
        score += 0.3;
        console.log('AnaliseDuplicidades - Descrição similar (≥80%)');
      } else {
        // Proporcional se for menor que 80% mas ainda relevante
        const proportionalScore = (similarity / 0.8) * 0.3;
        score += Math.min(proportionalScore, 0.3);
        console.log('AnaliseDuplicidades - Descrição parcialmente similar:', proportionalScore);
      }
    }
    console.log('AnaliseDuplicidades - Score final:', score);

    const result = {
      score: score,
      details: {
        sameValue: Math.abs(t1.valor - t2.valor) <= 0.01,
        sameDate: t1.data === t2.data,
        dateWithin3Days: t1.data && t2.data ? Math.abs(new Date(t1.data.split('/').reverse().join('-')).getTime() - new Date(t2.data.split('/').reverse().join('-')).getTime()) / (1000 * 60 * 60 * 24) <= 3 : false,
        descriptionSimilarity: t1.descricao && t2.descricao ? stringSimilarity(t1.descricao, t2.descricao) : 0,
        sameAccount: t1.conta === t2.conta
      }
    };
    
    console.log('AnaliseDuplicidades - calculateSimilarity resultado final:', result);
    return result;
  } catch (error) {
    console.error('AnaliseDuplicidades - Erro em calculateSimilarity:', error);
    return { score: 0, details: {} };
  }
};

const getDuplicateReason = (transaction: any, similarTransactions: any[]): string => {
  const reasons = [];
  
  const hasSameValue = similarTransactions.every(t => Math.abs(t.valor - transaction.valor) <= 0.01);
  const hasSameDescription = similarTransactions.every(t => {
    if (!t.descricao || !transaction.descricao) return false;
    return stringSimilarity(t.descricao, transaction.descricao) >= 0.8;
  });
  const hasSameDate = similarTransactions.every(t => t.data === transaction.data);
  const hasDateWithin3Days = similarTransactions.every(t => {
    if (!t.data || !transaction.data) return false;
    const date1 = new Date(t.data.split('/').reverse().join('-'));
    const date2 = new Date(transaction.data.split('/').reverse().join('-'));
    return Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24) <= 3;
  });
  
  if (hasSameValue && hasSameDescription && hasSameDate) {
    return 'Duplicata exata';
  }
  
  if (hasSameValue && hasSameDescription) {
    reasons.push('Mesmo valor e descrição similar');
  }
  
  if (hasSameValue && hasDateWithin3Days) {
    reasons.push('Mesmo valor e datas próximas (±3 dias)');
  }
  
  if (hasSameDescription && hasDateWithin3Days) {
    reasons.push('Descrição similar e datas próximas');
  }
  
  if (hasSameValue) {
    reasons.push('Mesmo valor');
  }
  
  return reasons.join(', ') || 'Similaridade geral';
};

// Função para detectar transferências entre contas (crédito e débito)
const detectTransfers = (transactions: any[]): Set<string> => {
  const transferIds = new Set<string>();
  const transferGroups = new Map<string, any[]>();
  
  console.log('AnaliseDuplicidades - Iniciando detecção de transferências');
  
  // Agrupar transações por valor, data e ID
  transactions.forEach(transaction => {
    const key = `${Math.round(transaction.valor * 100) / 100}_${transaction.data}_${transaction.id}`;
    if (!transferGroups.has(key)) {
      transferGroups.set(key, []);
    }
    transferGroups.get(key)!.push(transaction);
  });
  
  console.log('AnaliseDuplicidades - Grupos de transferência:', transferGroups.size);
  
  // Analisar cada grupo
  transferGroups.forEach((transactionsInGroup, key) => {
    if (transactionsInGroup.length >= 2) {
      console.log(`AnaliseDuplicidades - Analisando grupo de transferência: ${key}, ${transactionsInGroup.length} transações`);
      
      // Verificar se há crédito e débito com mesmo valor
      const hasCredit = transactionsInGroup.some(t => t.valor > 0);
      const hasDebit = transactionsInGroup.some(t => t.valor < 0);
      
      if (hasCredit && hasDebit) {
        console.log(`AnaliseDuplicidades - ✅ Detectada transferência: crédito e débito com mesmo valor/data/ID`);
        console.log('AnaliseDuplicidades - Transações da transferência:', 
          transactionsInGroup.map(t => `${t.descricao} (${t.valor > 0 ? 'Crédito' : 'Débito'})`));
        
        transactionsInGroup.forEach(transaction => {
          transferIds.add(transaction.id);
        });
      }
    }
  });
  
  console.log(`AnaliseDuplicidades - Total de transferências detectadas: ${transferIds.size}`);
  return transferIds;
};

// Função para detectar transações recorrentes (mensalidades)
const detectRecurringTransactions = (transactions: any[]): Set<string> => {
  const recurringIds = new Set<string>();
  const valueGroups = new Map<number, any[]>();
  
  console.log('AnaliseDuplicidades - Iniciando detecção de transações recorrentes');
  
  // Agrupar transações por valor
  transactions.forEach(transaction => {
    const valor = Math.round(transaction.valor * 100) / 100; // Normalizar valor
    if (!valueGroups.has(valor)) {
      valueGroups.set(valor, []);
    }
    valueGroups.get(valor)!.push(transaction);
  });
  
  console.log('AnaliseDuplicidades - Grupos por valor:', valueGroups.size);
  
  // Analisar cada grupo de valor
  valueGroups.forEach((transactionsWithSameValue, valor) => {
    console.log(`AnaliseDuplicidades - Analisando grupo com valor ${valor}, ${transactionsWithSameValue.length} transações`);
    
    if (transactionsWithSameValue.length < 3) {
      console.log(`AnaliseDuplicidades - Grupo com valor ${valor} tem menos de 3 transações, ignorando`);
      return;
    }
    
    // Ordenar por data
    const sortedTransactions = transactionsWithSameValue.sort((a, b) => {
      const dateA = new Date(a.data.split('/').reverse().join('-'));
      const dateB = new Date(b.data.split('/').reverse().join('-'));
      return dateA.getTime() - dateB.getTime();
    });
    
    console.log(`AnaliseDuplicidades - Transações ordenadas para valor ${valor}:`, 
      sortedTransactions.map(t => `${t.descricao} (${t.data})`));
    
    // Verificar se são mensalidades recorrentes
    let isRecurring = true;
    let totalDaysDiff = 0;
    let comparisons = 0;
    
    // Verificar se as descrições são muito similares (indicativo de mensalidade)
    const firstDescription = sortedTransactions[0].descricao?.toLowerCase() || '';
    const hasSimilarDescriptions = sortedTransactions.every(t => {
      if (!t.descricao) return false;
      const similarity = stringSimilarity(firstDescription, t.descricao.toLowerCase());
      return similarity >= 0.7; // 70% de similaridade
    });
    
    console.log(`AnaliseDuplicidades - Descrições similares: ${hasSimilarDescriptions}`);
    
    for (let i = 1; i < sortedTransactions.length; i++) {
      const prevDate = new Date(sortedTransactions[i-1].data.split('/').reverse().join('-'));
      const currDate = new Date(sortedTransactions[i].data.split('/').reverse().join('-'));
      
      // Calcular diferença em dias
      const daysDiff = Math.abs(currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      totalDaysDiff += daysDiff;
      comparisons++;
      
      console.log(`AnaliseDuplicidades - Comparando ${sortedTransactions[i-1].data} com ${sortedTransactions[i].data}: ${daysDiff} dias`);
      
      // Verificar se a diferença está entre 25 e 35 dias (tolerância maior para mensalidades)
      if (daysDiff < 25 || daysDiff > 35) {
        console.log(`AnaliseDuplicidades - Diferença de ${daysDiff} dias não está no intervalo esperado (25-35 dias)`);
        isRecurring = false;
        break;
      }
    }
    
    if (isRecurring && comparisons > 0) {
      const avgDaysDiff = totalDaysDiff / comparisons;
      console.log(`AnaliseDuplicidades - Média de diferença: ${avgDaysDiff.toFixed(1)} dias`);
      
      // Verificar se a média está próxima de 30 dias OU se tem descrições muito similares
      if (Math.abs(avgDaysDiff - 30) <= 5 || hasSimilarDescriptions) {
        console.log(`AnaliseDuplicidades - ✅ Detectadas transações recorrentes para valor ${valor}:`, 
          sortedTransactions.map(t => `${t.descricao} (${t.data})`));
        
        sortedTransactions.forEach(transaction => {
          recurringIds.add(transaction.id);
        });
      } else {
        console.log(`AnaliseDuplicidades - Média de ${avgDaysDiff.toFixed(1)} dias não está próxima de 30 dias e descrições não são similares`);
      }
    } else {
      console.log(`AnaliseDuplicidades - ❌ Não são transações recorrentes para valor ${valor}`);
    }
  });
  
  console.log(`AnaliseDuplicidades - Total de transações recorrentes detectadas: ${recurringIds.size}`);
  return recurringIds;
};

// Função para filtrar transações por período relevante
const filterRelevantTransactions = (transactions: any[]): any[] => {
  const today = new Date();
  const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
  const threeMonthsFromNow = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
  
  return transactions.filter(transaction => {
    if (!transaction.data) return false;
    
    try {
      const transactionDate = new Date(transaction.data.split('/').reverse().join('-'));
      return transactionDate >= threeMonthsAgo && transactionDate <= threeMonthsFromNow;
    } catch (error) {
      console.error('Erro ao processar data da transação:', error);
      return false;
    }
  });
};

export default function AnalisesFinanceiras({
  data,
  onDataChange
}: AnalisesFinanceirasProps) {
  console.log('AnaliseDuplicidades - Componente renderizado. Data recebida:', data);
  
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [recurringCount, setRecurringCount] = useState(0);
  const [transferCount, setTransferCount] = useState(0);

  // Verificação de segurança
  if (!data || !Array.isArray(data)) {
    return (
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Dados não disponíveis</h3>
            <p className="text-gray-500">
              Não foi possível carregar os dados das transações. Tente recarregar a página.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Algoritmo para detectar duplicatas
  const duplicateGroups = useMemo(() => {
    console.log('AnaliseDuplicidades - useMemo para duplicateGroups iniciado.');
    console.log('AnaliseDuplicidades - data:', data);
    console.log('AnaliseDuplicidades - filterType:', filterType);
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }

    // Filtrar transações por período relevante (±3 meses)
    const relevantTransactions = filterRelevantTransactions(data);
    console.log('AnaliseDuplicidades - Transações relevantes (últimos 3 meses):', relevantTransactions.length);

    // Detectar e excluir transações recorrentes (mensalidades)
    const recurringIds = detectRecurringTransactions(relevantTransactions);
    console.log('AnaliseDuplicidades - Transações recorrentes detectadas:', recurringIds.size);
    
    // Detectar e excluir transferências
    const transferIds = detectTransfers(relevantTransactions);
    console.log('AnaliseDuplicidades - Transferências detectadas:', transferIds.size);

    // Filtrar transações não recorrentes
    const nonRecurringTransactions = relevantTransactions.filter(t => !recurringIds.has(t.id) && !transferIds.has(t.id));
    console.log('AnaliseDuplicidades - Transações não recorrentes para análise:', nonRecurringTransactions.length);

    // Armazenar informações sobre transações recorrentes para exibição
    const recurringTransactions = relevantTransactions.filter(t => recurringIds.has(t.id));
    console.log('AnaliseDuplicidades - Transações recorrentes:', recurringTransactions.length);
    
    // Armazenar informações sobre transferências para exibição
    const transferTransactions = relevantTransactions.filter(t => transferIds.has(t.id));
    console.log('AnaliseDuplicidades - Transferências:', transferTransactions.length);
    
    // Atualizar contadores
    setRecurringCount(recurringTransactions.length);
    setTransferCount(transferTransactions.length);

    const groups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    nonRecurringTransactions.forEach((transaction, index) => {
      console.log(`AnaliseDuplicidades - Processando transação ${index}:`, transaction);
      
      if (processed.has(transaction.id)) {
        console.log(`AnaliseDuplicidades - Transação ${index} já processada, pulando.`);
        return;
      }

      const similarTransactions = [transaction];
      processed.add(transaction.id);
      console.log(`AnaliseDuplicidades - Transação ${index} adicionada ao grupo.`);

      // Buscar transações similares
      console.log(`AnaliseDuplicidades - Buscando transações similares para transação ${index}`);
      nonRecurringTransactions.slice(index + 1).forEach((otherTransaction, otherIndex) => {
        console.log(`AnaliseDuplicidades - Comparando com transação ${index + otherIndex + 1}:`, otherTransaction);
        
        if (processed.has(otherTransaction.id)) {
          console.log(`AnaliseDuplicidades - Transação ${index + otherIndex + 1} já processada, pulando.`);
          return;
        }

        console.log(`AnaliseDuplicidades - Calculando similaridade entre transações ${index} e ${index + otherIndex + 1}`);
        const similarity = calculateSimilarity(transaction, otherTransaction);
        console.log(`AnaliseDuplicidades - Similaridade calculada:`, similarity);
        
        if (similarity.score >= 0.7) { // 70% de similaridade - threshold otimizado
          console.log(`AnaliseDuplicidades - Transação ${index + otherIndex + 1} é similar (${similarity.score}), adicionando ao grupo.`);
          similarTransactions.push(otherTransaction);
          processed.add(otherTransaction.id);
        } else {
          console.log(`AnaliseDuplicidades - Transação ${index + otherIndex + 1} não é similar (${similarity.score}), ignorando.`);
        }
      });

      // Se encontrou duplicatas, criar grupo
      if (similarTransactions.length > 1) {
        const avgSimilarity = similarTransactions.reduce((sum, t) => {
          return sum + calculateSimilarity(transaction, t).score;
        }, 0) / similarTransactions.length;

        groups.push({
          id: `group-${index}`,
          transactions: similarTransactions,
          similarityScore: avgSimilarity,
          reason: getDuplicateReason(transaction, similarTransactions)
        });
      }
    });

    // Filtrar por tipo de similaridade
    return groups.filter(group => {
      if (filterType === 'all') return true;
      if (filterType === 'high') return group.similarityScore >= 0.9;
      if (filterType === 'medium') return group.similarityScore >= 0.7 && group.similarityScore < 0.9;
      if (filterType === 'low') return group.similarityScore < 0.7;
      return true;
    });
  }, [data, filterType]);

  // Funções auxiliares
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getClasseValor = (valor: number) => {
    return valor >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 0.9) return 'text-red-600 bg-red-50';
    if (score >= 0.7) return 'text-orange-600 bg-orange-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  const getSimilarityLabel = (score: number) => {
    if (score >= 0.9) return 'Alta';
    if (score >= 0.7) return 'Média';
    return 'Baixa';
  };

  // Ações
  const handleMarkAsNotDuplicate = async (groupId: string) => {
    setLoading(true);
    try {
      // Marcar transações como não duplicadas (adicionar tag)
      const group = duplicateGroups.find(g => g.id === groupId);
      if (!group) return;

      for (const transaction of group.transactions) {
        const currentTags = transaction.tags || [];
        const updatedTags = [...currentTags, 'Não Duplicada'];
        
        await supabaseService.updateTransaction(transaction.id, {
          tags: updatedTags,

        });
      }

      // Recarregar dados
              const updatedData = await supabaseService.getData();
      onDataChange(updatedData);
      
      alert('Transações marcadas como não duplicadas!');
    } catch (error) {
      console.error('Erro ao marcar como não duplicada:', error);
      alert('Erro ao processar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDuplicate = async (transactionId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta transação duplicada?')) {
      return;
    }

    setLoading(true);
    try {
      const { success, message } = await supabaseService.deleteTransaction(transactionId);
      
      if (success) {
        // Recarregar dados
        const updatedData = await supabaseService.getData();
        onDataChange(updatedData);
        
        alert('Transação duplicada excluída com sucesso!');
      } else {
        alert(`Erro ao excluir: ${message}`);
      }
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      alert('Erro ao excluir transação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Search className="h-5 w-5 text-gray-600" />
            Análise de Duplicidades
          </h3>
          <div className="text-sm text-gray-500">
            {duplicateGroups.length} grupos de duplicatas encontrados
            <br />
            <span className="text-xs text-gray-400">
              Analisando transações dos últimos 3 meses
              {recurringCount > 0 && (
                <>
                  <br />
                  {recurringCount} transações recorrentes excluídas da análise
                </>
              )}
              {transferCount > 0 && (
                <>
                  <br />
                  {transferCount} transferências excluídas da análise
                </>
              )}
            </span>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center space-x-4 mb-6">
          <label className="text-sm font-medium text-gray-700">Filtrar por similaridade:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todas</option>
            <option value="high">Alta (≥90%)</option>
            <option value="medium">Média (70-89%)</option>
            <option value="low">Baixa (&lt;70%)</option>
          </select>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-red-800">Total de Grupos</p>
                <p className="text-lg font-semibold text-red-900">{duplicateGroups.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-orange-800">Transações Duplicadas</p>
                <p className="text-lg font-semibold text-orange-900">
                  {duplicateGroups.reduce((sum, group) => sum + group.transactions.length, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Valor Total</p>
                <p className="text-lg font-semibold text-yellow-900">
                  {formatarMoeda(
                    duplicateGroups.reduce((sum, group) => 
                      sum + group.transactions.reduce((groupSum, t) => groupSum + Math.abs(t.valor), 0), 0
                    )
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-800">Média Similaridade</p>
                <p className="text-lg font-semibold text-blue-900">
                  {duplicateGroups.length > 0 
                    ? `${(duplicateGroups.reduce((sum, group) => sum + group.similarityScore, 0) / duplicateGroups.length * 100).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de grupos de duplicatas */}
      <div className="space-y-4">
        {duplicateGroups.map((group) => (
          <div key={group.id} className="bg-white shadow rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSimilarityColor(group.similarityScore)}`}>
                    {getSimilarityLabel(group.similarityScore)} Similaridade
                  </span>
                  <span className="text-sm text-gray-600">
                    {group.transactions.length} transações
                  </span>
                  <span className="text-sm text-gray-600">
                    {group.reason}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedGroup(selectedGroup === group.id ? null : group.id)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title="Ver detalhes"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleMarkAsNotDuplicate(group.id)}
                    disabled={loading}
                    className="text-green-600 hover:text-green-900 p-1"
                    title="Marcar como não duplicada"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {selectedGroup === group.id && (
              <div className="px-6 py-4">
                <div className="space-y-3">
                  {group.transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{transaction.descricao}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {transaction.data}
                              </span>
                              <span className="flex items-center">
                                <DollarSign className="h-3 w-3 mr-1" />
                                <span className={getClasseValor(transaction.tipo === 'despesa' ? -Math.abs(transaction.valor) : transaction.valor)}>
                                  {transaction.tipo === 'despesa' ? '- ' : ''}{formatarMoeda(Math.abs(transaction.valor))}
                                </span>
                              </span>
                              <span className="flex items-center">
                                <Building className="h-3 w-3 mr-1" />
                                {transaction.conta}
                              </span>
                              {transaction.contato && (
                                <span className="flex items-center">
                                  <User className="h-3 w-3 mr-1" />
                                  {transaction.contato}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.status === 'pago' ? 'bg-green-100 text-green-800' :
                              transaction.status === 'vencido' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {transaction.status === 'pago' ? 'Pago' :
                               transaction.status === 'vencido' ? 'Vencido' : 'Pendente'}
                            </span>
                            <button
                              onClick={() => handleDeleteDuplicate(transaction.id)}
                              disabled={loading}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Excluir duplicata"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {duplicateGroups.length === 0 && (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma duplicata encontrada!</h3>
            <p className="text-gray-500">
              Suas transações estão organizadas e não foram detectadas duplicatas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
