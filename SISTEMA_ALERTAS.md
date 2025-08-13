# 🚨 Sistema de Alertas - Documentação Completa

## 📋 **Visão Geral**

O Sistema de Alertas é uma funcionalidade avançada que monitora automaticamente as finanças do usuário e gera notificações inteligentes para situações importantes como vencimentos, metas em risco, orçamentos próximos do limite e saldos baixos.

## 🎯 **Funcionalidades Principais**

### **1. Tipos de Alertas**
- **Vencimentos**: Notifica sobre contas e transações próximas do vencimento
- **Metas**: Alerta quando metas financeiras estão em risco
- **Orçamentos**: Avisa sobre orçamentos próximos do limite
- **Saldos**: Notifica quando saldos estão abaixo do mínimo configurado
- **Personalizados**: Alertas criados manualmente pelo usuário

### **2. Níveis de Prioridade**
- **Crítica**: Requer atenção imediata (ex: vencimento hoje)
- **Alta**: Importante (ex: vencimento amanhã)
- **Média**: Atenção necessária (ex: vencimento em 3 dias)
- **Baixa**: Informativo (ex: vencimento em 7 dias)

### **3. Status dos Alertas**
- **Ativo**: Alerta visível e não lido
- **Lido**: Alerta visualizado pelo usuário
- **Arquivado**: Alerta arquivado para referência futura

## 🏗️ **Arquitetura do Sistema**

### **Componentes Principais**

#### **1. Serviço de Alertas (`src/services/alertas.ts`)**
```typescript
interface AlertasService {
  // Gestão de alertas
  getAlertas(): Promise<Alerta[]>
  criarAlerta(alerta: Omit<Alerta, 'id' | 'dataCriacao'>): Promise<Result>
  
  // Configurações
  getConfiguracoes(): Promise<ConfiguracaoAlerta[]>
  salvarConfiguracao(config: Omit<ConfiguracaoAlerta, 'id'>): Promise<Result>
  
  // Verificações automáticas
  verificarVencimentos(): Promise<Alerta[]>
  verificarMetas(): Promise<Alerta[]>
  verificarOrcamentos(): Promise<Alerta[]>
  verificarSaldos(): Promise<Alerta[]>
}
```

#### **2. Componente Principal (`src/components/SistemaAlertas.tsx`)**
- Interface completa para gerenciar alertas
- Três abas principais: Alertas, Configurações e Verificações
- Filtros avançados por status, prioridade e tipo
- Estatísticas em tempo real

#### **3. Notificações Toast (`src/components/ToastNotification.tsx`)**
- Notificações em tempo real no canto superior direito
- Barra de progresso para alertas com fechamento automático
- Cores e ícones baseados na prioridade
- Animações suaves de entrada e saída

#### **4. Hook Personalizado (`src/hooks/useAlertas.ts`)**
- Gerenciamento de estado centralizado
- Funções reutilizáveis para operações CRUD
- Filtros e estatísticas computadas
- Tratamento de erros integrado

### **Estrutura do Banco de Dados**

#### **Tabela: `alertas`**
```sql
CREATE TABLE alertas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(20) NOT NULL, -- vencimento, meta, orcamento, saldo, personalizado
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    prioridade VARCHAR(20) NOT NULL, -- baixa, media, alta, critica
    status VARCHAR(20) NOT NULL DEFAULT 'ativo', -- ativo, lido, arquivado
    categoria VARCHAR(100),
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_vencimento VARCHAR(10), -- DD/MM/AAAA
    data_leitura TIMESTAMP WITH TIME ZONE,
    usuario_id UUID,
    configuracao_id UUID,
    dados_relacionados JSONB
);
```

#### **Tabela: `configuracoes_alertas`**
```sql
CREATE TABLE configuracoes_alertas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(20) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    dias_antes INTEGER, -- Para alertas de vencimento
    valor_minimo DECIMAL(15,2), -- Para alertas de saldo
    percentual_meta INTEGER, -- Para alertas de metas
    categorias TEXT[], -- Array de categorias
    contas TEXT[], -- Array de contas
    horario_notificacao TIME,
    frequencia VARCHAR(20) NOT NULL, -- diario, semanal, mensal, personalizado
    canais TEXT[] NOT NULL DEFAULT '{dashboard}' -- email, push, sms, dashboard
);
```

#### **Tabela: `notificacoes`**
```sql
CREATE TABLE notificacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alerta_id UUID NOT NULL REFERENCES alertas(id),
    tipo VARCHAR(20) NOT NULL, -- email, push, sms, dashboard
    status VARCHAR(20) NOT NULL DEFAULT 'pendente', -- pendente, enviada, falha
    data_envio TIMESTAMP WITH TIME ZONE,
    dados_envio JSONB,
    tentativas INTEGER NOT NULL DEFAULT 1,
    max_tentativas INTEGER NOT NULL DEFAULT 3
);
```

## ⚙️ **Configurações e Personalização**

### **Configurações de Vencimento**
- **Dias antes**: Quantos dias antes do vencimento gerar alerta
- **Categorias**: Filtrar por categorias específicas
- **Horário**: Horário preferido para notificações
- **Frequência**: Diário, semanal ou mensal

### **Configurações de Saldo**
- **Valor mínimo**: Saldo mínimo para manter na conta
- **Contas**: Aplicar a contas específicas
- **Canais**: Dashboard, email, push ou SMS

### **Configurações de Metas**
- **Percentual mínimo**: Alerta quando abaixo de X% da meta
- **Frequência**: Verificação semanal ou mensal
- **Horário**: Horário para análise das metas

## 🔄 **Verificações Automáticas**

### **1. Verificação de Vencimentos**
```typescript
async verificarVencimentos(): Promise<Alerta[]> {
  // Busca transações pendentes próximas do vencimento
  // Calcula prioridade baseada na proximidade
  // Gera alertas automáticos
}
```

### **2. Verificação de Metas**
```typescript
async verificarMetas(): Promise<Alerta[]> {
  // Compara valor atual vs meta
  // Alerta se abaixo do percentual configurado
  // Sugere ações corretivas
}
```

### **3. Verificação de Orçamentos**
```typescript
async verificarOrcamentos(): Promise<Alerta[]> {
  // Monitora uso do orçamento mensal
  // Alerta quando próximo do limite
  // Sugere controle de gastos
}
```

### **4. Verificação de Saldos**
```typescript
async verificarSaldos(): Promise<Alerta[]> {
  // Compara saldo atual vs mínimo configurado
  // Alerta se abaixo do limite
  // Sugere transferências ou depósitos
}
```

## 📱 **Sistema de Notificações**

### **Canais de Notificação**
1. **Dashboard**: Notificações visuais na interface
2. **Email**: Envio automático de emails
3. **Push**: Notificações push no navegador
4. **SMS**: Envio de mensagens SMS (futuro)

### **Notificações Toast**
- **Posição**: Canto superior direito
- **Duração**: 5 segundos (configurável)
- **Prioridade**: Alertas críticos não fecham automaticamente
- **Animações**: Slide-in da direita com fade-out

### **Exemplo de Notificação**
```
🚨 Conta de Luz vence hoje!
A conta de luz no valor de R$ 150,00 vence hoje. 
Evite multas e juros.

[CRÍTICA] [VENCIMENTO] 14:30
```

## 🎨 **Interface do Usuário**

### **Aba: Alertas**
- Lista de todos os alertas com filtros
- Ações: Marcar como lido, arquivar, excluir
- Indicadores visuais de prioridade e status
- Busca e ordenação

### **Aba: Configurações**
- Gerenciar configurações de alertas
- Criar, editar e excluir configurações
- Ativar/desativar tipos de alerta
- Configurar canais de notificação

### **Aba: Verificações**
- Executar verificações manuais
- Visualizar resultados em tempo real
- Histórico de verificações executadas
- Configurar agendamento automático

## 🔧 **Implementação Técnica**

### **Integração com o App Principal**
```typescript
// No App.tsx
import { ToastContainer } from './components/ToastNotification'
import SistemaAlertas from './components/SistemaAlertas'

// Estado para alertas ativos
const [alertasAtivos, setAlertasAtivos] = useState<Alerta[]>([])

// Carregar alertas ao inicializar
useEffect(() => {
  const carregarAlertas = async () => {
    const alertas = await alertasService.getAlertasAtivos()
    setAlertasAtivos(alertas)
  }
  carregarAlertas()
}, [])

// Renderizar sistema de alertas
{activeTab === 'alertas' && <SistemaAlertas />}

// Container de notificações toast
<ToastContainer 
  alertas={alertasAtivos}
  onClose={(id) => setAlertasAtivos(prev => prev.filter(a => a.id !== id))}
/>
```

### **Uso do Hook Personalizado**
```typescript
import { useAlertas } from '../hooks/useAlertas'

function MeuComponente() {
  const {
    alertas,
    configuracoes,
    loading,
    marcarComoLido,
    executarVerificacoes,
    estatisticas
  } = useAlertas()

  // Usar as funcionalidades do hook
}
```

## 🚀 **Funcionalidades Avançadas**

### **1. Triggers Automáticos**
```sql
-- Trigger para criar alertas automaticamente
CREATE TRIGGER trigger_criar_alerta_transacao
    AFTER INSERT OR UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION criar_alerta_automatico();
```

### **2. Limpeza Automática**
```sql
-- Função para limpar alertas antigos
CREATE OR REPLACE FUNCTION limpar_alertas_antigos()
RETURNS void AS $$
BEGIN
    DELETE FROM alertas 
    WHERE data_criacao < CURRENT_DATE - INTERVAL '30 days'
    AND status IN ('lido', 'arquivado');
END;
$$ LANGUAGE plpgsql;
```

### **3. Agendamento de Verificações**
```sql
-- Agendar verificação diária às 08:00
SELECT cron.schedule('verificar-alertas', '0 8 * * *', 
  'SELECT verificar_alertas_automatico();');
```

## 📊 **Monitoramento e Estatísticas**

### **Métricas Disponíveis**
- Total de alertas
- Alertas ativos vs arquivados
- Distribuição por prioridade
- Distribuição por tipo
- Taxa de leitura
- Tempo médio de resposta

### **Dashboard de Alertas**
```typescript
const estatisticas = {
  total: alertas.length,
  ativos: alertasAtivos.length,
  criticos: alertasCriticos.length,
  altos: alertasAltos.length,
  medios: alertasMedios.length,
  baixos: alertasBaixos.length,
  lidos: alertas.filter(a => a.status === 'lido').length,
  arquivados: alertas.filter(a => a.status === 'arquivado').length
}
```

## 🔒 **Segurança e Permissões**

### **Row Level Security (RLS)**
```sql
-- Política para usuários autenticados
CREATE POLICY "Allow authenticated users to manage alerts" ON alertas
    FOR ALL USING (auth.role() = 'authenticated');

-- Política para configurações
CREATE POLICY "Allow users to manage their alert configurations" ON configuracoes_alertas
    FOR ALL USING (auth.uid() = usuario_id);
```

### **Validação de Dados**
- Verificação de tipos de alerta válidos
- Validação de níveis de prioridade
- Controle de status permitidos
- Sanitização de entrada do usuário

## 🧪 **Testes e Qualidade**

### **Testes Unitários**
```typescript
describe('AlertasService', () => {
  test('deve criar alerta com sucesso', async () => {
    const alerta = { /* dados do alerta */ }
    const resultado = await alertasService.criarAlerta(alerta)
    expect(resultado.success).toBe(true)
  })
})
```

### **Testes de Integração**
- Teste de criação de alertas
- Teste de verificações automáticas
- Teste de notificações
- Teste de configurações

## 📈 **Roadmap e Melhorias Futuras**

### **Fase 1 (Implementado)**
- ✅ Sistema básico de alertas
- ✅ Notificações toast
- ✅ Configurações personalizáveis
- ✅ Verificações automáticas

### **Fase 2 (Planejado)**
- 🔄 Integração com email
- 🔄 Notificações push
- 🔄 Agendamento automático
- 🔄 Relatórios de alertas

### **Fase 3 (Futuro)**
- 📱 App mobile
- 🔔 Notificações SMS
- 🤖 IA para priorização
- 📊 Analytics avançados

## 🎯 **Casos de Uso**

### **1. Controle de Vencimentos**
- Usuário configura alerta para 3 dias antes
- Sistema monitora transações pendentes
- Gera alertas automáticos por prioridade
- Notifica via dashboard e email

### **2. Acompanhamento de Metas**
- Usuário define meta de economia mensal
- Sistema verifica progresso semanalmente
- Alerta se abaixo de 80% da meta
- Sugere ações para atingir objetivo

### **3. Monitoramento de Orçamentos**
- Usuário define orçamento por categoria
- Sistema acompanha gastos em tempo real
- Alerta quando próximo do limite
- Sugere controle de gastos

### **4. Controle de Saldos**
- Usuário define saldo mínimo por conta
- Sistema monitora movimentações
- Alerta se abaixo do limite
- Sugere transferências ou depósitos

## 📚 **Recursos Adicionais**

### **Documentação da API**
- Endpoints REST para alertas
- Exemplos de uso
- Códigos de erro
- Rate limiting

### **Guia de Configuração**
- Configuração inicial
- Personalização de alertas
- Integração com outros sistemas
- Troubleshooting

### **Exemplos de Código**
- Criação de alertas personalizados
- Integração com webhooks
- Customização de notificações
- Extensão do sistema

---

## 🎉 **Conclusão**

O Sistema de Alertas representa uma evolução significativa no projeto de controle financeiro, oferecendo:

- **Monitoramento proativo** das finanças
- **Notificações inteligentes** baseadas em prioridade
- **Configurações personalizáveis** para diferentes necessidades
- **Interface intuitiva** para gestão de alertas
- **Arquitetura escalável** para futuras funcionalidades

Este sistema transforma o controle financeiro de reativo para proativo, ajudando os usuários a manterem suas finanças organizadas e evitarem problemas antes que ocorram.
