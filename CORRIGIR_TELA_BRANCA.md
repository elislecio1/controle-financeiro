# 🔧 Como Corrigir Tela Branca

## 🔴 Problema Identificado

O arquivo `.env` está com valores **placeholder** (exemplo), não com as credenciais reais do Supabase.

## ✅ Solução

### Passo 1: Editar o arquivo `.env`

Abra o arquivo `.env` na raiz do projeto e substitua pelos valores reais:

```env
VITE_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
NEXT_PUBLIC_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
```

**⚠️ IMPORTANTE**: Use suas credenciais reais do Supabase!

### Passo 2: Reiniciar o servidor

Após editar o `.env`:

1. **Pare o servidor atual** (Ctrl+C no terminal)
2. **Inicie novamente**:
   ```bash
   npm run dev
   ```

### Passo 3: Limpar cache do navegador

1. Pressione `Ctrl + Shift + R` (hard refresh)
2. Ou abra o DevTools (F12) → Network → Marque "Disable cache"

## 🔍 Verificar Erros no Console

1. Abra o DevTools (F12)
2. Vá na aba **Console**
3. Procure por erros em vermelho
4. Erros comuns:
   - `Supabase não configurado`
   - `Failed to fetch`
   - `Invalid API key`

## 📝 Como Obter as Credenciais do Supabase

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

## 🐛 Outras Causas Possíveis

### Erro de JavaScript
- Abra o DevTools (F12) → Console
- Veja se há erros em vermelho
- Copie os erros e verifique

### Erro de Compilação
- Verifique o terminal onde o `npm run dev` está rodando
- Procure por erros de TypeScript ou compilação

### Problema de Roteamento
- Verifique se está acessando `http://localhost:3000` (não 3001)
- Tente acessar diretamente: `http://localhost:3000`

## ✅ Checklist

- [ ] Arquivo `.env` configurado com credenciais reais
- [ ] Servidor reiniciado após editar `.env`
- [ ] Cache do navegador limpo (Ctrl+Shift+R)
- [ ] Console do navegador verificado (F12)
- [ ] Sem erros no terminal do servidor

## 🆘 Ainda com Problemas?

1. **Verifique o console do navegador** (F12 → Console)
2. **Verifique o terminal** onde o servidor está rodando
3. **Tente em modo anônimo** do navegador
4. **Verifique se a porta está correta** (3000, não 3001)
