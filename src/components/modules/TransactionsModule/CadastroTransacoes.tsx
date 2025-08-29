import React, { useState, useMemo, useEffect } from 'react';
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
  Tag,
  Target,
  MapPin,
  Briefcase,
  Hash,
  Clock
} from 'lucide-react';
import { supabaseService } from '../../../services/supabase';
import { parsearValorBrasileiro, parsearDataBrasileira, formatarData } from '../../../utils/formatters';
import ContatoSelector from '../../ContatoSelector';

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
    // Campos obrigatórios
    data: '',
    vencimento: '',
    valor: '',
    descricao: '',
    conta: '',
    categoria: '',
    forma: '',
    tipo: 'despesa' as 'receita' | 'despesa' | 'transferencia' | 'investimento',
    
    // Campos opcionais
    subcategoria: '',
    contato: '',
    centroCusto: '',
    projeto: '',
    numeroDocumento: '',
    observacoes: '',
    dataCompetencia: '',
    cartao: '',
    contaTransferencia: '',
    parcelas: '1',
    situacao: 'pendente',
    tags: [] as string[]
  });

  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Filtrar subcategorias baseadas na categoria selecionada
  const subcategoriasFiltradas = useMemo(() => {
    if (!formData.categoria) return [];
    const categoriaSelecionada = categorias.find(cat => cat.nome === formData.categoria);
    if (!categoriaSelecionada) return [];
    return subcategorias.filter(sub => sub.categoriaId === categoriaSelecionada.id);
  }, [formData.categoria, categorias, subcategorias]);

  // Filtrar contas baseadas no tipo de transação
  const contasFiltradas = useMemo(() => {
    if (formData.tipo === 'transferencia') {
      return contas.filter(conta => conta.nome !== formData.conta);
    }
    return contas;
  }, [formData.tipo, formData.conta, contas]);

  // Filtrar categorias baseadas no tipo de transação
  const categoriasFiltradas = useMemo(() => {
    return categorias.filter(cat => 
      cat.tipo === formData.tipo || cat.tipo === 'ambos'
    );
  }, [formData.tipo, categorias]);

  // Função para formatar valor monetário brasileiro
  const formatarValorBrasileiro = (valor: string): string => {
    let valorLimpo = valor.replace(/[R$\s]/g, '');
    
    if (!valorLimpo) return '';
    
    const isNegativo = valorLimpo.startsWith('-');
    if (isNegativo) {
      valorLimpo = valorLimpo.substring(1);
    }
    
    if (valorLimpo.includes(',')) {
      valorLimpo = valorLimpo.replace(/\./g, '').replace(',', '.');
    } else if (valorLimpo.includes('.')) {
      const partes = valorLimpo.split('.');
      if (partes.length === 2 && partes[1].length <= 2) {
        valorLimpo = valorLimpo;
      } else {
        valorLimpo = valorLimpo.replace(/\./g, '');
      }
    }
    
    const numero = parseFloat(valorLimpo);
    if (isNaN(numero)) return '';
    
    const valorFinal = isNegativo ? -numero : numero;
    
    return valorFinal.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Função para formatar valor automaticamente durante a digitação
  const formatarValorDuranteDigitacao = (valor: string): string => {
    const numeros = valor.replace(/\D/g, '');
    
    if (numeros === '') return '';
    
    const valorNumerico = parseInt(numeros) / 100;
    
    return valorNumerico.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Função para lidar com mudança no campo valor
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    if (!inputValue.trim()) {
      handleInputChange('valor', '');
      return;
    }
    
    const valorFormatado = formatarValorDuranteDigitacao(inputValue);
    handleInputChange('valor', valorFormatado);
  };

  // Função para formatar data no input - VERSÃO CORRIGIDA
  const handleDateChange = (field: string, value: string) => {
    // Remove tudo que não é número
    let numericValue = value.replace(/\D/g, '');
    
    // Limita a 8 dígitos (DDMMAAAA)
    if (numericValue.length > 8) {
      numericValue = numericValue.substring(0, 8);
    }
    
    let formattedValue = '';
    
    // Aplica formatação progressiva
    if (numericValue.length >= 1) {
      formattedValue = numericValue.substring(0, 1);
    }
    if (numericValue.length >= 2) {
      formattedValue = numericValue.substring(0, 2);
    }
    if (numericValue.length >= 3) {
      formattedValue = numericValue.substring(0, 2) + '/' + numericValue.substring(2, 3);
    }
    if (numericValue.length >= 4) {
      formattedValue = numericValue.substring(0, 2) + '/' + numericValue.substring(2, 4);
    }
    if (numericValue.length >= 5) {
      formattedValue = numericValue.substring(0, 2) + '/' + numericValue.substring(2, 4) + '/' + numericValue.substring(4, 5);
    }
    if (numericValue.length >= 6) {
      formattedValue = numericValue.substring(0, 2) + '/' + numericValue.substring(2, 4) + '/' + numericValue.substring(4, 6);
    }
    if (numericValue.length >= 7) {
      formattedValue = numericValue.substring(0, 2) + '/' + numericValue.substring(2, 4) + '/' + numericValue.substring(4, 7);
    }
    if (numericValue.length >= 8) {
      formattedValue = numericValue.substring(0, 2) + '/' + numericValue.substring(2, 4) + '/' + numericValue.substring(4, 8);
    }
    
    // Valida se a data é válida
    if (formattedValue.length === 10) {
      const [dia, mes, ano] = formattedValue.split('/');
      const diaNum = parseInt(dia);
      const mesNum = parseInt(mes);
      const anoNum = parseInt(ano);
      
      // Validações básicas
      if (diaNum < 1 || diaNum > 31 || mesNum < 1 || mesNum > 12 || anoNum < 1900 || anoNum > 2100) {
        // Se a data é inválida, mantém o valor anterior
        return;
      }
    }
    
    handleInputChange(field, formattedValue);
  };

  // Função para validar campos obrigatórios
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    }
    
    if (!formData.valor.trim()) {
      newErrors.valor = 'Valor é obrigatório';
    }
    
    if (!formData.vencimento.trim()) {
      newErrors.vencimento = 'Data de vencimento é obrigatória';
    }
    
    if (!formData.conta) {
      newErrors.conta = 'Conta é obrigatória';
    }
    
    if (!formData.categoria) {
      newErrors.categoria = 'Categoria é obrigatória';
    }
    
    if (!formData.forma) {
      newErrors.forma = 'Forma de pagamento é obrigatória';
    }
    
    // Validação específica para transferências
    if (formData.tipo === 'transferencia' && !formData.contaTransferencia) {
      newErrors.contaTransferencia = 'Conta de destino é obrigatória para transferências';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpar erro do campo quando usuário começa a digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
    
    // Limpar subcategoria quando categoria muda
    if (field === 'categoria') {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        subcategoria: ''
      }));
    }
    
    // Limpar conta de transferência quando tipo muda
    if (field === 'tipo') {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        contaTransferencia: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Obter data atual para o campo data se não foi preenchida
      const dataAtual = formData.data || new Date().toLocaleDateString('pt-BR');
      
      const novaTransacao = {
        data: dataAtual,
        valor: parsearValorBrasileiro(formData.valor),
        descricao: formData.descricao,
        conta: formData.conta,
        categoria: formData.categoria,
        subcategoria: formData.subcategoria || undefined,
        contato: formData.contato || undefined,
        centro: formData.centroCusto || undefined,
        projeto: formData.projeto || undefined,
        forma: formData.forma,
        numeroDocumento: formData.numeroDocumento || undefined,
        observacoes: formData.observacoes || undefined,
        dataCompetencia: formData.dataCompetencia || undefined,
        cartao: formData.cartao || undefined,
        contaTransferencia: formData.contaTransferencia || undefined,
        tipo: formData.tipo,
        vencimento: formData.vencimento,
        parcelas: parseInt(formData.parcelas),
        tags: formData.tags.length > 0 ? formData.tags : undefined
      };

      console.log('📤 Enviando transação:', novaTransacao);

      const result = await supabaseService.saveTransaction(novaTransacao);

      if (result && result.success && result.data) {
        console.log('✅ Transação salva com sucesso:', result.data);
        
        // Limpar formulário
        setFormData({
          data: '',
          vencimento: '',
          valor: '',
          descricao: '',
          conta: '',
          categoria: '',
          forma: '',
          tipo: 'despesa',
          subcategoria: '',
          contato: '',
          centroCusto: '',
          projeto: '',
          numeroDocumento: '',
          observacoes: '',
          dataCompetencia: '',
          cartao: '',
          contaTransferencia: '',
          parcelas: '1',
          situacao: 'pendente',
          tags: []
        });
        
        setShowForm(false);
        setErrors({});
        alert('Transação cadastrada com sucesso! Para ver a transação na lista, navegue para a aba "Transações".');
      } else {
        console.error('❌ Erro ao salvar transação:', result?.message || 'Erro desconhecido');
        alert(`Erro ao cadastrar: ${result?.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('❌ Erro ao cadastrar transação:', error);
      alert(`Erro ao cadastrar transação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearForm = () => {
    setFormData({
      data: '',
      vencimento: '',
      valor: '',
      descricao: '',
      conta: '',
      categoria: '',
      forma: '',
      tipo: 'despesa',
      subcategoria: '',
      contato: '',
      centroCusto: '',
      projeto: '',
      numeroDocumento: '',
      observacoes: '',
      dataCompetencia: '',
      cartao: '',
      contaTransferencia: '',
      parcelas: '1',
      situacao: 'pendente',
      tags: []
    });
    setErrors({});
  };

  // Definir data atual quando o formulário é aberto
  useEffect(() => {
    if (showForm && !formData.data) {
      const hoje = new Date().toLocaleDateString('pt-BR');
      setFormData(prev => ({ ...prev, data: hoje }));
    }
  }, [showForm]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Plus className="h-5 w-5 text-gray-600" />
            + Cadastro de Transações
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
            {/* Primeira linha - Tipo, Data e Vencimento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Data *
                </label>
                <input
                  type="text"
                  value={formData.data}
                  onChange={(e) => handleDateChange('data', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.data ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                  required
                />
                {errors.data && <p className="mt-1 text-xs text-red-600">{errors.data}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Vencimento *
                </label>
                <input
                  type="text"
                  value={formData.vencimento}
                  onChange={(e) => handleDateChange('vencimento', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.vencimento ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                  required
                />
                {errors.vencimento && <p className="mt-1 text-xs text-red-600">{errors.vencimento}</p>}
              </div>
            </div>

            {/* Segunda linha - Valor e Descrição */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Valor *
                </label>
                <input
                  type="text"
                  value={formData.valor}
                  onChange={handleValorChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.valor ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0,00"
                  required
                />
                {errors.valor && <p className="mt-1 text-xs text-red-600">{errors.valor}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Descrição *
                </label>
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.descricao ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Descrição da transação"
                  required
                />
                {errors.descricao && <p className="mt-1 text-xs text-red-600">{errors.descricao}</p>}
              </div>
            </div>

            {/* Terceira linha - Conta e Forma de Pagamento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Building className="h-4 w-4 inline mr-1" />
                  Conta *
                </label>
                <select
                  value={formData.conta}
                  onChange={(e) => handleInputChange('conta', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.conta ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Selecione uma conta</option>
                  {contas.map(conta => (
                    <option key={conta.id} value={conta.nome}>
                      {conta.nome} - {conta.banco}
                    </option>
                  ))}
                </select>
                {errors.conta && <p className="mt-1 text-xs text-red-600">{errors.conta}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CreditCard className="h-4 w-4 inline mr-1" />
                  Forma de Pagamento *
                </label>
                <select
                  value={formData.forma}
                  onChange={(e) => handleInputChange('forma', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.forma ? 'border-red-500' : 'border-gray-300'
                  }`}
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
                {errors.forma && <p className="mt-1 text-xs text-red-600">{errors.forma}</p>}
              </div>
            </div>

            {/* Quarta linha - Categoria e Subcategoria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Tag className="h-4 w-4 inline mr-1" />
                  Categoria *
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => handleInputChange('categoria', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.categoria ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categoriasFiltradas.map(categoria => (
                    <option key={categoria.id} value={categoria.nome}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>
                {errors.categoria && <p className="mt-1 text-xs text-red-600">{errors.categoria}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Tag className="h-4 w-4 inline mr-1" />
                  Subcategoria
                </label>
                <select
                  value={formData.subcategoria}
                  onChange={(e) => handleInputChange('subcategoria', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!formData.categoria}
                >
                  <option value="">Selecione uma subcategoria (opcional)</option>
                  {subcategoriasFiltradas.map(subcategoria => (
                    <option key={subcategoria.id} value={subcategoria.nome}>
                      {subcategoria.nome}
                    </option>
                  ))}
                </select>
                {formData.categoria && subcategoriasFiltradas.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Nenhuma subcategoria disponível para esta categoria
                  </p>
                )}
              </div>
            </div>

            {/* Quinta linha - Centro de Custo e Projeto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Target className="h-4 w-4 inline mr-1" />
                  Centro de Custo
                </label>
                <select
                  value={formData.centroCusto}
                  onChange={(e) => handleInputChange('centroCusto', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione um centro de custo</option>
                  {centrosCusto.map(centro => (
                    <option key={centro.id} value={centro.nome}>
                      {centro.nome} ({centro.tipo})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Briefcase className="h-4 w-4 inline mr-1" />
                  Projeto
                </label>
                <input
                  type="text"
                  value={formData.projeto}
                  onChange={(e) => handleInputChange('projeto', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nome do projeto"
                />
              </div>
            </div>

            {/* Sexta linha - Contato e Número do Documento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="h-4 w-4 inline mr-1" />
                  Cliente/Fornecedor
                </label>
                <ContatoSelector
                  value={formData.contato}
                  onChange={(contato) => handleInputChange('contato', contato)}
                  placeholder="Nome do cliente ou fornecedor"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Hash className="h-4 w-4 inline mr-1" />
                  Número do Documento
                </label>
                <input
                  type="text"
                  value={formData.numeroDocumento}
                  onChange={(e) => handleInputChange('numeroDocumento', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Número da nota fiscal, recibo, etc."
                />
              </div>
            </div>

            {/* Sétima linha - Conta de Transferência (se aplicável) */}
            {formData.tipo === 'transferencia' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Conta de Destino *
                </label>
                <select
                  value={formData.contaTransferencia}
                  onChange={(e) => handleInputChange('contaTransferencia', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.contaTransferencia ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Selecione a conta de destino</option>
                  {contasFiltradas.map(conta => (
                    <option key={conta.id} value={conta.nome}>
                      {conta.nome} - {conta.banco}
                    </option>
                  ))}
                </select>
                {errors.contaTransferencia && <p className="mt-1 text-xs text-red-600">{errors.contaTransferencia}</p>}
              </div>
            )}

            {/* Oitava linha - Data de Competência e Cartão */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Data de Competência
                </label>
                <input
                  type="text"
                  value={formData.dataCompetencia}
                  onChange={(e) => handleDateChange('dataCompetencia', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CreditCard className="h-4 w-4 inline mr-1" />
                  Cartão
                </label>
                <select
                  value={formData.cartao}
                  onChange={(e) => handleInputChange('cartao', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione um cartão</option>
                  {cartoes.map(cartao => (
                    <option key={cartao.id} value={cartao.nome}>
                      {cartao.nome} - {cartao.banco}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Nona linha - Parcelas e Situação */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
