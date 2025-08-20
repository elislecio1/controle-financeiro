# 🔐 Guia Detalhado: Configurar Google OAuth no Supabase

## 📋 Pré-requisitos

- ✅ Conta Google (Gmail)
- ✅ Projeto no Supabase configurado
- ✅ Acesso ao Google Cloud Console
- ✅ Domínio configurado (pode ser localhost para desenvolvimento)

---

## 🚀 PASSO 1: Configurar Google Cloud Console

### 1.1 Acessar Google Cloud Console
1. Vá para [Google Cloud Console](https://console.cloud.google.com/)
2. Faça login com sua conta Google (elislecio@gmail.com)

### 1.2 Criar Novo Projeto
1. Clique no seletor de projeto no topo da página
2. Clique em **"Novo Projeto"**
3. Digite o nome: `FinFlow Pro - OAuth`
4. Clique em **"Criar"**
5. Aguarde a criação e selecione o projeto

### 1.3 Habilitar Google+ API
1. No menu lateral, vá em **"APIs e Serviços" > "Biblioteca"**
2. Pesquise por **"Google+ API"**
3. Clique na API e depois em **"Habilitar"**

### 1.4 Configurar Tela de Consentimento OAuth
1. Vá em **"APIs e Serviços" > "Tela de consentimento OAuth"**
2. Selecione **"Externo"** e clique em **"Criar"**

#### Configurações da Tela de Consentimento:
```
Nome do aplicativo: FinFlow Pro
Email de suporte: elislecio@gmail.com
Logo: (opcional - pode fazer upload do logo do FinFlow)
Domínio do aplicativo: (deixe em branco por enquanto)
Email de contato do desenvolvedor: elislecio@gmail.com
```

3. Clique em **"Salvar e continuar"**
4. Em **"Escopos"**, clique em **"Salvar e continuar"**
5. Em **"Usuários de teste"**, adicione seu email: `elislecio@gmail.com`
6. Clique em **"Salvar e continuar"**

### 1.5 Criar Credenciais OAuth
1. Vá em **"APIs e Serviços" > "Credenciais"**
2. Clique em **"Criar credenciais" > "ID do cliente OAuth"**
3. Selecione **"Aplicativo da Web"**
4. Configure:

```
Nome: FinFlow Pro Web Client
URIs de redirecionamento autorizados:
- http://localhost:3000/auth/callback
- http://localhost:5173/auth/callback
- https://controle-financeiro-chi-six.vercel.app/auth/callback
- https://eshaahpcddqkeevxpgfk.supabase.co/auth/v1/callback
```

5. Clique em **"Criar"**
6. **IMPORTANTE**: Anote o **Client ID** e **Client Secret** que aparecerem

---

## 🚀 PASSO 2: Configurar Supabase

### 2.1 Acessar Painel do Supabase
1. Vá para [Supabase](https://supabase.com/)
2. Faça login e acesse seu projeto

### 2.2 Configurar Authentication
1. No menu lateral, clique em **"Authentication"**
2. Clique na aba **"Providers"**
3. Procure por **"Google"** e clique no toggle para habilitar

### 2.3 Configurar Credenciais Google
1. Cole o **Client ID** do Google Cloud Console
2. Cole o **Client Secret** do Google Cloud Console
3. Clique em **"Save"**

### 2.4 Configurar URLs de Redirecionamento
1. Ainda em **"Authentication"**, clique na aba **"URL Configuration"**
2. Configure:

```
Site URL: https://controle-financeiro-chi-six.vercel.app
Redirect URLs:
- http://localhost:3000/auth/callback
- http://localhost:5173/auth/callback
- https://controle-financeiro-chi-six.vercel.app/auth/callback
- https://eshaahpcddqkeevxpgfk.supabase.co/auth/v1/callback
```

3. Clique em **"Save"**

---

## 🚀 PASSO 3: Testar Configuração

### 3.1 Testar Login com Google
1. Abra sua aplicação
2. Clique em **"Entrar com Google"**
3. Deve redirecionar para o Google
4. Faça login com sua conta Google
5. Deve retornar para a aplicação autenticado

### 3.2 Verificar no Supabase
1. Vá em **"Authentication" > "Users"**
2. Deve aparecer um novo usuário com seu email Google
3. Verifique se o perfil foi criado automaticamente

---

## 🚀 PASSO 4: Criar Super Usuário

### 4.1 Criar Usuário Manualmente
1. No Supabase, vá em **"Authentication" > "Users"**
2. Clique em **"Add User"**
3. Preencha:

```
Email: elislecio@gmail.com
Password: (senha forte)
User Metadata:
{
  "name": "Elislecio dos Santos Ferreira",
  "full_name": "Elislecio dos Santos Ferreira"
}
```

4. Clique em **"Create User"**

### 4.2 Executar Script SQL
1. Vá em **"SQL Editor"**
2. Execute o arquivo `criar_super_usuario.sql`
3. Verifique se o usuário foi configurado como admin

---

## 🚀 PASSO 5: Configurar Domínio de Produção

### 5.1 Atualizar Google Cloud Console
1. Volte ao Google Cloud Console
2. Vá em **"Credenciais" > "ID do cliente OAuth"**
3. Clique no cliente criado
4. Adicione as URLs de produção:

```
URIs de redirecionamento autorizados:
- https://controle-financeiro-chi-six.vercel.app/auth/callback
- https://eshaahpcddqkeevxpgfk.supabase.co/auth/v1/callback
```

### 5.2 Atualizar Supabase
1. No Supabase, vá em **"Authentication" > "URL Configuration"**
2. Atualize:

```
Site URL: https://controle-financeiro-chi-six.vercel.app
Redirect URLs:
- https://controle-financeiro-chi-six.vercel.app/auth/callback
- https://eshaahpcddqkeevxpgfk.supabase.co/auth/v1/callback
```

---

## 🔧 Troubleshooting

### Problema: "redirect_uri_mismatch"
**Solução**: Verifique se as URLs de redirecionamento no Google Cloud Console e Supabase são idênticas

### Problema: "access_denied"
**Solução**: Verifique se o email está na lista de usuários de teste da tela de consentimento

### Problema: "invalid_client"
**Solução**: Verifique se o Client ID e Client Secret estão corretos no Supabase

### Problema: Não redireciona após login
**Solução**: Verifique se as URLs de redirecionamento estão configuradas corretamente

### Problema: 404 na página de callback
**Solução**: A página de callback foi criada e configurada nas rotas

---

## 📋 Checklist de Configuração

- [ ] Projeto criado no Google Cloud Console
- [ ] Google+ API habilitada
- [ ] Tela de consentimento OAuth configurada
- [ ] Credenciais OAuth criadas (Client ID + Secret)
- [ ] Google OAuth habilitado no Supabase
- [ ] Credenciais configuradas no Supabase
- [ ] URLs de redirecionamento configuradas
- [ ] Página de callback criada (/auth/callback)
- [ ] Rotas configuradas no React Router
- [ ] Login com Google testado
- [ ] Super usuário elislecio@gmail.com criado
- [ ] Usuário configurado como admin
- [ ] Domínio de produção configurado

---

## 🎯 Próximos Passos

1. **Teste completo**: Faça login/logout várias vezes
2. **Verifique permissões**: Confirme que o admin tem acesso total
3. **Teste multi-tenancy**: Crie outro usuário e verifique isolamento
4. **Configure templates de email**: Personalize emails de confirmação
5. **Monitore logs**: Verifique logs de autenticação no Supabase

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no Google Cloud Console
2. Verifique os logs no Supabase
3. Teste com usuário de teste primeiro
4. Verifique se todas as URLs estão corretas
5. Confirme se as APIs estão habilitadas

**Lembre-se**: O OAuth do Google pode levar alguns minutos para propagar as mudanças!
