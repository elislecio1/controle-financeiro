# 🔧 **CONFIGURAÇÃO COMPLETA DO SUPABASE**

## 📋 **PASSO A PASSO PARA CONFIGURAR**

### 1. **Acesse seu projeto Supabase**
- Vá para: https://supabase.com/dashboard/project/eshaahpcddqkeevxpgfk
- Faça login na sua conta

### 2. **Obtenha as credenciais**
- No menu lateral, clique em **"Settings"** (⚙️)
- Clique em **"API"**
- Você verá duas informações importantes:

#### **🔗 Project URL**
```
https://eshaahpcddqkeevxpgfk.supabase.co
```

#### **🔑 anon public key**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzaGFhaHBjZGRxa2VldnhwZ2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4MDAsImV4cCI6MjA1MDU0ODgwMH0.REAL_KEY_HERE
```

### 3. **Crie o arquivo .env**
- No seu projeto, crie um arquivo chamado `.env` (sem extensão)
- Adicione o seguinte conteúdo:

```env
# Configurações do Supabase
VITE_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_REAL_AQUI
```

### 4. **Substitua a chave**
- Copie a **anon public key** real do Supabase
- Substitua `SUA_CHAVE_REAL_AQUI` pela chave real

### 5. **Teste a conexão**
- Salve o arquivo `.env`
- Reinicie o servidor de desenvolvimento: `npm run dev`
- Verifique se os dados carregam do Supabase

## ⚠️ **IMPORTANTE**

- **NUNCA** compartilhe ou commite o arquivo `.env`
- O arquivo `.env` já está no `.gitignore` para segurança
- Sempre use a chave **anon public key** (não a service_role key)

## 🔍 **VERIFICAÇÃO**

Após configurar, o sistema deve:
- ✅ Conectar ao Supabase automaticamente
- ✅ Carregar dados do banco de dados
- ✅ Mostrar status de conexão bem-sucedida
- ❌ Não mostrar mais dados simulados

## 🆘 **PROBLEMAS COMUNS**

### **Erro: "Supabase não configurado"**
- Verifique se o arquivo `.env` existe
- Confirme se as variáveis estão corretas
- Reinicie o servidor após criar/modificar o `.env`

### **Erro de conexão**
- Verifique se a URL está correta
- Confirme se a chave anon está correta
- Verifique se o projeto Supabase está ativo

### **Dados não carregam**
- Verifique se as tabelas existem no Supabase
- Confirme se as permissões RLS estão configuradas
- Verifique o console do navegador para erros
