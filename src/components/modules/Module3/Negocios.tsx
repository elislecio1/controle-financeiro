import React, { useState } from 'react'
import { Building, Users, FileText, Settings, TrendingUp, DollarSign } from 'lucide-react'

interface NegociosProps {
  regimeContabil: 'caixa' | 'competencia'
  onRegimeChange: (regime: 'caixa' | 'competencia') => void
}

export default function Negocios({ regimeContabil, onRegimeChange }: NegociosProps) {
  const [showMultiUser, setShowMultiUser] = useState(false)
  const [showMobileApp, setShowMobileApp] = useState(false)
  const [showDataImport, setShowDataImport] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Funcionalidades para Negócios</h2>
        <Building className="h-8 w-8 text-blue-600" />
      </div>

      {/* Regime Contábil */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Regime Contábil
        </h3>
        <div className="space-y-4">
          <p className="text-gray-600">
            Escolha o regime contábil para visualização dos relatórios financeiros:
          </p>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="regime"
                value="caixa"
                checked={regimeContabil === 'caixa'}
                onChange={(e) => onRegimeChange(e.target.value as 'caixa' | 'competencia')}
                className="mr-2"
              />
              <span className="text-sm font-medium">Regime de Caixa</span>
              <span className="text-xs text-gray-500 ml-2">
                (Reconhece receitas e despesas quando há movimentação financeira)
              </span>
            </label>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="regime"
                value="competencia"
                checked={regimeContabil === 'competencia'}
                onChange={(e) => onRegimeChange(e.target.value as 'caixa' | 'competencia')}
                className="mr-2"
              />
              <span className="text-sm font-medium">Regime de Competência</span>
              <span className="text-xs text-gray-500 ml-2">
                (Reconhece receitas e despesas quando ocorrem, independente do pagamento)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Recursos Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Múltiplos Usuários */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Múltiplos Usuários</h3>
            <Users className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-gray-600 mb-4">
            Conceda acesso a outros usuários com diferentes níveis de permissão.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Sócio - Acesso completo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Contador - Relatórios e análises</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Funcionário - Lançamentos básicos</span>
            </div>
          </div>
          <button
            onClick={() => setShowMultiUser(true)}
            className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Configurar Usuários
          </button>
        </div>

        {/* Aplicativo Móvel */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Aplicativo Móvel</h3>
            <TrendingUp className="h-6 w-6 text-green-500" />
          </div>
          <p className="text-gray-600 mb-4">
            Acesso completo através de aplicativo para smartphones.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Registro de despesas em tempo real</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Anexar comprovantes via fotos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Sincronização automática</span>
            </div>
          </div>
          <button
            onClick={() => setShowMobileApp(true)}
            className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Baixar App
          </button>
        </div>

        {/* Importação de Dados */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Importação de Dados</h3>
            <FileText className="h-6 w-6 text-purple-500" />
          </div>
          <p className="text-gray-600 mb-4">
            Ferramenta para migrar dados de outros sistemas ou planilhas.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Importação de planilhas Excel</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Arquivos CSV e TXT</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Mapeamento de campos</span>
            </div>
          </div>
          <button
            onClick={() => setShowDataImport(true)}
            className="mt-4 w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
          >
            Importar Dados
          </button>
        </div>
      </div>

      {/* Estatísticas do Negócio */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita Mensal</p>
              <p className="text-2xl font-bold text-gray-900">R$ 0,00</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Despesa Mensal</p>
              <p className="text-2xl font-bold text-gray-900">R$ 0,00</p>
            </div>
            <DollarSign className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Lucro Mensal</p>
              <p className="text-2xl font-bold text-gray-900">R$ 0,00</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Margem de Lucro</p>
              <p className="text-2xl font-bold text-gray-900">0%</p>
            </div>
            <Building className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Modais */}
      {showMultiUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Configurar Usuários</h3>
            <p className="text-gray-600 mb-4">
              Funcionalidade em desenvolvimento. Em breve você poderá gerenciar usuários e permissões.
            </p>
            <button
              onClick={() => setShowMultiUser(false)}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {showMobileApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Aplicativo Móvel</h3>
            <p className="text-gray-600 mb-4">
              O aplicativo móvel está em desenvolvimento. Em breve estará disponível nas lojas de aplicativos.
            </p>
            <button
              onClick={() => setShowMobileApp(false)}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {showDataImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Importação de Dados</h3>
            <p className="text-gray-600 mb-4">
              Funcionalidade em desenvolvimento. Em breve você poderá importar dados de outros sistemas.
            </p>
            <button
              onClick={() => setShowDataImport(false)}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 