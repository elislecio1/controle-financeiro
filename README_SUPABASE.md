# 🚀 Configuração Completa do Supabase

## 📋 Resumo

Este guia irá ajudá-lo a configurar completamente o Supabase para o sistema financeiro, incluindo todas as tabelas necessárias para os 4 módulos implementados.

## 🎯 O que será configurado

### ✅ Módulo 1: Gestão Financeira Essencial
- Tabela `transactions` (transações principais)
- Tabela `contas_bancarias` (contas bancárias)
- Tabela `cartoes_credito` (cartões de crédito)

### ✅ Módulo 2: Organização e Planejamento
- Tabela `categorias` (categorias de receitas/despesas)
- Tabela `subcategorias` (subcategorias)
- Tabela `centros_custo` (centros de custo)
- Tabela `contatos` (contatos e fornecedores)
- Tabela `metas` (metas financeiras)
- Tabela `orcamentos` (orçamentos mensais)

### ✅ Módulo 3: Recursos Avançados
- Tabela `investimentos` (carteira de investimentos)

### ✅ Módulo 4: Relatórios e Análises
- Tabela `relatorios` (relatórios gerados)

### ✅ Configurações
- Tabela `configuracoes_sistema` (configurações gerais)

## 🚀 Passos Rápidos

### 1. Criar Projeto no Supabase
1. Acesse https://supabase.com
2. Clique em "New Project"
3. Nome: `sistema-financeiro`
4. Escolha região próxima
5. Aguarde a criação

### 2. Executar Schema SQL
1. No Supabase Dashboard → SQL Editor
2. Clique em "New Query"
3. Cole todo o conteúdo de `supabase_schema.sql`
4. Clique em "Run"

### 3. Configurar Variáveis de Ambiente
1. Crie arquivo `.env` na raiz do projeto
2. Adicione suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Testar Conexão
1. Execute `npm run dev`
2. Acesse a aplicação
3. Clique em "Testar Conexão"
4. Verifique se aparece sucesso

## 📊 Estrutura Completa das Tabelas

### 🔹 transactions (Tabela Principal)
```sql
- id: UUID (Primary Key)
- data: VARCHAR(10) - Data da transação (DD/MM/AAAA)
- valor: DECIMAL(15,2) - Valor da transação
- descricao: VARCHAR(255) - Descrição obrigatória
- conta: VARCHAR(100) - Conta bancária
- categoria: VARCHAR(100) - Categoria
- forma: VARCHAR(50) - Forma de pagamento
- status: VARCHAR(20) - pago/pendente/vencido
- tipo: VARCHAR(20) - receita/despesa/transferencia/investimento
- vencimento: VARCHAR(10) - Data de vencimento
- data_pagamento: VARCHAR(10) - Data do pagamento
- + campos opcionais (subcategoria, contato, centro, etc.)
```

### 🔹 categorias
```sql
- id: UUID (Primary Key)
- nome: VARCHAR(100) - Nome da categoria
- tipo: VARCHAR(20) - receita/despesa/ambos
- cor: VARCHAR(7) - Código hexadecimal da cor
- icone: VARCHAR(50) - Ícone da categoria
- ativo: BOOLEAN - Se está ativa
```

### 🔹 subcategorias
```sql
- id: UUID (Primary Key)
- nome: VARCHAR(100) - Nome da subcategoria
- categoria_id: UUID - Referência à categoria pai
- ativo: BOOLEAN - Se está ativa
```

### 🔹 investimentos
```sql
- id: UUID (Primary Key)
- nome: VARCHAR(100) - Nome do investimento
- tipo: VARCHAR(20) - acao/fiis/etfs/cdb/lci/lca/poupanca/outros
- valor: DECIMAL(15,2) - Valor investido
- quantidade: DECIMAL(15,4) - Quantidade de cotas/ações
- preco_medio: DECIMAL(15,4) - Preço médio
- instituicao: VARCHAR(100) - Instituição financeira
- data_compra: VARCHAR(10) - Data da compra
- observacoes: TEXT - Observações
- ativo: BOOLEAN - Se está ativo
```

## 🔧 Recursos Incluídos

### ✅ Índices de Performance
- Índices nas colunas mais consultadas
- Otimização para consultas rápidas

### ✅ Triggers Automáticos
- `created_at` e `updated_at` atualizados automaticamente
- Controle de versão dos registros

### ✅ Validações
- Constraints CHECK para valores válidos
- Foreign keys para integridade referencial
- Campos obrigatórios marcados como NOT NULL

### ✅ Segurança (RLS)
- Row Level Security habilitado
- Políticas básicas para usuários autenticados
- Proteção contra acesso não autorizado

### ✅ Dados Iniciais
- Categorias padrão inseridas automaticamente
- Configuração padrão do sistema
- Estrutura básica pronta para uso

## 🛡️ Segurança

### Row Level Security (RLS)
- Todas as tabelas têm RLS habilitado
- Políticas permitem operações para usuários autenticados
- Proteção contra acesso não autorizado

### Validações de Dados
- Constraints CHECK garantem valores válidos
- Foreign keys mantêm integridade referencial
- Campos obrigatórios são validados

## 📝 Dados Iniciais Incluídos

### Categorias Padrão
- **Despesas**: Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Serviços
- **Receitas**: Receitas, Salário, Investimentos

### Configuração Padrão
- **Moeda**: BRL (Real Brasileiro)
- **Formato Data**: DD/MM/AAAA
- **Formato Moeda**: R$ #,##0.00
- **Regime Contábil**: Caixa
- **Alertas Vencimento**: 7 dias
- **Tema**: Claro

## 🔍 Troubleshooting

### Problemas Comuns

1. **Erro de conexão**:
   - Verifique se as variáveis de ambiente estão corretas
   - Confirme se o projeto está ativo no Supabase

2. **Erro de permissão**:
   - Verifique se as políticas RLS estão configuradas
   - Confirme se o usuário está autenticado

3. **Erro de schema**:
   - Execute o script SQL novamente
   - Verifique se não há conflitos de nomes

### Logs e Debug
- Use o console do navegador para ver logs
- Verifique a aba Network para requisições
- Use o SQL Editor do Supabase para consultas

## 📚 Próximos Passos

1. **Testar todas as funcionalidades** da aplicação
2. **Configurar autenticação** se necessário
3. **Personalizar políticas de segurança**
4. **Implementar backup automático**
5. **Monitorar performance**

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs do console do navegador
2. Consulte a documentação do Supabase
3. Verifique se todas as tabelas foram criadas
4. Teste a conexão usando o botão "Testar Conexão"

## 🎉 Resultado Final

Após seguir todos os passos, você terá:

- ✅ **12 tabelas** criadas e configuradas
- ✅ **Índices de performance** otimizados
- ✅ **Segurança RLS** habilitada
- ✅ **Dados iniciais** inseridos
- ✅ **Aplicação funcionando** com Supabase
- ✅ **Todos os módulos** integrados ao banco

**🎊 Parabéns! Seu sistema financeiro está completamente configurado com Supabase!** 