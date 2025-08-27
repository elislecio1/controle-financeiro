import React, { useState } from 'react';
import { 
  Plus, 
  Save, 
  X, 
  Calendar,
  DollarSign,
  FileText,
  User,
  Building,
  CreditCard,
  Tag
} from 'lucide-react';
import { supabaseService } from '../../../services/supabase';

interface CadastroTransacoesProps {
  categorias: any[];
  subcategorias: any[];
  centrosCusto: any[];
  contas: any[];
  cartoes: any[];
  onDataChange: (data: any[]) => void;
}

export default function CadastroTransacoes({
  categorias,
  subcategorias,
  centrosCusto,
  contas,
  cartoes,
  onDataChange
}: CadastroTransacoesProps) {
  const [formData, setFormData] = useState({
    data: '',
    valor: '',
    descricao: '',
    conta: '',
    contaTransferencia: '',
    cartao: '',
    categoria: '',
    subcategoria: '',
    contato: '',
    centro: '',
    projeto: '',
    forma: '',
    numeroDocumento: '',
    observacoes: '',
    dataCompetencia: '',
    tags: [] as string[],
    tipo: 'despesa' as 'receita' | 'despesa' | 'transferencia' | 'investimento',
    vencimento: '',
    parcelas: '1',
    situacao: 'pendente'
  });

  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.descricao || !formData.valor || !formData.data) {
      alert('Por favor, preencha os campos obrigatórios (Descrição, Valor e Data)');
      return;
    }

    setLoading(true);
    try {
      const novaTransacao = {
        data: formData.data,
        valor: parseFloat(formData.valor),
        descricao: formData.descricao,
        conta: formData.conta,
        contaTransferencia: formData.contaTransferencia || undefined,
        cartao: formData.cartao || undefined,
        categoria: formData.categoria,
        subcategoria: formData.subcategoria || undefined,
        contato: formData.contato || undefined,
        centro: formData.centro || undefined,
        projeto: formData.projeto || undefined,
        forma: formData.forma,
        numeroDocumento: formData.numeroDocumento || undefined,
        observacoes: formData.observacoes || undefined,
        dataCompetencia: formData.dataCompetencia || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        tipo: formData.tipo,
        vencimento: formData.vencimento || formData.data,
        parcelas: parseInt(formData.parcelas),
        situacao: formData.situacao,
        status: formData.situacao
      };

      const { success, message, data } = await supabaseService.saveTransaction(novaTransacao);

      if (success && data) {
        // Atualizar dados locais
        const currentData = await supabaseService.getTransactions();
        onDataChange(currentData);
        
        // Limpar formulário
        setFormData({
          data: '',
          valor: '',
          descricao: '',
          conta: '',
          contaTransferencia: '',
          cartao: '',
          categoria: '',
          subcategoria: '',
          contato: '',
          centro: '',
          projeto: '',
          forma: '',
          numeroDocumento: '',
          observacoes: '',
          dataCompetencia: '',
          tags: [],
          tipo: 'despesa',
          vencimento: '',
          parcelas: '1',
          situacao: 'pendente'
        });
        
        setShowForm(false);
        alert('Transação cadastrada com sucesso!');
      } else {
        alert(`Erro ao cadastrar: ${message}`);
      }
    } catch (error) {
      console.error('Erro ao cadastrar transação:', error);
      alert('Erro ao cadastrar transação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearForm = () => {
    setFormData({
      data: '',
      valor: '',
      descricao: '',
      conta: '',
      contaTransferencia: '',
      cartao: '',
      categoria: '',
      subcategoria: '',
      contato: '',
      centro: '',
      projeto: '',
      forma: '',
      numeroDocumento: '',
      observacoes: '',
      dataCompetencia: '',
      tags: [],
      tipo: 'despesa',
      vencimento: '',
      parcelas: '1',
      situacao: 'pendente'
    });
  };

  const formatarData = (data: string) => {
    if (!data) return '';
    const [year, month, day] = data.split('-');
    return `${day}/${month}/${year}`;
  };

  const parsearData = (data: string) => {
    if (!data) return '';
    const [day, month, year] = data.split('/');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Plus className="h-5 w-5 text-gray-600" />
            Cadastro de Transações
          </h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showForm 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {showForm ? (
              <>
                <X className="h-4 w-4 inline mr-2" />
                Cancelar
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 inline mr-2" />
                Nova Transação
              </>
            )}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Data *
                </label>
                <input
                  type="date"
                  value={formData.data}
                  onChange={(e) => handleInputChange('data', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Valor *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => handleInputChange('valor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0,00"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Tag className="h-4 w-4 inline mr-1" />
                  Tipo *
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => handleInputChange('tipo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="despesa">Despesa</option>
                  <option value="receita">Receita</option>
                  <option value="transferencia">Transferência</option>
                  <option value="investimento">Investimento</option>
                </select>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="h-4 w-4 inline mr-1" />
                Descrição *
              </label>
              <input
                type="text"
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descrição da transação"
                required
              />
            </div>

            {/* Conta e Categoria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Building className="h-4 w-4 inline mr-1" />
                  Conta *
                </label>
                <select
                  value={formData.conta}
                  onChange={(e) => handleInputChange('conta', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Selecione uma conta</option>
                  {contas.map(conta => (
                    <option key={conta.id} value={conta.nome}>
                      {conta.nome} - {conta.banco}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Tag className="h-4 w-4 inline mr-1" />
                  Categoria *
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => handleInputChange('categoria', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map(categoria => (
                    <option key={categoria.id} value={categoria.nome}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contato e Forma de Pagamento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="h-4 w-4 inline mr-1" />
                  Cliente/Fornecedor
                </label>
                <input
                  type="text"
                  value={formData.contato}
                  onChange={(e) => handleInputChange('contato', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nome do cliente ou fornecedor"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CreditCard className="h-4 w-4 inline mr-1" />
                  Forma de Pagamento *
                </label>
                <select
                  value={formData.forma}
                  onChange={(e) => handleInputChange('forma', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Selecione a forma de pagamento</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="PIX">PIX</option>
                  <option value="Transferência">Transferência</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            {/* Campos Opcionais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vencimento
                </label>
                <input
                  type="date"
                  value={formData.vencimento}
                  onChange={(e) => handleInputChange('vencimento', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parcelas
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.parcelas}
                  onChange={(e) => handleInputChange('parcelas', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Situação
                </label>
                <select
                  value={formData.situacao}
                  onChange={(e) => handleInputChange('situacao', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="vencido">Vencido</option>
                </select>
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Observações adicionais..."
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClearForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
              >
                Limpar Formulário
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 rounded-md text-sm font-medium transition-colors flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Transação
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
