# 🔧 Corrigir Redirect do Google OAuth para Novo Domínio

## ❌ Problema

O login com Google está redirecionando para o domínio antigo:
- ❌ `https://controle-financeiro-chi-six.vercel.app/#access_token=...`
- ✅ Deve redirecionar para: `https://cf.don.cim.br/#access_token=...`

---

## ✅ Solução: Atualizar Configurações

### 1. Atualizar Supabase (CRÍTICO)

#### 1.1 Acessar Painel do Supabase
1. Acesse: https://supabase.com
2. Faça login e selecione seu projeto
3. Vá em **Authentication** → **URL Configuration**

#### 1.2 Atualizar Site URL
```
Site URL: https://cf.don.cim.br
```

#### 1.3 Atualizar Redirect URLs
Adicione estas URLs (mantenha as antigas também se necessário):
```
Redirect URLs:
- https://cf.don.cim.br/auth/callback
- https://cf.don.cim.br
- https://eshaahpcddqkeevxpgfk.supabase.co/auth/v1/callback
```

**Importante**: Clique em **Save** após adicionar!

---

### 2. Atualizar Google Cloud Console (CRÍTICO)

#### 2.1 Acessar Google Cloud Console
1. Acesse: https://console.cloud.google.com
2. Selecione o projeto do OAuth
3. Vá em **APIs e Serviços** → **Credenciais**

#### 2.2 Editar OAuth Client ID
1. Clique no **OAuth 2.0 Client ID** usado pelo Supabase
2. Em **"URIs de redirecionamento autorizados"**, adicione:
```
https://cf.don.cim.br/auth/callback
https://eshaahpcddqkeevxpgfk.supabase.co/auth/v1/callback
```

**Importante**: Mantenha as URLs antigas também (não remova)

#### 2.3 Salvar
Clique em **Salvar**

---

### 3. Verificar Código (Opcional)

O código já está configurado para usar `window.location.origin`, então deve funcionar automaticamente. Mas verifique:

**Arquivo**: `src/services/auth.ts` (linha ~244)
```typescript
redirectTo: `${window.location.origin}/auth/callback`
```

Isso já está correto e deve usar o domínio atual automaticamente.

---

## 🧪 Testar Após Configurar

### 1. Limpar Cache do Navegador
- Pressione `Ctrl + Shift + Delete`
- Limpe cache e cookies
- Ou use janela anônima/privada

### 2. Testar Login
1. Acesse: `https://cf.don.cim.br`
2. Clique em **"Entrar com Google"**
3. Faça login com sua conta Google
4. **Deve redirecionar para**: `https://cf.don.cim.br/#access_token=...`
5. **NÃO deve redirecionar para**: `controle-financeiro-chi-six.vercel.app`

---

## 🐛 Troubleshooting

### Erro: "redirect_uri_mismatch"

**Causa**: URL de redirect não está nas configurações do Google

**Solução**:
1. Verifique se adicionou `https://cf.don.cim.br/auth/callback` no Google Cloud Console
2. Aguarde alguns minutos (pode levar tempo para propagar)
3. Limpe cache do navegador

### Erro: "Invalid redirect URL"

**Causa**: URL não está nas configurações do Supabase

**Solução**:
1. Verifique se adicionou `https://cf.don.cim.br/auth/callback` no Supabase
2. Verifique se clicou em **Save**

### Ainda redireciona para Vercel

**Causa**: Cache do navegador ou configurações antigas

**Solução**:
1. Limpe completamente o cache do navegador
2. Use janela anônima/privada
3. Verifique se as configurações foram salvas corretamente

---

## 📋 Checklist

- [ ] Site URL atualizado no Supabase: `https://cf.don.cim.br`
- [ ] Redirect URLs adicionadas no Supabase: `https://cf.don.cim.br/auth/callback`
- [ ] URIs de redirecionamento adicionadas no Google Cloud Console
- [ ] Todas as configurações foram salvas
- [ ] Cache do navegador limpo
- [ ] Testado login com Google

---

## 🚀 Comandos Rápidos (Verificar)

```bash
# Verificar se o site está acessível
curl -I https://cf.don.cim.br

# Verificar SSL
openssl s_client -connect cf.don.cim.br:443 -servername cf.don.cim.br
```

---

**✅ Após atualizar as configurações no Supabase e Google Cloud Console, o login deve funcionar corretamente!**

