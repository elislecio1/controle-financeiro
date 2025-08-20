# 📧 Guia de Configuração - Sistema de E-mails de Convite

## 🎯 Visão Geral

Este guia explica como configurar o sistema de e-mails de convite para que os usuários recebam notificações quando forem convidados para acessar o FinFlow Pro.

## 🔧 Opções de Configuração

### Opção 1: Resend.com (Recomendado)

**Resend** é um serviço moderno e confiável para envio de e-mails.

#### 1. Criar conta no Resend
- Acesse [resend.com](https://resend.com)
- Crie uma conta gratuita
- Verifique seu domínio ou use o domínio de teste

#### 2. Obter API Key
- No dashboard do Resend, vá em "API Keys"
- Crie uma nova API key
- Copie a chave (começa com `re_`)

#### 3. Configurar variável de ambiente
No Vercel, adicione a variável:
```
RESEND_API_KEY=re_sua_chave_aqui
```

### Opção 2: SendGrid

**SendGrid** é um serviço robusto e amplamente utilizado.

#### 1. Criar conta no SendGrid
- Acesse [sendgrid.com](https://sendgrid.com)
- Crie uma conta gratuita (100 e-mails/dia)
- Verifique seu domínio

#### 2. Obter API Key
- No dashboard, vá em "Settings" > "API Keys"
- Crie uma nova API key com permissões de "Mail Send"
- Copie a chave

#### 3. Configurar variável de ambiente
```
SENDGRID_API_KEY=sua_chave_aqui
```

### Opção 3: Gmail (Para desenvolvimento)

**Gmail** pode ser usado para testes, mas não é recomendado para produção.

#### 1. Configurar App Password
- Ative a verificação em duas etapas na sua conta Google
- Vá em "Segurança" > "Senhas de app"
- Gere uma senha para o aplicativo

#### 2. Configurar variáveis de ambiente
```
GMAIL_USER=seu_email@gmail.com
GMAIL_PASS=sua_senha_de_app
```

### Opção 4: Supabase Edge Functions

**Supabase** oferece Edge Functions que podem ser usadas para envio de e-mails.

#### 1. Criar Edge Function
```bash
supabase functions new send-email
```

#### 2. Implementar função
```typescript
// supabase/functions/send-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { to, subject, html } = await req.json()
  
  // Implementar lógica de envio de e-mail
  // Usar Resend, SendGrid, ou outro serviço
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  })
})
```

#### 3. Deploy da função
```bash
supabase functions deploy send-email
```

#### 4. Configurar variáveis de ambiente
```
SUPABASE_URL=sua_url_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

## 🚀 Configuração no Vercel

### 1. Acessar configurações do projeto
- Vá para o dashboard do Vercel
- Selecione seu projeto
- Vá em "Settings" > "Environment Variables"

### 2. Adicionar variáveis
Adicione as variáveis correspondentes ao serviço escolhido:

**Para Resend:**
```
RESEND_API_KEY=re_sua_chave_aqui
```

**Para SendGrid:**
```
SENDGRID_API_KEY=sua_chave_aqui
```

**Para Gmail:**
```
GMAIL_USER=seu_email@gmail.com
GMAIL_PASS=sua_senha_de_app
```

### 3. Redeploy
Após adicionar as variáveis, faça um novo deploy:
```bash
git add .
git commit -m "Configurar sistema de e-mails"
git push origin main
```

## 📋 Verificação da Configuração

### 1. Testar envio de e-mail
1. Acesse a aplicação
2. Vá em "Gestão de Usuários"
3. Clique em "Convidar Usuário"
4. Preencha os dados e envie o convite
5. Verifique se o e-mail foi recebido

### 2. Verificar logs
- No Vercel, vá em "Functions" > "Logs"
- Procure por logs relacionados ao envio de e-mails
- Verifique se há erros

### 3. Testar diferentes cenários
- E-mail válido
- E-mail inválido
- Domínio inexistente
- Caixa de spam

## 🔍 Troubleshooting

### Problema: E-mails não chegam
**Possíveis causas:**
1. Variáveis de ambiente não configuradas
2. API key inválida
3. Domínio não verificado
4. E-mails indo para spam

**Soluções:**
1. Verificar variáveis de ambiente no Vercel
2. Testar API key no serviço escolhido
3. Verificar domínio no serviço de e-mail
4. Adicionar remetente à lista de contatos

### Problema: Erro 500 na API
**Possíveis causas:**
1. Dependências não instaladas
2. Configuração incorreta
3. Limite de API atingido

**Soluções:**
1. Verificar logs no Vercel
2. Testar API localmente
3. Verificar limites do plano

### Problema: E-mails em spam
**Soluções:**
1. Configurar SPF, DKIM e DMARC
2. Usar domínio verificado
3. Manter boa reputação do remetente
4. Adicionar links de unsubscribe

## 📊 Monitoramento

### 1. Métricas importantes
- Taxa de entrega
- Taxa de abertura
- Taxa de clique
- Taxa de bounce

### 2. Ferramentas de monitoramento
- Dashboard do serviço de e-mail
- Logs do Vercel
- Google Analytics (para cliques)

## 🔒 Segurança

### 1. Proteger API keys
- Nunca commitar chaves no código
- Usar variáveis de ambiente
- Rotacionar chaves regularmente

### 2. Validação de entrada
- Validar e-mails antes do envio
- Implementar rate limiting
- Sanitizar conteúdo HTML

### 3. Privacidade
- Não armazenar conteúdo de e-mails
- Implementar GDPR compliance
- Oferecer opção de unsubscribe

## 📞 Suporte

Se você encontrar problemas:

1. **Verificar logs** no Vercel e no serviço de e-mail
2. **Testar configuração** com e-mail de teste
3. **Consultar documentação** do serviço escolhido
4. **Contatar suporte** do serviço se necessário

## 🎉 Conclusão

Com este guia, você deve conseguir configurar um sistema robusto de envio de e-mails de convite. Recomendamos usar **Resend.com** para melhor confiabilidade e facilidade de configuração.

---

**Última atualização:** Janeiro 2024
**Versão:** 1.0
