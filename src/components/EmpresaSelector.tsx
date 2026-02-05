import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, ChevronDown, Check } from 'lucide-react'
import { useEmpresa } from '../hooks/useEmpresa'

export const EmpresaSelector: React.FC = () => {
  const { empresas, empresaAtual, loading, error, setEmpresaAtual } = useEmpresa()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debug: Log para verificar estado
  useEffect(() => {
    console.log('🔍 EmpresaSelector - Estado:', {
      loading,
      empresasCount: empresas.length,
      empresaAtual: empresaAtual?.nome,
      error
    })
  }, [loading, empresas, empresaAtual, error])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Mostrar sempre que houver empresa atual, mesmo que seja apenas uma
  if (loading) {
    return (
      <div className="flex items-center px-3 py-2 text-sm text-gray-500 bg-gray-50 rounded-md">
        <Building2 className="h-4 w-4 mr-2 animate-pulse" />
        <span>Carregando...</span>
      </div>
    )
  }

  // Se não há empresas, mostrar botão para criar
  if (empresas.length === 0) {
    return (
      <button
        onClick={() => navigate('/empresas')}
        className="flex items-center px-3 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-md border border-orange-200 hover:bg-orange-100 transition-colors"
        title="Criar sua primeira empresa"
      >
        <Building2 className="h-4 w-4 mr-2" />
        <span>Criar Empresa</span>
      </button>
    )
  }

  // Se há apenas 1 empresa, mostrar mas sem dropdown
  if (empresas.length === 1 && empresaAtual) {
    return (
      <div className="flex items-center px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-md border border-gray-200">
        <Building2 className="h-4 w-4 mr-2 text-blue-600" />
        <span className="font-medium">{empresaAtual.nome}</span>
      </div>
    )
  }

  // Selecionar primeira empresa automaticamente se não há empresa atual
  useEffect(() => {
    if (!loading && !empresaAtual && empresas.length > 0) {
      setEmpresaAtual(empresas[0].id).catch(err => {
        console.error('❌ Erro ao selecionar empresa automaticamente:', err)
      })
    }
  }, [loading, empresaAtual, empresas, setEmpresaAtual])

  const handleSelectEmpresa = async (empresaId: string) => {
    if (empresaId === empresaAtual?.id) {
      setIsOpen(false)
      return
    }

    try {
      await setEmpresaAtual(empresaId)
      setIsOpen(false)
      
      // Limpar cache e recarregar página para garantir dados atualizados
      // O cache será limpo automaticamente pelas novas queries com empresa_id diferente
      window.location.reload()
    } catch (error) {
      console.error('❌ Erro ao alternar empresa:', error)
      alert('Erro ao alternar empresa. Tente novamente.')
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        title={empresaAtual?.nome || 'Selecionar empresa'}
      >
        <Building2 className="h-4 w-4 mr-2 text-gray-500" />
        <span className="max-w-[150px] truncate">
          {empresaAtual?.nome || 'Selecionar empresa'}
        </span>
        <ChevronDown className={`h-4 w-4 ml-2 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 border border-gray-200">
          <div className="py-1">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">
              Empresas
            </div>
            {empresas.map((empresa) => (
              <button
                key={empresa.id}
                onClick={() => handleSelectEmpresa(empresa.id)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                  empresa.id === empresaAtual?.id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700'
                }`}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <Building2 className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{empresa.nome}</span>
                </div>
                {empresa.id === empresaAtual?.id && (
                  <Check className="h-4 w-4 text-blue-600 flex-shrink-0 ml-2" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
