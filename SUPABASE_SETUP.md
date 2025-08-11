# Configuração do Supabase para o Sistema Financeiro

## 📋 Pré-requisitos

1. Conta no Supabase (https://supabase.com)
2. Projeto criado no Supabase
3. Credenciais do projeto (URL e API Key)

## 🚀 Passos para Configuração

### 1. Criar Projeto no Supabase

1. Acesse https://supabase.com
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Preencha as informações:
   - **Name**: `sistema-financeiro`
   - **Database Password**: (escolha uma senha forte)
   - **Region**: (escolha a região mais próxima)
5. Clique em "Create new project"
6. Aguarde a criação do projeto (pode levar alguns minutos)

### 2. Obter Credenciais do Projeto

1. No dashboard do projeto, vá para **Settings** > **API**
2. Copie as seguintes informações:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public**: (chave pública)
   - **service_role secret**: (chave secreta - mantenha segura)

### 3. Configurar Variáveis de Ambiente

1. No seu projeto local, crie ou atualize o arquivo `.env`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Executar o Schema SQL

1. No dashboard do Supabase, vá para **SQL Editor**
2. Clique em **New Query**
3. Copie todo o conteúdo do arquivo `supabase_schema.sql`
4. Cole no editor SQL
5. Clique em **Run** para executar o script

### 5. Verificar Tabelas Criadas

1. Vá para **Table Editor** no dashboard
2. Verifique se as seguintes tabelas foram criadas:
   - `transactions`
   - `contas_bancarias`
   - `cartoes_credito`
   - `categorias`
   - `subcategorias`
   - `centros_custo`
   - `contatos`
   - `metas`
   - `orcamentos`
   - `investimentos`
   - `relatorios`
   - `configuracoes_sistema`

### 6. Configurar Políticas de Segurança (RLS)

O script SQL já inclui as políticas básicas de RLS. Se precisar personalizar:

1. Vá para **Authentication** > **Policies**
2. Para cada tabela, você pode ajustar as políticas conforme necessário
3. Por padrão, todas as operações são permitidas para usuários autenticados

### 7. Testar a Conexão

1. Execute a aplicação: `npm run dev`
2. Acesse a aplicação no navegador
3. Clique em "Testar Conexão" no header
4. Verifique se a mensagem de sucesso aparece

## 📊 Estrutura das Tabelas

### Módulo 1: Gestão Financeira Essencial
- **transactions**: Transações principais (receitas, despesas, transferências)
- **contas_bancarias**: Contas bancárias e cartões
- **cartoes_credito**: Cartões de crédito específicos

### Módulo 2: Organização e Planejamento
- **categorias**: Categorias de receitas e despesas
- **subcategorias**: Subcategorias dependentes das categorias
- **centros_custo**: Centros de custo e lucro
- **contatos**: Contatos, clientes e fornecedores
- **metas**: Metas financeiras
- **orcamentos**: Orçamentos mensais por categoria

### Módulo 3: Recursos Avançados
- **investimentos**: Carteira de investimentos

### Módulo 4: Relatórios e Análises
- **relatorios**: Relatórios gerados pelo sistema

### Configurações
- **configuracoes_sistema**: Configurações gerais do sistema

## 🔧 Configurações Adicionais

### Habilitar Extensões
O script SQL já habilita a extensão `uuid-ossp` para gerar UUIDs automaticamente.

### Índices de Performance
O script cria índices nas colunas mais consultadas para melhor performance:
- `transactions`: data, status, tipo, categoria, vencimento
- `categorias`: tipo, ativo
- `subcategorias`: categoria_id, ativo
- `investimentos`: tipo, ativo
- `metas`: tipo, ativo
- `orcamentos`: mes, categoria_id

### Triggers Automáticos
- Todos os registros têm `created_at` e `updated_at` atualizados automaticamente
- O trigger `update_updated_at_column()` atualiza `updated_at` sempre que um registro é modificado

## 🛡️ Segurança

### Row Level Security (RLS)
- Todas as tabelas têm RLS habilitado
- Políticas básicas permitem todas as operações para usuários autenticados
- Você pode personalizar as políticas conforme suas necessidades

### Validações
- Constraints CHECK garantem valores válidos
- Foreign keys mantêm integridade referencial
- Campos obrigatórios são marcados como NOT NULL

## 📝 Dados Iniciais

O script inclui dados iniciais:
- **Categorias padrão**: Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Serviços, Receitas, Salário, Investimentos
- **Configuração padrão**: Moeda BRL, formato brasileiro, regime de caixa

## 🔍 Troubleshooting

### Problemas Comuns

1. **Erro de conexão**:
   - Verifique se as variáveis de ambiente estão corretas
   - Confirme se o projeto está ativo no Supabase

2. **Erro de permissão**:
   - Verifique se as políticas RLS estão configuradas corretamente
   - Confirme se o usuário está autenticado

3. **Erro de schema**:
   - Execute o script SQL novamente
   - Verifique se não há conflitos de nomes de tabelas

### Logs e Debug
- Use o console do navegador para ver logs de erro
- Verifique a aba Network para ver as requisições ao Supabase
- Use o SQL Editor do Supabase para consultas diretas

## 📚 Próximos Passos

1. **Testar todas as funcionalidades** da aplicação
2. **Configurar autenticação** se necessário
3. **Personalizar políticas de segurança** conforme suas necessidades
4. **Implementar backup automático** se necessário
5. **Monitorar performance** e ajustar índices se necessário

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs do console do navegador
2. Consulte a documentação do Supabase
3. Verifique se todas as tabelas foram criadas corretamente
4. Teste a conexão usando o botão "Testar Conexão" na aplicação 