import { useEmpresa } from '../hooks/useEmpresa'

/**
 * Hook helper para obter empresa_id atual ou lançar erro
 * Use dentro de componentes React
 */
export const useEmpresaId = (): string => {
  const { empresaAtual } = useEmpresa()
  
  if (!empresaAtual) {
    throw new Error('Nenhuma empresa selecionada. Selecione uma empresa para continuar.')
  }
  
  return empresaAtual.id
}

/**
 * Função helper para obter empresa_id atual (para uso fora de componentes)
 * Retorna null se não houver empresa selecionada
 */
export const getEmpresaIdFromStorage = (): string | null => {
  return localStorage.getItem('empresa_atual_id')
}

/**
 * Valida se há empresa selecionada e retorna o ID
 * Lança erro se não houver empresa
 */
export const getEmpresaIdOrThrow = (empresaId: string | null | undefined): string => {
  if (!empresaId) {
    throw new Error('Nenhuma empresa selecionada. Selecione uma empresa para continuar.')
  }
  return empresaId
}

/**
 * Wrapper para queries que precisam de empresa_id
 */
export const withEmpresa = async <T>(
  empresaId: string | null | undefined,
  callback: (empresaId: string) => Promise<T>
): Promise<T> => {
  const id = getEmpresaIdOrThrow(empresaId)
  return callback(id)
}
