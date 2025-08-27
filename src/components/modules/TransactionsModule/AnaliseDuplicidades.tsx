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

interface AnaliseDuplicidadesProps {
  data: any[];
  onDataChange: (data: any[]) => void;
}

interface DuplicateGroup {
  id: string;
  transactions: any[];
  similarityScore: number;
  reason: string;
}

export default function AnaliseDuplicidades({
  data,
  onDataChange
}: AnaliseDuplicidadesProps) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Algoritmo para detectar duplicatas
  const duplicateGroups = useMemo(() => {
    const groups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    data.forEach((transaction, index) => {
      if (processed.has(transaction.id)) return;

      const similarTransactions = [transaction];
      processed.add(transaction.id);

      // Buscar transações similares
      data.slice(index + 1).forEach(otherTransaction => {
        if (processed.has(otherTransaction.id)) return;

        const similarity = calculateSimilarity(transaction, otherTransaction);
        
        if (similarity.score >= 0.7) { // 70% de similaridade
          similarTransactions.push(otherTransaction);
          processed.add(otherTransaction.id);
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

  // Calcular similaridade entre duas transações
  const calculateSimilarity = (t1: any, t2: any) => {
    let score = 0;
    let factors = 0;

    // Mesmo valor (peso alto)
    if (Math.abs(t1.valor - t2.valor) < 0.01) {
      score += 0.4;
    }
    factors++;

    // Mesma descrição (peso alto)
    if (t1.descricao?.toLowerCase() === t2.descricao?.toLowerCase()) {
      score += 0.3;
    } else if (t1.descricao && t2.descricao) {
      const similarity = stringSimilarity(t1.descricao.toLowerCase(), t2.descricao.toLowerCase());
      score += similarity * 0.3;
    }
    factors++;

    // Mesma data (peso médio)
    if (t1.data === t2.data) {
      score += 0.2;
    } else if (t1.data && t2.data) {
      const date1 = new Date(t1.data.split('/').reverse().join('-'));
      const date2 = new Date(t2.data.split('/').reverse().join('-'));
      const daysDiff = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff <= 7) {
        score += 0.1;
      }
    }
    factors++;

    // Mesma conta (peso baixo)
    if (t1.conta === t2.conta) {
      score += 0.1;
    }
    factors++;

    return {
      score: score / factors,
      details: {
        sameValue: Math.abs(t1.valor - t2.valor) < 0.01,
        sameDescription: t1.descricao?.toLowerCase() === t2.descricao?.toLowerCase(),
        sameDate: t1.data === t2.data,
        sameAccount: t1.conta === t2.conta
      }
    };
  };

  // Calcular similaridade entre strings
  const stringSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  // Distância de Levenshtein
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

  // Obter razão da duplicata
  const getDuplicateReason = (transaction: any, similarTransactions: any[]): string => {
    const reasons = [];
    
    const hasSameValue = similarTransactions.every(t => Math.abs(t.valor - transaction.valor) < 0.01);
    const hasSameDescription = similarTransactions.every(t => t.descricao?.toLowerCase() === transaction.descricao?.toLowerCase());
    const hasSameDate = similarTransactions.every(t => t.data === transaction.data);
    
    if (hasSameValue && hasSameDescription && hasSameDate) {
      return 'Duplicata exata';
    }
    
    if (hasSameValue && hasSameDescription) {
      reasons.push('Mesmo valor e descrição');
    }
    
    if (hasSameValue && hasSameDate) {
      reasons.push('Mesmo valor e data');
    }
    
    if (hasSameDescription && hasSameDate) {
      reasons.push('Mesma descrição e data');
    }
    
    if (hasSameValue) {
      reasons.push('Mesmo valor');
    }
    
    return reasons.join(', ') || 'Similaridade geral';
  };

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
          updated_at: new Date().toISOString()
        });
      }

      // Recarregar dados
      const updatedData = await supabaseService.getTransactions();
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
        const updatedData = await supabaseService.getTransactions();
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
