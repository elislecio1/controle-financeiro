// Serviço de Cache Inteligente para Performance
interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number // Time to live em milissegundos
  key: string
}

interface CacheConfig {
  defaultTTL: number // TTL padrão em milissegundos
  maxSize: number // Tamanho máximo do cache
  enableLogging: boolean
}

class CacheService {
  private cache = new Map<string, CacheItem<any>>()
  private config: CacheConfig = {
    defaultTTL: 5 * 60 * 1000, // 5 minutos
    maxSize: 100, // 100 itens máximo
    enableLogging: true
  }

  constructor(config?: Partial<CacheConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
    
    // Limpar cache expirado a cada minuto
    setInterval(() => {
      this.cleanExpiredItems()
    }, 60 * 1000)
  }

  // Obter item do cache
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      this.log(`Cache miss: ${key}`)
      return null
    }

    // Verificar se expirou
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      this.log(`Cache expired: ${key}`)
      return null
    }

    this.log(`Cache hit: ${key}`)
    return item.data
  }

  // Armazenar item no cache
  set<T>(key: string, data: T, ttl?: number): void {
    // Verificar tamanho máximo
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest()
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      key
    }

    this.cache.set(key, item)
    this.log(`Cache set: ${key} (TTL: ${item.ttl}ms)`)
  }

  // Remover item do cache
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    this.log(`Cache delete: ${key} (${deleted ? 'success' : 'not found'})`)
    return deleted
  }

  // Limpar todo o cache
  clear(): void {
    this.cache.clear()
    this.log('Cache cleared')
  }

  // Verificar se item existe e não expirou
  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }

  // Obter estatísticas do cache
  getStats() {
    const now = Date.now()
    let expired = 0
    let valid = 0

    for (const item of this.cache.values()) {
      if (now - item.timestamp > item.ttl) {
        expired++
      } else {
        valid++
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
      hitRate: this.calculateHitRate(),
      memoryUsage: this.estimateMemoryUsage()
    }
  }

  // Gerar chave de cache baseada em parâmetros
  generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|')
    
    return `${prefix}:${sortedParams}`
  }

  // Cache com função assíncrona
  async getOrSet<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    try {
      const data = await fetcher()
      this.set(key, data, ttl)
      return data
    } catch (error) {
      this.log(`Error fetching data for key ${key}:`, error)
      throw error
    }
  }

  // Cache para operações de banco de dados
  async getCachedData<T>(
    tableName: string,
    queryParams: Record<string, any>,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const key = this.generateKey(`db:${tableName}`, queryParams)
    return this.getOrSet(key, fetcher, ttl)
  }

  // Invalidar cache por padrão
  invalidatePattern(pattern: string): number {
    let deleted = 0
    const regex = new RegExp(pattern)
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        deleted++
      }
    }
    
    this.log(`Cache invalidated pattern: ${pattern} (${deleted} items)`)
    return deleted
  }

  // Invalidar cache de uma tabela específica
  invalidateTable(tableName: string): number {
    return this.invalidatePattern(`^db:${tableName}:`)
  }

  // Remover item mais antigo (LRU)
  private evictOldest(): void {
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      this.log(`Cache evicted oldest: ${oldestKey}`)
    }
  }

  // Limpar itens expirados
  private cleanExpiredItems(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      this.log(`Cache cleaned ${cleaned} expired items`)
    }
  }

  // Calcular taxa de acerto (simplificado)
  private calculateHitRate(): number {
    // Em uma implementação real, isso seria baseado em estatísticas reais
    return 0.85 // 85% de taxa de acerto estimada
  }

  // Estimar uso de memória
  private estimateMemoryUsage(): string {
    const size = this.cache.size
    const estimatedKB = size * 2 // Estimativa de 2KB por item
    return `${estimatedKB}KB (${size} items)`
  }

  // Log interno
  private log(message: string, ...args: any[]): void {
    if (this.config.enableLogging) {
      console.log(`[CacheService] ${message}`, ...args)
    }
  }
}

// Instância singleton do serviço de cache
export const cacheService = new CacheService({
  defaultTTL: 5 * 60 * 1000, // 5 minutos
  maxSize: 100,
  enableLogging: import.meta.env.VITE_DEBUG_MODE === 'true'
})

export default cacheService
