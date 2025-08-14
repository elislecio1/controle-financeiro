# 🗓️ Guia para Converter Datas para Formato Brasileiro

## 🎯 **Objetivo**
Padronizar todas as datas no banco de dados para o formato brasileiro (`DD/MM/YYYY`) para resolver definitivamente o problema do dashboard "Vencendo Hoje".

## 📋 **Passos para Executar**

### **Passo 1: Executar o Script de Conversão**

1. **Abra o Supabase** e vá para o **SQL Editor**
2. **Cole e execute** o script `converter_datas_para_brasileiro.sql`
3. **Execute por partes** para verificar cada etapa:

#### **Parte 1: Verificar formato atual**
Execute apenas as primeiras consultas (1 e 2) para ver o estado atual:
```sql
-- 1. Verificar o formato atual das datas
SELECT 
    'Verificando formato atual das datas' as acao,
    COUNT(*) as total_transacoes,
    COUNT(CASE WHEN vencimento ~ '^\d{4}-\d{2}-\d{2}$' THEN 1 END) as formato_iso,
    COUNT(CASE WHEN vencimento ~ '^\d{2}/\d{2}/\d{4}$' THEN 1 END) as formato_brasileiro,
    COUNT(CASE WHEN vencimento !~ '^\d{4}-\d{2}-\d{2}$' AND vencimento !~ '^\d{2}/\d{2}/\d{4}$' THEN 1 END) as outros_formatos
FROM transactions 
WHERE vencimento IS NOT NULL;
```

#### **Parte 2: Executar a conversão**
Execute as instruções UPDATE:
```sql
-- Converter campo vencimento
UPDATE transactions 
SET vencimento = TO_CHAR(TO_DATE(vencimento, 'YYYY-MM-DD'), 'DD/MM/YYYY')
WHERE vencimento ~ '^\d{4}-\d{2}-\d{2}$';

-- Converter campo data (se existir)
UPDATE transactions 
SET data = TO_CHAR(TO_DATE(data, 'YYYY-MM-DD'), 'DD/MM/YYYY')
WHERE data ~ '^\d{4}-\d{2}-\d{2}$';
```

#### **Parte 3: Verificar o resultado**
Execute as consultas de verificação (4, 5, 6, 7, 8)

### **Passo 2: Testar o Dashboard**

1. **Recarregue a página** do dashboard (F5)
2. **Verifique o card "Vencendo Hoje"** - deve mostrar R$ 300,00
3. **Clique no card** para ver as transações filtradas

### **Passo 3: Verificar o Sistema de Alertas**

1. **Vá para a aba "Sistema de Alertas"**
2. **Verifique se os alertas** estão aparecendo corretamente
3. **Confirme que não há mais alertas** de transações de teste

## ✅ **Resultado Esperado**

- **Todas as datas** no formato `DD/MM/YYYY`
- **Dashboard "Vencendo Hoje"** funcionando corretamente
- **Sistema de alertas** funcionando com dados reais
- **Filtros de data** funcionando perfeitamente

## ⚠️ **Importante**

- **Faça backup** dos dados antes de executar (opcional, mas recomendado)
- **Execute por partes** para verificar cada etapa
- **Teste o dashboard** após a conversão
- **Se algo der errado**, você pode reverter usando o formato original

## 🔍 **Verificações Pós-Conversão**

1. **Formato das datas**: Todas devem estar como `13/08/2025`
2. **Dashboard**: Card "Vencendo Hoje" deve mostrar valores corretos
3. **Filtros**: Filtro "vencendo_hoje" deve funcionar
4. **Alertas**: Sistema deve detectar transações vencendo hoje

## 📞 **Suporte**

Se encontrar algum problema durante a conversão, verifique:
- **Console do navegador** para erros
- **Logs do Supabase** para problemas de SQL
- **Formato das datas** após a conversão
