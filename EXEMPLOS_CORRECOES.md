# 💻 Exemplos Práticos de Correções

## 🔧 Correção 1: Sistema de Logs

### ❌ Antes
```typescript
// src/services/supabase.ts
console.log('🔍 Conectando com Supabase...')
console.log('✅ Dados carregados com sucesso:', data?.length || 0)
console.error('❌ Erro ao buscar dados:', error)
```

### ✅ Depois
```typescript
// src/utils/logger.ts
const isDev = import.meta.env.DEV
const isProd = import.meta.env.PROD

export const logger = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args)
  },
  error: (...args: any[]) => {
    console.error(...args)
    // Em produção, enviar para serviço de logs
    if (isProd) {
      // Enviar para Sentry, LogRocket, etc.
    }
  },
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args)
  },
  debug: (...args: any[]) => {
    if (isDev) console.debug(...args)
  }
}

// src/services/supabase.ts
import { logger } from '../utils/logger'

logger.log('🔍 Conectando com Supabase...')
logger.log('✅ Dados carregados com sucesso:', data?.length || 0)
logger.error('❌ Erro ao buscar dados:', error)
```

---

## 🔧 Correção 2: Remover Valores Hardcoded

### ❌ Antes
```typescript
// src/services/supabase.ts
const SUPABASE_URL = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
                    import.meta.env.VITE_SUPABASE_URL || 
                    'https://eshaahpcddqkeevxpgfk.supabase.co' // ❌ Hardcoded

const SUPABASE_ANON_KEY = import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
                         import.meta.env.VITE_SUPABASE_ANON_KEY || 
                         'sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD' // ❌ Hardcoded
```

### ✅ Depois
```typescript
// src/config/env.ts
export const getEnvVar = (key: string, required = true): string => {
  const value = import.meta.env[key]
  
  if (required && !value) {
    throw new Error(`Variável de ambiente ${key} é obrigatória`)
  }
  
  return value || ''
}

// src/services/supabase.ts
import { getEnvVar } from '../config/env'

const SUPABASE_URL = getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || 
                    getEnvVar('VITE_SUPABASE_URL', true)

const SUPABASE_ANON_KEY = getEnvVar('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY') || 
                         getEnvVar('VITE_SUPABASE_ANON_KEY', true)
```

---

## 🔧 Correção 3: Tratamento de Erros Padronizado

### ❌ Antes
```typescript
// Vários lugares no código
try {
  // ...
} catch (error) {
  alert('Erro ao salvar') // ❌ Inconsistente
  console.error(error) // ❌ Log em produção
}
```

### ✅ Depois
```typescript
// src/utils/errorHandler.ts
import { logger } from './logger'
import { toast } from './toast'

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public userMessage?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const handleError = (error: unknown, context?: string): void => {
  let errorMessage = 'Ocorreu um erro inesperado. Tente novamente.'
  let errorCode = 'UNKNOWN_ERROR'
  
  if (error instanceof AppError) {
    errorMessage = error.userMessage || error.message
    errorCode = error.code
  } else if (error instanceof Error) {
    errorMessage = error.message
    logger.error(`Erro em ${context}:`, error)
  } else {
    logger.error(`Erro desconhecido em ${context}:`, error)
  }
  
  toast.error(errorMessage)
  
  // Em produção, enviar para serviço de monitoramento
  if (import.meta.env.PROD) {
    // Enviar para Sentry, etc.
  }
}

// Uso
try {
  await supabaseService.saveTransaction(data)
  toast.success('Transação salva com sucesso!')
} catch (error) {
  handleError(error, 'saveTransaction')
}
```

---

## 🔧 Correção 4: Refatorar App.tsx

### ❌ Antes
```typescript
// src/App.tsx (1846 linhas - tudo em um arquivo)
function App() {
  // 100+ linhas de estados
  // 500+ linhas de lógica
  // 1000+ linhas de JSX
  // ...
}
```

### ✅ Depois
```typescript
// src/hooks/useDashboardData.ts
export const useDashboardData = () => {
  const [data, setData] = useState<SheetData[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    // Lógica de carregamento
  }
  
  return { data, loading, refresh: loadData }
}

// src/hooks/useFilters.ts
export const useFilters = (data: SheetData[]) => {
  const [filteredData, setFilteredData] = useState<SheetData[]>([])
  // Lógica de filtros
  
  return { filteredData, applyFilters }
}

// src/components/Dashboard/DashboardStats.tsx
export const DashboardStats = ({ data }: { data: SheetData[] }) => {
  // Componente focado apenas em estatísticas
}

// src/App.tsx (agora ~200 linhas)
function App() {
  const { data, loading } = useDashboardData()
  const { filteredData } = useFilters(data)
  
  return (
    <Layout>
      <DashboardStats data={filteredData} />
      {/* ... */}
    </Layout>
  )
}
```

---

## 🔧 Correção 5: Validação Robusta

### ❌ Antes
```typescript
// Validação espalhada e inconsistente
if (!formData.descricao) {
  alert('Descrição é obrigatória')
  return
}
```

### ✅ Depois
```typescript
// src/utils/validators.ts
export const validators = {
  required: (message = 'Campo obrigatório') => 
    (value: any) => !!value || message,
  
  email: (message = 'Email inválido') => 
    (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || message,
  
  minLength: (min: number, message?: string) => 
    (value: string) => value.length >= min || (message || `Mínimo de ${min} caracteres`),
  
  maxLength: (max: number, message?: string) => 
    (value: string) => value.length <= max || (message || `Máximo de ${max} caracteres`),
  
  min: (min: number, message?: string) => 
    (value: number) => value >= min || (message || `Valor mínimo: ${min}`),
  
  max: (max: number, message?: string) => 
    (value: number) => value <= max || (message || `Valor máximo: ${max}`),
  
  date: (message = 'Data inválida') => 
    (value: string) => {
      const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/
      if (!regex.test(value)) return message
      const [day, month, year] = value.split('/').map(Number)
      const date = new Date(year, month - 1, day)
      return date.getFullYear() === year && 
             date.getMonth() === month - 1 && 
             date.getDate() === day || message
    }
}

// src/hooks/useFormValidation.ts
export const useFormValidation = <T extends Record<string, any>>(
  schema: Record<keyof T, Array<(value: any) => string | true>>
) => {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  
  const validate = (data: T): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {}
    
    Object.entries(schema).forEach(([field, rules]) => {
      for (const rule of rules) {
        const result = rule(data[field])
        if (result !== true) {
          newErrors[field as keyof T] = result
          break
        }
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  return { errors, validate, setErrors }
}

// Uso
const schema = {
  descricao: [validators.required(), validators.minLength(3)],
  valor: [validators.required(), validators.min(0.01)],
  data: [validators.required(), validators.date()],
}

const { errors, validate } = useFormValidation(schema)

const handleSubmit = async () => {
  if (!validate(formData)) return
  // ...
}
```

---

## 🔧 Correção 6: Testes Básicos

### ✅ Exemplo de Teste Unitário
```typescript
// src/services/__tests__/supabase.test.ts
import { describe, it, expect, vi } from 'vitest'
import { supabaseService } from '../supabase'

describe('SupabaseService', () => {
  describe('getData', () => {
    it('deve retornar array vazio quando não há dados', async () => {
      // Mock
      vi.spyOn(supabaseService.supabase.from, 'select').mockResolvedValue({
        data: [],
        error: null
      })
      
      const result = await supabaseService.getData()
      expect(result).toEqual([])
    })
    
    it('deve lançar erro quando há falha na conexão', async () => {
      vi.spyOn(supabaseService.supabase.from, 'select').mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' }
      })
      
      await expect(supabaseService.getData()).rejects.toThrow()
    })
  })
})
```

### ✅ Exemplo de Teste de Componente
```typescript
// src/components/__tests__/TransactionForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import TransactionForm from '../TransactionForm'

describe('TransactionForm', () => {
  it('deve validar campos obrigatórios', async () => {
    render(<TransactionForm onTransactionSaved={() => {}} />)
    
    const submitButton = screen.getByText('Salvar')
    fireEvent.click(submitButton)
    
    expect(await screen.findByText('Descrição é obrigatória')).toBeInTheDocument()
  })
  
  it('deve formatar valor corretamente', () => {
    render(<TransactionForm onTransactionSaved={() => {}} />)
    
    const valorInput = screen.getByLabelText('Valor')
    fireEvent.change(valorInput, { target: { value: '1234,56' } })
    
    expect(valorInput).toHaveValue('1.234,56')
  })
})
```

---

## 🔧 Correção 7: Performance com React Query

### ❌ Antes
```typescript
// Carregamento manual em cada componente
const [data, setData] = useState([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  loadData()
}, [])

const loadData = async () => {
  setLoading(true)
  const result = await supabaseService.getData()
  setData(result)
  setLoading(false)
}
```

### ✅ Depois
```typescript
// src/hooks/useTransactions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseService } from '../services/supabase'

export const useTransactions = () => {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: () => supabaseService.getData(),
    staleTime: 30000, // 30 segundos
    cacheTime: 300000, // 5 minutos
  })
}

export const useCreateTransaction = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: NewTransaction) => supabaseService.saveTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions'])
    }
  })
}

// Uso no componente
function TransactionsList() {
  const { data, isLoading, error } = useTransactions()
  const createMutation = useCreateTransaction()
  
  if (isLoading) return <Loading />
  if (error) return <Error message={error.message} />
  
  return (
    <div>
      {data?.map(transaction => (
        <TransactionItem key={transaction.id} transaction={transaction} />
      ))}
    </div>
  )
}
```

---

## 🔧 Correção 8: Remover Comentários Duplicados

### ❌ Antes
```typescript
// src/services/supabase.ts (linhas 57-61)
// Sistema operando apenas com dados reais - sem dados simulados

// Sistema operando apenas com dados reais - sem dados simulados

// Sistema operando apenas com dados reais - sem dados simulados
```

### ✅ Depois
```typescript
// src/services/supabase.ts
// Sistema operando apenas com dados reais - sem dados simulados
```

---

## 📋 Checklist de Aplicação

- [ ] Criar `src/utils/logger.ts`
- [ ] Substituir todos os `console.log` por `logger.log`
- [ ] Criar `src/config/env.ts`
- [ ] Remover valores hardcoded
- [ ] Criar `src/utils/errorHandler.ts`
- [ ] Padronizar tratamento de erros
- [ ] Criar `src/utils/validators.ts`
- [ ] Implementar validações robustas
- [ ] Refatorar App.tsx em componentes menores
- [ ] Configurar ambiente de testes
- [ ] Criar testes básicos
- [ ] Implementar React Query
- [ ] Remover comentários duplicados
- [ ] Remover arquivo backup

---

**Estes exemplos podem ser aplicados imediatamente para melhorar a qualidade do código!**

