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

// Função para converter data brasileira para ISO
const converterDataBrasileira = (data: string): string => {
  if (data.includes('/')) {
    const [dia, mes, ano] = data.split('/');
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }
  return data;
};

// Função para validar se uma data está dentro de um período
const dataEstaNoPeriodo = (dataItem: string, dataInicio: Date, dataFim: Date): boolean => {
  try {
    const dataProcessada = converterDataBrasileira(dataItem);
    const dataTransacao = new Date(dataProcessada);
    return dataTransacao >= dataInicio && dataTransacao <= dataFim;
  } catch {
    return false;
  }
};

// Função para calcular período baseado no filtro
const calcularPeriodo = (tipoFiltro: string) => {
  const hoje = new Date();
  let dataInicio: Date;
  let dataFim: Date;
  
  switch (tipoFiltro) {
    case 'diario':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 30);
      dataFim = hoje;
      break;
    case 'mensal':
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 11, 1);
      dataFim = hoje;
      break;
    case 'anual':
      dataInicio = new Date(hoje.getFullYear() - 4, 0, 1);
      dataFim = hoje;
      break;
    default:
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 11, 1);
      dataFim = hoje;
  }
  
  return { dataInicio, dataFim };
};

// Função para agrupar dados por período
const agruparPorPeriodo = (data: any[], tipoFiltro: string) => {
  const { dataInicio, dataFim } = calcularPeriodo(tipoFiltro);
  const agrupado: { [key: string]: { receitas: number; despesas: number; saldo: number } } = {};
  
  data.forEach(item => {
    const dataItem = item.vencimento || item.data;
    if (!dataItem || !dataEstaNoPeriodo(dataItem, dataInicio, dataFim)) return;
    
    const valor = parseFloat(item.valor);
    if (isNaN(valor) || valor === 0) return;
    
    let chave: string;
    const dataProcessada = converterDataBrasileira(dataItem);
    const [ano, mes, dia] = dataProcessada.split('-');
    
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
    
    if (valor > 0) {
      agrupado[chave].receitas += valor;
    } else {
      agrupado[chave].despesas += Math.abs(valor);
    }
    
    agrupado[chave].saldo = agrupado[chave].receitas - agrupado[chave].despesas;
  });
  
  const resultado = Object.entries(agrupado)
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
  
  return resultado;
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
    if (parseFloat(item.valor) < 0) {
      const categoria = item.categoria || 'Sem categoria';
      const valor = Math.abs(parseFloat(item.valor) || 0);
      agrupado[categoria] = (agrupado[categoria] || 0) + valor;
    }
  });
  
  return Object.entries(agrupado)
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 8);
};

// Função para agrupar por cliente/contato
const agruparPorCliente = (data: any[]) => {
  const agrupado: { [key: string]: number } = {};
  
  data.forEach(item => {
    if (parseFloat(item.valor) > 0) {
      const cliente = item.empresa || item.contato || 'Cliente não identificado';
      const valor = parseFloat(item.valor) || 0;
      agrupado[cliente] = (agrupado[cliente] || 0) + valor;
    }
  });
  
  return Object.entries(agrupado)
    .map(([cliente, valor]) => ({ cliente, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);
};

// Função para calcular DRE
const calcularDRE = (data: any[]) => {
  const receitas = data.filter(item => parseFloat(item.valor) > 0);
  const despesas = data.filter(item => parseFloat(item.valor) < 0);
  
  const receitaBruta = receitas.reduce((total, item) => total + (parseFloat(item.valor) || 0), 0);
  const despesasTotal = despesas.reduce((total, item) => total + Math.abs(parseFloat(item.valor) || 0), 0);
  const lucroLiquido = receitaBruta - despesasTotal;
  
  return [
    { item: 'Receita Bruta', valor: receitaBruta, cor: '#00C49F' },
    { item: 'Despesas', valor: despesasTotal, cor: '#FF8042' },
    { item: 'Lucro Líquido', valor: lucroLiquido, cor: lucroLiquido >= 0 ? '#0088FE' : '#FF6B6B' }
  ];
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

  // Métricas principais - CÁLCULO SIMPLES E DIRETO
  const metricas = useMemo(() => {
    const { dataInicio, dataFim } = calcularPeriodo(tipoFiltro);
    
    // Filtrar dados do período
    const dadosFiltrados = data.filter(item => {
      const dataItem = item.vencimento || item.data;
      return dataItem && dataEstaNoPeriodo(dataItem, dataInicio, dataFim);
    });
    
    // Separar receitas e despesas
    const receitas = dadosFiltrados.filter(item => {
      const valor = parseFloat(item.valor);
      return valor > 0 && !isNaN(valor);
    });
    
    const despesas = dadosFiltrados.filter(item => {
      const valor = parseFloat(item.valor);
      return valor < 0 && !isNaN(valor);
    });
    
    // Calcular totais
    const receitaTotal = receitas.reduce((total, item) => total + (parseFloat(item.valor) || 0), 0);
    const despesaTotal = despesas.reduce((total, item) => total + Math.abs(parseFloat(item.valor) || 0), 0);
    const lucroTotal = receitaTotal - despesaTotal;
    const margemLucro = receitaTotal > 0 ? (lucroTotal / receitaTotal) * 100 : 0;
    
    // DEBUG: Mostrar dados para verificação
    console.log('🔍 === DADOS DAS MÉTRICAS ===');
    console.log('🔍 Período:', tipoFiltro);
    console.log('🔍 Data início:', dataInicio.toISOString().split('T')[0]);
    console.log('🔍 Data fim:', dataFim.toISOString().split('T')[0]);
    console.log('🔍 Dados filtrados:', dadosFiltrados.length);
    console.log('🔍 Receitas encontradas:', receitas.length);
    console.log('🔍 Despesas encontradas:', despesas.length);
    console.log('🔍 Receita total:', receitaTotal);
    console.log('🔍 Despesa total:', despesaTotal);
    console.log('🔍 Lucro total:', lucroTotal);
    console.log('🔍 Margem de lucro:', margemLucro);
    
    return {
      receitaTotal,
      despesaTotal,
      lucroTotal,
      margemLucro
    };
  }, [data, tipoFiltro]);

  const tabs = [
    { id: 'receita-despesa', name: 'Receita x Despesa', icon: BarChart3 },
    { id: 'fluxo-caixa', name: 'Fluxo de Caixa', icon: LineChartIcon },
    { id: 'categorias', name: 'Categorias de Despesa', icon: PieChartIcon },
    { id: 'clientes', name: 'Receitas por Cliente', icon: Users },
    { id: 'evolucao', name: 'Evolução de Receita', icon: TrendingUp },
    { id: 'dre', name: 'DRE', icon: Target }
  ];

  const filtros = [
    { 
      id: 'diario', 
      name: 'Diário', 
      icon: CalendarDays,
      description: 'Análise dos últimos 30 dias'
    },
    { 
      id: 'mensal', 
      name: 'Mensal', 
      icon: CalendarRange,
      description: 'Análise dos últimos 12 meses'
    },
    { 
      id: 'anual', 
      name: 'Anual', 
      icon: CalendarCheck,
      description: 'Análise dos últimos 5 anos'
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
                outerRadius={80}
                fill="#8884d8"
                dataKey="valor"
              >
                {categoriasDespesa.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [formatarMoeda(value), '']} />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'clientes':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={receitasPorCliente} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => formatarMoeda(value)} />
              <YAxis dataKey="cliente" type="category" width={150} />
              <Tooltip formatter={(value: number) => [formatarMoeda(value), '']} />
              <Bar dataKey="valor" fill="#00C49F" />
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
                formatter={(value: number) => [formatarMoeda(value), '']}
                labelFormatter={(label) => `Período: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="receitas" 
                stroke="#00C49F" 
                strokeWidth={3}
                name="Receitas"
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
              <Tooltip formatter={(value: number) => [formatarMoeda(value), '']} />
              <Bar dataKey="valor" fill="#8884d8" />
            </BarChart>
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

          {/* Indicador de Período */}
          <div className="mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center text-blue-700">
                <Calendar className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">
                  Período de Análise: <strong>{filtros.find(f => f.id === tipoFiltro)?.name}</strong>
                  {tipoFiltro === 'diario' && ' (últimos 30 dias)'}
                  {tipoFiltro === 'mensal' && ' (últimos 12 meses)'}
                  {tipoFiltro === 'anual' && ' (últimos 5 anos)'}
                </span>
              </div>
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
