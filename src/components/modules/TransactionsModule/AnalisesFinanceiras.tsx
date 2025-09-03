import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart as PieChartIcon,
  BarChart3,
  LineChart as LineChartIcon,
  Calendar,
  Users,
  Target,
  AlertTriangle,
  Activity,
  Filter,
  CalendarDays,
  CalendarRange,
  CalendarCheck
} from 'lucide-react';

interface AnalisesFinanceirasProps {
  data: any[];
  onDataChange: (data: any[]) => void;
}

// Cores para os gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];

// Função para formatar moeda brasileira
const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
};

// Função para formatar data
const formatarData = (data: string): string => {
  const [ano, mes] = data.split('-');
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${meses[parseInt(mes) - 1]}/${ano}`;
};

// Função para formatar data diária
const formatarDataDiaria = (data: string): string => {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}`;
};

// Função para obter dados agrupados por período
const agruparPorPeriodo = (data: any[], tipoFiltro: string) => {
  const agrupado: { [key: string]: { receitas: number; despesas: number; saldo: number } } = {};
  
  data.forEach(item => {
    // Usar vencimento como data principal, com fallback para data
    let dataItem = item.vencimento || item.data;
    if (!dataItem) return;
    
    // Converter data brasileira (DD/MM/AAAA) para formato ISO se necessário
    let dataProcessada: string;
    if (dataItem.includes('/')) {
      const [dia, mes, ano] = dataItem.split('/');
      dataProcessada = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    } else {
      dataProcessada = dataItem;
    }
    
    // Validar se a data é válida
    if (!dataProcessada || dataProcessada === 'undefined' || dataProcessada.includes('undefined')) {
      return;
    }
    
    const [ano, mes, dia] = dataProcessada.split('-');
    if (!ano || !mes || parseInt(ano) < 2000 || parseInt(ano) > 2030) {
      return;
    }
    
    let chave: string;
    
    switch (tipoFiltro) {
      case 'diario':
        chave = `${ano}-${mes}-${dia}`;
        break;
      case 'mensal':
        chave = `${ano}-${mes}`;
        break;
      case 'anual':
        chave = ano;
        break;
      default:
        chave = `${ano}-${mes}`;
    }
    
    if (!agrupado[chave]) {
      agrupado[chave] = { receitas: 0, despesas: 0, saldo: 0 };
    }
    
    const valor = Math.abs(parseFloat(item.valor) || 0);
    
    if (parseFloat(item.valor) > 0) {
      agrupado[chave].receitas += valor;
    } else {
      agrupado[chave].despesas += valor;
    }
    
    agrupado[chave].saldo = agrupado[chave].receitas - agrupado[chave].despesas;
  });
  
  return Object.entries(agrupado)
    .map(([periodo, dados]) => {
      let label: string;
      switch (tipoFiltro) {
        case 'diario':
          label = formatarDataDiaria(periodo);
          break;
        case 'mensal':
          label = formatarData(periodo);
          break;
        case 'anual':
          label = periodo;
          break;
        default:
          label = formatarData(periodo);
      }
      
      return {
        periodo: label,
        receitas: dados.receitas,
        despesas: dados.despesas,
        saldo: dados.saldo
      };
    })
    .sort((a, b) => {
      // Ordenação específica para cada tipo
      switch (tipoFiltro) {
        case 'diario':
          const [diaA, mesA] = a.periodo.split('/');
          const [diaB, mesB] = b.periodo.split('/');
          return new Date(2024, parseInt(mesA) - 1, parseInt(diaA)).getTime() - 
                 new Date(2024, parseInt(mesB) - 1, parseInt(diaB)).getTime();
        case 'mensal':
          const [mesMensalA, anoA] = a.periodo.split('/');
          const [mesMensalB, anoB] = b.periodo.split('/');
          return new Date(parseInt(anoA), parseInt(mesMensalA) - 1).getTime() - 
                 new Date(parseInt(anoB), parseInt(mesMensalB) - 1).getTime();
        case 'anual':
          return parseInt(a.periodo) - parseInt(b.periodo);
        default:
          return 0;
        }
      });
};

// Função para calcular fluxo de caixa acumulado
const calcularFluxoCaixa = (dadosPeriodo: any[]) => {
  let saldoAcumulado = 0;
  return dadosPeriodo.map(item => {
    saldoAcumulado += item.saldo;
    return {
      ...item,
      saldoAcumulado
    };
  });
};

// Função para agrupar por categoria
const agruparPorCategoria = (data: any[]) => {
  const agrupado: { [key: string]: number } = {};
  
  data.forEach(item => {
    if (parseFloat(item.valor) < 0) { // Apenas despesas
      const categoria = item.categoria || item.descricao || 'Sem categoria';
      agrupado[categoria] = (agrupado[categoria] || 0) + Math.abs(parseFloat(item.valor) || 0);
    }
  });
  
  return Object.entries(agrupado)
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 8); // Top 8 categorias
};

// Função para agrupar por cliente/contato
const agruparPorCliente = (data: any[]) => {
  const agrupado: { [key: string]: number } = {};
  
  data.forEach(item => {
    if (parseFloat(item.valor) > 0) { // Apenas receitas
      const cliente = item.empresa || item.contato || item.descricao || 'Cliente não identificado';
      agrupado[cliente] = (agrupado[cliente] || 0) + parseFloat(item.valor) || 0;
    }
  });
  
  return Object.entries(agrupado)
    .map(([cliente, valor]) => ({ cliente, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10); // Top 10 clientes
};

// Função para calcular DRE
const calcularDRE = (data: any[]) => {
  const receitaBruta = data
    .filter(item => parseFloat(item.valor) > 0)
    .reduce((total, item) => total + parseFloat(item.valor) || 0, 0);
  
  const despesas = data
    .filter(item => parseFloat(item.valor) < 0)
    .reduce((total, item) => total + Math.abs(parseFloat(item.valor) || 0), 0);
  
  const lucroLiquido = receitaBruta - despesas;
  
  return [
    { item: 'Receita Bruta', valor: receitaBruta, cor: '#00C49F' },
    { item: 'Despesas', valor: despesas, cor: '#FF8042' },
    { item: 'Lucro Líquido', valor: lucroLiquido, cor: lucroLiquido >= 0 ? '#0088FE' : '#FF6B6B' }
  ];
};

// Função para calcular projeção de caixa
const calcularProjecaoCaixa = (data: any[], tipoFiltro: string) => {
  const hoje = new Date();
  const projecao = [];
  
  let periodos = 6; // Padrão 6 meses
  if (tipoFiltro === 'diario') periodos = 30; // 30 dias
  if (tipoFiltro === 'anual') periodos = 5; // 5 anos
  
  for (let i = 0; i < periodos; i++) {
    let dataProjecao: Date;
    let label: string;
    
    switch (tipoFiltro) {
      case 'diario':
        dataProjecao = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
        label = formatarDataDiaria(dataProjecao.toISOString().split('T')[0]);
        break;
      case 'mensal':
        dataProjecao = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
        label = formatarData(dataProjecao.toISOString().split('T')[0]);
        break;
      case 'anual':
        dataProjecao = new Date(hoje.getFullYear() + i, 0, 1);
        label = dataProjecao.getFullYear().toString();
        break;
      default:
        dataProjecao = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
        label = formatarData(dataProjecao.toISOString().split('T')[0]);
    }
    
    // Calcular dados de projeção baseados em histórico real
    const dadosHistorico = data.filter(item => {
      const dataItem = item.vencimento || item.data;
      if (!dataItem) return false;
      
      // Converter data brasileira se necessário
      let dataProcessada: string;
      if (dataItem.includes('/')) {
        const [dia, mes, ano] = dataItem.split('/');
        dataProcessada = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      } else {
        dataProcessada = dataItem;
      }
      
      if (!dataProcessada || dataProcessada === 'undefined' || dataProcessada.includes('undefined')) {
        return false;
      }
      
      return true;
    });
    
    // Calcular médias baseadas em dados reais
    const receitasReais = dadosHistorico
      .filter(item => parseFloat(item.valor) > 0)
      .map(item => parseFloat(item.valor) || 0);
    
    const despesasReais = dadosHistorico
      .filter(item => parseFloat(item.valor) < 0)
      .map(item => Math.abs(parseFloat(item.valor) || 0));
    
    const mediaReceitas = receitasReais.length > 0 ? 
      receitasReais.reduce((a, b) => a + b, 0) / receitasReais.length : 0;
    
    const mediaDespesas = despesasReais.length > 0 ? 
      despesasReais.reduce((a, b) => a + b, 0) / despesasReais.length : 0;
    
    // Aplicar variação sazonal baseada no mês
    const mes = dataProjecao.getMonth();
    const variacaoSazonal = 1 + (Math.sin(mes * Math.PI / 6) * 0.2); // Variação de ±20%
    
    const receitas = mediaReceitas * variacaoSazonal;
    const despesas = mediaDespesas * variacaoSazonal;
    const saldo = receitas - despesas;
    
    projecao.push({
      periodo: label,
      receitas,
      despesas,
      saldo
    });
  }
  
  return projecao;
};

export default function AnalisesFinanceiras({ data, onDataChange }: AnalisesFinanceirasProps) {
  const [activeTab, setActiveTab] = useState('receita-despesa');
  const [tipoFiltro, setTipoFiltro] = useState<'diario' | 'mensal' | 'anual'>('mensal');

  // Calcular dados para os gráficos baseado no filtro
  const dadosPeriodo = useMemo(() => agruparPorPeriodo(data, tipoFiltro), [data, tipoFiltro]);
  const fluxoCaixa = useMemo(() => calcularFluxoCaixa(dadosPeriodo), [dadosPeriodo]);
  const categoriasDespesa = useMemo(() => agruparPorCategoria(data), [data]);
  const receitasPorCliente = useMemo(() => agruparPorCliente(data), [data]);
  const dre = useMemo(() => calcularDRE(data), [data]);
  const projecaoCaixa = useMemo(() => calcularProjecaoCaixa(data, tipoFiltro), [data, tipoFiltro]);

  // Métricas principais
  const metricas = useMemo(() => {
    const receitaTotal = data
      .filter(item => parseFloat(item.valor) > 0)
      .reduce((total, item) => total + parseFloat(item.valor) || 0, 0);
    
    const despesaTotal = data
      .filter(item => parseFloat(item.valor) < 0)
      .reduce((total, item) => total + Math.abs(parseFloat(item.valor) || 0), 0);
    
    const lucroTotal = receitaTotal - despesaTotal;
    const margemLucro = receitaTotal > 0 ? (lucroTotal / receitaTotal) * 100 : 0;
    
    return {
      receitaTotal,
      despesaTotal,
      lucroTotal,
      margemLucro
    };
  }, [data]);

  const tabs = [
    { id: 'receita-despesa', name: 'Receita x Despesa', icon: BarChart3 },
    { id: 'fluxo-caixa', name: 'Fluxo de Caixa', icon: LineChartIcon },
    { id: 'categorias', name: 'Categorias de Despesa', icon: PieChartIcon },
    { id: 'clientes', name: 'Receitas por Cliente', icon: Users },
    { id: 'evolucao', name: 'Evolução de Receita', icon: TrendingUp },
    { id: 'dre', name: 'DRE', icon: Target },
    { id: 'projecao', name: 'Projeção de Caixa', icon: Calendar }
  ];

  const filtros = [
    { 
      id: 'diario', 
      name: 'Diário', 
      icon: CalendarDays,
      description: 'Análise diária dentro do mês atual'
    },
    { 
      id: 'mensal', 
      name: 'Mensal', 
      icon: CalendarRange,
      description: 'Análise mensal dos últimos 12 meses'
    },
    { 
      id: 'anual', 
      name: 'Anual', 
      icon: CalendarCheck,
      description: 'Análise anual dos últimos 5 anos'
    }
  ];

  const renderGrafico = () => {
    switch (activeTab) {
      case 'receita-despesa':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={dadosPeriodo}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis tickFormatter={(value) => formatarMoeda(value)} />
              <Tooltip 
                formatter={(value: number) => [formatarMoeda(value), '']}
                labelFormatter={(label) => `Período: ${label}`}
              />
              <Legend />
              <Bar dataKey="receitas" fill="#00C49F" name="Receitas" />
              <Bar dataKey="despesas" fill="#FF8042" name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'fluxo-caixa':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={fluxoCaixa}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis tickFormatter={(value) => formatarMoeda(value)} />
              <Tooltip 
                formatter={(value: number) => [formatarMoeda(value), '']}
                labelFormatter={(label) => `Período: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="saldoAcumulado" 
                stroke="#0088FE" 
                strokeWidth={3}
                name="Saldo Acumulado"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'categorias':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={categoriasDespesa}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ categoria, percent }) => `${categoria} ${(percent * 100).toFixed(0)}%`}
                outerRadius={150}
                fill="#8884d8"
                dataKey="valor"
              >
                {categoriasDespesa.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [formatarMoeda(value), 'Valor']} />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'clientes':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={receitasPorCliente} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => formatarMoeda(value)} />
              <YAxis dataKey="cliente" type="category" width={120} />
              <Tooltip 
                formatter={(value: number) => [formatarMoeda(value), 'Receita']}
                labelFormatter={(label) => `Cliente: ${label}`}
              />
              <Bar dataKey="valor" fill="#00C49F" name="Receita" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'evolucao':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={dadosPeriodo}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis tickFormatter={(value) => formatarMoeda(value)} />
              <Tooltip 
                formatter={(value: number) => [formatarMoeda(value), 'Receita']}
                labelFormatter={(label) => `Período: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="receitas" 
                stroke="#00C49F" 
                strokeWidth={3}
                name="Receita"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'dre':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={dre}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="item" />
              <YAxis tickFormatter={(value) => formatarMoeda(value)} />
              <Tooltip 
                formatter={(value: number) => [formatarMoeda(value), 'Valor']}
                labelFormatter={(label) => `Item: ${label}`}
              />
              <Bar dataKey="valor" fill="#8884d8" name="Valor" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'projecao':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={projecaoCaixa}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis tickFormatter={(value) => formatarMoeda(value)} />
              <Tooltip 
                formatter={(value: number) => [formatarMoeda(value), 'Saldo']}
                labelFormatter={(label) => `Período: ${label}`}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="saldo" 
                stroke="#0088FE" 
                fill="#0088FE" 
                fillOpacity={0.3}
                name="Saldo Projetado"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">Dashboard Financeiro Empresarial</h2>
              <p className="text-sm text-gray-500">
                Análises estratégicas e métricas para tomada de decisões empresariais
              </p>
            </div>
          </div>

          {/* Filtros de Período */}
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <Filter className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Filtros de Análise</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filtros.map((filtro) => {
                const Icon = filtro.icon;
                return (
                  <button
                    key={filtro.id}
                    onClick={() => setTipoFiltro(filtro.id as any)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      tipoFiltro === filtro.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <Icon className={`h-6 w-6 mr-2 ${tipoFiltro === filtro.id ? 'text-blue-600' : 'text-gray-500'}`} />
                      <span className="font-semibold">{filtro.name}</span>
                    </div>
                    <p className="text-sm text-gray-600">{filtro.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Receita Total</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatarMoeda(metricas.receitaTotal)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center">
                <TrendingDown className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-600">Despesa Total</p>
                  <p className="text-2xl font-bold text-red-900">
                    {formatarMoeda(metricas.despesaTotal)}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${metricas.lucroTotal >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center">
                <DollarSign className={`h-8 w-8 ${metricas.lucroTotal >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
                <div className="ml-3">
                  <p className={`text-sm font-medium ${metricas.lucroTotal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    Lucro Total
                  </p>
                  <p className={`text-2xl font-bold ${metricas.lucroTotal >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                    {formatarMoeda(metricas.lucroTotal)}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${metricas.margemLucro >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center">
                <Target className={`h-8 w-8 ${metricas.margemLucro >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                <div className="ml-3">
                  <p className={`text-sm font-medium ${metricas.margemLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Margem de Lucro
                  </p>
                  <p className={`text-2xl font-bold ${metricas.margemLucro >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                    {metricas.margemLucro.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navegação entre gráficos */}
          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gráfico Ativo */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {tabs.find(tab => tab.id === activeTab)?.name}
            </h3>
            <div className="flex items-center text-sm text-gray-500">
              <Filter className="h-4 w-4 mr-1" />
              Período: {filtros.find(f => f.id === tipoFiltro)?.name}
            </div>
          </div>
        </div>
        
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <AlertTriangle className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">Nenhum dado disponível</p>
            <p className="text-sm">Cadastre transações para visualizar as análises</p>
          </div>
        ) : (
          renderGrafico()
        )}
      </div>

      {/* Resumo dos Dados */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo dos Dados</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total de Transações</p>
            <p className="text-2xl font-bold text-gray-900">{data.length}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Período Analisado</p>
            <p className="text-2xl font-bold text-gray-900">{dadosPeriodo.length} {tipoFiltro === 'diario' ? 'dias' : tipoFiltro === 'mensal' ? 'meses' : 'anos'}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Filtro Ativo</p>
            <p className="text-2xl font-bold text-gray-900">{filtros.find(f => f.id === tipoFiltro)?.name}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Última Atualização</p>
            <p className="text-2xl font-bold text-gray-900">
              {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
