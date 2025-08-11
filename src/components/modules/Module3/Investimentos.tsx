import React, { useState } from 'react'
import { TrendingUp, Plus, Edit, Trash2, DollarSign, PieChart, BarChart3 } from 'lucide-react'
import { Investimento } from '../../../types'

interface InvestimentosProps {
  investimentos: Investimento[]
  onInvestimentoChange: (investimentos: Investimento[]) => void
}

export default function Investimentos({ investimentos, onInvestimentoChange }: InvestimentosProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingInvestimento, setEditingInvestimento] = useState<Investimento | null>(null)
  const [investimentoForm, setInvestimentoForm] = useState({
    nome: '',
    tipo: 'acao' as 'acao' | 'fiis' | 'etfs' | 'cdb' | 'lci' | 'lca' | 'poupanca' | 'outros',
    valor: '',
    quantidade: '',
    precoMedio: '',
    dataCompra: '',
    instituicao: '',
    observacoes: ''
  })

  const handleSaveInvestimento = () => {
    if (!investimentoForm.nome.trim() || !investimentoForm.valor) return

    const valor = parseFloat(investimentoForm.valor.replace(/[^\d,]/g, '').replace(',', '.'))
    const quantidade = parseFloat(investimentoForm.quantidade.replace(/[^\d,]/g, '').replace(',', '.')) || 0
    const precoMedio = parseFloat(investimentoForm.precoMedio.replace(/[^\d,]/g, '').replace(',', '.')) || 0

    if (editingInvestimento) {
      const updatedInvestimentos = investimentos.map(inv =>
        inv.id === editingInvestimento.id
          ? { ...inv, ...investimentoForm, valor, quantidade, precoMedio }
          : inv
      )
      onInvestimentoChange(updatedInvestimentos)
      setEditingInvestimento(null)
    } else {
      const newInvestimento: Investimento = {
        id: Date.now().toString(),
        ...investimentoForm,
        valor,
        quantidade,
        precoMedio,
        ativo: true,
        dataCriacao: new Date().toISOString()
      }
      onInvestimentoChange([...investimentos, newInvestimento])
    }

    setInvestimentoForm({
      nome: '',
      tipo: 'acao',
      valor: '',
      quantidade: '',
      precoMedio: '',
      dataCompra: '',
      instituicao: '',
      observacoes: ''
    })
    setShowForm(false)
  }

  const handleEdit = (investimento: Investimento) => {
    setEditingInvestimento(investimento)
    setInvestimentoForm({
      nome: investimento.nome,
      tipo: investimento.tipo as 'acao' | 'fiis' | 'etfs' | 'cdb' | 'lci' | 'lca' | 'poupanca' | 'outros',
      valor: investimento.valor.toString(),
      quantidade: investimento.quantidade.toString(),
      precoMedio: investimento.precoMedio.toString(),
      dataCompra: investimento.dataCompra || '',
      instituicao: investimento.instituicao || '',
      observacoes: investimento.observacoes || ''
    })
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    const updatedInvestimentos = investimentos.filter(inv => inv.id !== id)
    onInvestimentoChange(updatedInvestimentos)
  }

  const getTipoLabel = (tipo: string) => {
    const tipos = {
      acao: 'Ação',
      fiis: 'FIIs',
      etfs: 'ETFs',
      cdb: 'CDB',
      lci: 'LCI',
      lca: 'LCA',
      poupanca: 'Poupança',
      outros: 'Outros'
    }
    return tipos[tipo as keyof typeof tipos] || tipo
  }

  const totalInvestido = investimentos.reduce((sum, inv) => sum + inv.valor, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Investimentos</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Investimento
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Investido</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {totalInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{investimentos.length}</p>
            </div>
            <PieChart className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rentabilidade</p>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            {editingInvestimento ? 'Editar Investimento' : 'Novo Investimento'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Ativo *
              </label>
              <input
                type="text"
                value={investimentoForm.nome}
                onChange={(e) => setInvestimentoForm({ ...investimentoForm, nome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: PETR4, ITUB4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Investimento *
              </label>
              <select
                value={investimentoForm.tipo}
                onChange={(e) => setInvestimentoForm({ ...investimentoForm, tipo: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="acao">Ação</option>
                <option value="fiis">FIIs</option>
                <option value="etfs">ETFs</option>
                <option value="cdb">CDB</option>
                <option value="lci">LCI</option>
                <option value="lca">LCA</option>
                <option value="poupanca">Poupança</option>
                <option value="outros">Outros</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor Investido *
              </label>
              <input
                type="text"
                value={investimentoForm.valor}
                onChange={(e) => setInvestimentoForm({ ...investimentoForm, valor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="R$ 0,00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantidade
              </label>
              <input
                type="text"
                value={investimentoForm.quantidade}
                onChange={(e) => setInvestimentoForm({ ...investimentoForm, quantidade: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço Médio
              </label>
              <input
                type="text"
                value={investimentoForm.precoMedio}
                onChange={(e) => setInvestimentoForm({ ...investimentoForm, precoMedio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="R$ 0,00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data da Compra
              </label>
              <input
                type="date"
                value={investimentoForm.dataCompra}
                onChange={(e) => setInvestimentoForm({ ...investimentoForm, dataCompra: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instituição
              </label>
              <input
                type="text"
                value={investimentoForm.instituicao}
                onChange={(e) => setInvestimentoForm({ ...investimentoForm, instituicao: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: XP Investimentos"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                value={investimentoForm.observacoes}
                onChange={(e) => setInvestimentoForm({ ...investimentoForm, observacoes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Observações sobre o investimento..."
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSaveInvestimento}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {editingInvestimento ? 'Atualizar' : 'Salvar'}
            </button>
            <button
              onClick={() => {
                setShowForm(false)
                setEditingInvestimento(null)
                setInvestimentoForm({
                  nome: '',
                  tipo: 'acao',
                  valor: '',
                  quantidade: '',
                  precoMedio: '',
                  dataCompra: '',
                  instituicao: '',
                  observacoes: ''
                })
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de Investimentos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Carteira de Investimentos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ativo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço Médio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instituição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {investimentos.map((investimento) => (
                <tr key={investimento.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{investimento.nome}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {getTipoLabel(investimento.tipo)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R$ {investimento.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {investimento.quantidade > 0 ? investimento.quantidade : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {investimento.precoMedio > 0 
                      ? `R$ ${investimento.precoMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : '-'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {investimento.instituicao || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(investimento)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(investimento.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 