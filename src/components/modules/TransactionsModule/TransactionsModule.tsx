import React, { useState } from 'react';
import { 
  Database, 
  Plus, 
  FileText, 
  Search,
  Tag,
  Building,
  Target,
  CreditCard,
  Users
} from 'lucide-react';

// Componentes das abas
import Transacoes from './Transacoes';
import CadastroTransacoes from './CadastroTransacoes';
import Extrato from './Extrato';
import AnaliseDuplicidades from './AnaliseDuplicidades';

interface TransactionsModuleProps {
  data: any[];
  categorias: any[];
  subcategorias: any[];
  centrosCusto: any[];
  metas: any[];
  orcamentos: any[];
  contas: any[];
  cartoes: any[];
  onDataChange: (data: any[]) => void;
  onCategoriaChange: (categorias: any[]) => void;
  onSubcategoriaChange: (subcategorias: any[]) => void;
  onCentroCustoChange: (centrosCusto: any[]) => void;
  onMetaChange: (metas: any[]) => void;
  onOrcamentoChange: (orcamentos: any[]) => void;
  onContaChange: (contas: any[]) => void;
  onCartaoChange: (cartoes: any[]) => void;
}

export default function TransactionsModule({
  data,
  categorias,
  subcategorias,
  centrosCusto,
  metas,
  orcamentos,
  contas,
  cartoes,
  onDataChange,
  onCategoriaChange,
  onSubcategoriaChange,
  onCentroCustoChange,
  onMetaChange,
  onOrcamentoChange,
  onContaChange,
  onCartaoChange
}: TransactionsModuleProps) {
  const [activeSection, setActiveSection] = useState<'transacoes' | 'cadastro' | 'extrato' | 'duplicidades'>('transacoes');

  const sections = [
    {
      id: 'transacoes',
      name: 'Transações',
      icon: Database,
      description: 'Visualize e gerencie todas as suas transações financeiras'
    },
    {
      id: 'cadastro',
      name: 'Cadastro de Transações',
      icon: Plus,
      description: 'Cadastre manualmente novas transações no sistema'
    },
    {
      id: 'extrato',
      name: 'Extrato',
      icon: FileText,
      description: 'Extratos bancários, seleção de bancos, períodos e exportação'
    },
    {
      id: 'duplicidades',
      name: 'Análise de Duplicidades',
      icon: Search,
      description: 'Identifique e gerencie transações duplicadas'
    }
  ];

  return (
    <div className="space-y-6">
      
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Database className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">Transações</h2>
              <p className="text-sm text-gray-500">
                Gerencie suas transações financeiras, cadastre novas entradas e analise duplicidades
              </p>
            </div>
          </div>

          {/* Navegação entre seções */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeSection === section.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {section.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conteúdo das seções */}
      {activeSection === 'transacoes' && (
        <Transacoes 
          data={data}
          categorias={categorias}
          subcategorias={subcategorias}
          centrosCusto={centrosCusto}
          contas={contas}
          cartoes={cartoes}
          onDataChange={onDataChange}
        />
      )}
      
      {activeSection === 'cadastro' && (
        <CadastroTransacoes 
          categorias={categorias}
          subcategorias={subcategorias}
          centrosCusto={centrosCusto}
          contas={contas}
          cartoes={cartoes}
          onDataChange={onDataChange}
        />
      )}
      
      {activeSection === 'extrato' && (
        <Extrato 
          data={data}
          contas={contas}
        />
      )}
      
      {activeSection === 'duplicidades' && (
        <AnaliseDuplicidades 
          data={data}
          onDataChange={onDataChange}
        />
      )}
    </div>
  );
}
