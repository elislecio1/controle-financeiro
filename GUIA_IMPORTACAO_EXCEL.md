# 📊 Guia de Importação de Dados do Excel para Supabase

## 🎯 Resumo da Importação

✅ **Transações processadas com sucesso:**
- **Total de transações únicas:** 132
- **Duplicatas ignoradas:** 125
- **Arquivo SQL gerado:** `importacao_transacoes.sql`

## 📋 Passos para Importar no Supabase

### 1. Acessar o SQL Editor do Supabase

1. Faça login no [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto: `eshaahpcddqkevxpgfk`
3. No menu lateral, clique em **"SQL Editor"**

### 2. Executar o Script SQL

1. Clique em **"New Query"** para criar uma nova consulta
2. Copie todo o conteúdo do arquivo `importacao_transacoes.sql`
3. Cole no editor SQL
4. Clique em **"Run"** para executar

### 3. Verificar a Importação

O script inclui comandos de verificação que mostrarão:

```sql
-- Resumo das transações importadas
SELECT 
  COUNT(*) as total_inseridas,
  COUNT(CASE WHEN tipo = 'receita' THEN 1 END) as receitas,
  COUNT(CASE WHEN tipo = 'despesa' THEN 1 END) as despesas,
  COUNT(CASE WHEN status = 'pago' THEN 1 END) as pagas,
  COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
  COUNT(CASE WHEN status = 'vencido' THEN 1 END) as vencidas
FROM transactions 
WHERE created_at >= '2025-08-12';

-- Exemplos de transações importadas
SELECT 
  data, descricao, valor, tipo, status, conta, categoria
FROM transactions 
WHERE created_at >= '2025-08-12'
ORDER BY data DESC
LIMIT 10;
```

## 🔍 Detalhes do Processamento

### Estrutura das Abas Processadas:
- **GERAL:** 135 linhas processadas
- **MAIO:** 31 linhas processadas  
- **JUNHO:** 29 linhas processadas
- **JULHO:** 42 linhas processadas
- **AGOSTO:** 26 linhas processadas
- **SETEMBRO:** 17 linhas processadas
- **OUTUBRO:** Vazia (ignorada)

### Mapeamento Automático de Campos:
- **VENCIMENTO** → Data da transação
- **DESCRIÇÃO** → Descrição da transação
- **EMPRESA** → Conta/Fornecedor
- **VALOR** → Valor monetário
- **TIPO** → Tipo de transação (D = Despesa)
- **SITUAÇÃO** → Status (PAGO, VENCIDO, etc.)
- **PARCELA** → Informações de parcelamento

### Categorização Automática:
- **Energia/Água** → Serviços Públicos
- **Aluguel** → Moradia
- **Honorários** → Serviços Profissionais
- **Funcionários** → Recursos Humanos
- **DARF/FGTS/Impostos** → Impostos
- **Cartão** → Cartão de Crédito

## ⚠️ Duplicatas Identificadas

O sistema identificou e ignorou **125 transações duplicadas** baseadas em:
- Descrição
- Valor
- Data
- Conta

**Exemplos de duplicatas ignoradas:**
- ENERGIA BTN - R$ 747,49 (múltiplas ocorrências)
- HONORARIOS CONTABEIS - R$ 1.065,40 (múltiplas ocorrências)
- FGTS - R$ 746,84 (múltiplas ocorrências)

## 🎯 Transações que Serão Importadas

### Exemplos de transações únicas:
1. **2025-01-09** - ENERGIA BTN - R$ 87,90 (PAGO)
2. **2025-03-20** - FGTS - R$ 746,84 (VENCIDO)
3. **2025-03-25** - ESCRITORIO VIRTUAL - R$ 179,00 (PAGO)
4. **2025-04-10** - HONORARIOS CONTABEIS - R$ 1.065,40 (PAGO)
5. **2025-04-16** - ENERGIA CENTRO - R$ 144,29 (PAGO)

### Distribuição por Status:
- **Pagas:** Maioria das transações
- **Vencidas:** FGTS, impostos pendentes
- **Pendentes:** Transações futuras

## 🔧 Recursos do Script

### Conversão Automática:
- **Datas Excel** → Formato ISO (YYYY-MM-DD)
- **Valores brasileiros** → Formato decimal (vírgula → ponto)
- **Status** → Padronização (PAGO, VENCIDO, PENDENTE)
- **Categorias** → Inferência automática baseada na descrição

### Validação de Dados:
- Verificação de campos obrigatórios
- Conversão de tipos de dados
- Geração de UUIDs únicos
- Prevenção de duplicatas

## 📊 Após a Importação

### Verificações Recomendadas:
1. **Contar transações:** Confirmar que 132 foram inseridas
2. **Verificar categorias:** Confirmar categorização automática
3. **Checar valores:** Verificar conversão de valores
4. **Validar datas:** Confirmar conversão de datas Excel

### Próximos Passos:
1. Acessar o sistema web
2. Verificar a aba "Transações"
3. Confirmar que os dados aparecem corretamente
4. Verificar relatórios e análises

## 🚨 Em Caso de Problemas

### Se a importação falhar:
1. Verificar se há erros de sintaxe SQL
2. Confirmar que a tabela `transactions` existe
3. Verificar permissões de inserção
4. Executar o script em partes menores

### Para reverter a importação:
```sql
-- Remover transações importadas (use com cuidado!)
DELETE FROM transactions 
WHERE created_at >= '2025-08-12';
```

## 📞 Suporte

Se encontrar problemas durante a importação:
1. Verifique os logs do SQL Editor
2. Confirme a estrutura da tabela `transactions`
3. Teste com uma pequena parte do script primeiro

---

**✅ Script pronto para execução no Supabase!**
