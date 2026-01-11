# 🔐 Como Resolver Problema de Login

## 🔴 Problema: Não consegue fazer login em localhost:3001

## ✅ Soluções

### 1. Verificar se você tem uma conta cadastrada

**Opção A: Criar nova conta (Registro)**
1. Na tela de login, clique em **"Criar conta"** ou **"Registrar"**
2. Preencha:
   - Nome completo
   - Email
   - Senha (mínimo 6 caracteres)
   - Confirme a senha
3. Clique em **"Criar conta"**
4. Verifique seu email (pode estar na caixa de spam)
5. Clique no link de confirmação

**Opção B: Usar conta existente**
- Use o email e senha que você cadastrou anteriormente

---

### 2. Configurar Redirect URLs no Supabase

O Supabase precisa saber que `localhost:3001` é uma URL válida para redirecionamento.

**Passos:**

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Authentication** → **URL Configuration**
4. Em **Redirect URLs**, adicione:
   ```
   http://localhost:3001/auth/callback
   http://localhost:3000/auth/callback
   ```
5. Em **Site URL**, coloque:
   ```
   http://localhost:3001
   ```
6. Clique em **Save**

---

### 3. Verificar Erros no Console do Navegador

1. Abra o DevTools (F12)
2. Vá na aba **Console**
3. Tente fazer login
4. Veja se aparecem erros em vermelho
5. Erros comuns:
   - `Invalid login credentials` → Email/senha incorretos
   - `Email not confirmed` → Verifique seu email
   - `Redirect URL mismatch` → Configure no Supabase (passo 2)
   - `Supabase não configurado` → Verifique o arquivo .env

---

### 4. Verificar Arquivo .env

Certifique-se de que o arquivo `.env` tem as credenciais corretas:

```env
VITE_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
```

**Após editar o .env, REINICIE o servidor:**
```bash
# Pare o servidor (Ctrl+C)
npm run dev
```

---

### 5. Criar Usuário Diretamente no Supabase

Se não conseguir criar conta pelo sistema:

1. Acesse: https://app.supabase.com
2. Vá em **Authentication** → **Users**
3. Clique em **"Add user"** → **"Create new user"**
4. Preencha:
   - Email: seu@email.com
   - Senha: (mínimo 6 caracteres)
   - Auto Confirm User: ✅ (marca esta opção)
5. Clique em **"Create user"**
6. Agora você pode fazer login com este email e senha

---

### 6. Login com Google OAuth

Se quiser usar login com Google:

**Configurar no Supabase:**
1. Acesse: https://app.supabase.com
2. Vá em **Authentication** → **Providers**
3. Habilite **Google**
4. Configure as credenciais OAuth do Google Cloud Console
5. Adicione redirect URL: `http://localhost:3001/auth/callback`

**Depois, no sistema:**
- Clique em **"Entrar com Google"**
- Será redirecionado para o Google
- Autorize o acesso
- Será redirecionado de volta para o sistema

---

### 7. Verificar se o Servidor Está na Porta Correta

O servidor está configurado para porta 3000, mas está rodando na 3001.

**Opção A: Usar porta 3000**
```bash
# Pare o servidor atual
# Execute:
npm run dev
# Acesse: http://localhost:3000
```

**Opção B: Configurar para porta 3001**
Edite `vite.config.ts`:
```typescript
server: {
  port: 3001,  // Altere de 3000 para 3001
  open: true,
  host: true
}
```

Depois reinicie o servidor.

---

## 🔍 Diagnóstico Rápido

Execute estes passos na ordem:

1. ✅ **Verificar Console do Navegador (F12)**
   - Veja se há erros em vermelho
   - Copie a mensagem de erro

2. ✅ **Verificar Terminal do Servidor**
   - Veja se há erros de compilação
   - Veja se há erros de conexão com Supabase

3. ✅ **Verificar .env**
   - Arquivo existe?
   - Credenciais estão corretas?
   - Não são valores placeholder?

4. ✅ **Verificar Supabase**
   - Projeto está ativo?
   - Redirect URLs configuradas?
   - Usuário existe?

5. ✅ **Testar Login**
   - Tente criar nova conta
   - Tente login com email/senha
   - Tente login com Google

---

## 🐛 Erros Comuns e Soluções

### "Invalid login credentials"
- **Causa**: Email ou senha incorretos
- **Solução**: Verifique se digitou corretamente ou crie nova conta

### "Email not confirmed"
- **Causa**: Email não foi confirmado
- **Solução**: 
  - Verifique sua caixa de entrada (e spam)
  - Ou crie usuário no Supabase com "Auto Confirm" marcado

### "Redirect URL mismatch"
- **Causa**: URL de redirect não configurada no Supabase
- **Solução**: Configure no Supabase (passo 2 acima)

### "Supabase não configurado"
- **Causa**: Arquivo .env não configurado ou com valores errados
- **Solução**: Verifique e configure o .env (passo 4 acima)

### Tela branca após login
- **Causa**: Erro no código ou perfil de usuário não criado
- **Solução**: 
  - Verifique console do navegador
  - Verifique se a tabela `user_profiles` existe no Supabase

---

## ✅ Checklist de Verificação

Antes de tentar fazer login, verifique:

- [ ] Arquivo `.env` configurado com credenciais reais
- [ ] Servidor reiniciado após editar `.env`
- [ ] Redirect URLs configuradas no Supabase
- [ ] Site URL configurado no Supabase
- [ ] Usuário existe no Supabase (ou pode criar novo)
- [ ] Console do navegador sem erros críticos
- [ ] Terminal do servidor sem erros

---

## 🆘 Ainda com Problemas?

1. **Abra o DevTools (F12)** → Console
2. **Tente fazer login** e veja os erros
3. **Copie a mensagem de erro** completa
4. **Verifique o terminal** onde o servidor está rodando
5. **Verifique os logs do Supabase** em Authentication → Logs

---

## 📝 Próximos Passos

Após conseguir fazer login:

1. ✅ Verifique se o perfil foi criado
2. ✅ Explore o dashboard
3. ✅ Teste as funcionalidades
4. ✅ Configure suas preferências

---

**💡 Dica**: Se nada funcionar, tente criar um novo usuário diretamente no Supabase (passo 5) e depois faça login com esse usuário.

