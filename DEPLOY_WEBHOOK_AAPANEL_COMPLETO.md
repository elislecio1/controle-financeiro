# 🚀 Script de Deploy Completo para aapanel Webhook

## 📋 Script Completo para Webhook

Use este script no aapanel: **Git Manager → Script → Create/Select**

---

## 🔧 Script Completo

Copie e cole este script completo no aapanel:

```bash
#!/bin/bash

# Diretório do projeto
PROJECT_DIR="/www/wwwroot/sites/elislecio/cf.don.cim.br"
BRANCH="main"

# Mudar para o diretório
cd "$PROJECT_DIR" || exit 1

# 1. Atualizar Git
git fetch origin
git stash 2>/dev/null
git pull origin "$BRANCH"

# 2. Criar .env se não existir
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
VITE_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
NEXT_PUBLIC_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
EOF
fi

# 3. Instalar dependências
npm install

# 4. Build
npm run build

# 5. Permissões
chown -R www:www "$PROJECT_DIR"
chmod -R 755 "$PROJECT_DIR"
chmod -R 755 dist/

# 6. Recarregar Nginx
nginx -t && systemctl reload nginx

echo "✅ Deploy concluído!"
```

---

## 📝 Como Configurar no aapanel

### Passo 1: Criar o Script

1. Acesse o aapanel
2. Vá em **Website** → `cf.don.cim.br`
3. Clique em **Git Manager**
4. Vá na aba **Script**
5. Clique em **Create**
6. Nome do script: `deploy-completo`
7. Cole o script completo acima
8. Clique em **Save**

### Passo 2: Selecionar o Script

1. No campo **Webhook Script**, selecione `deploy-completo`
2. Clique em **Save** no final da página

### Passo 3: Testar

1. Faça push para o repositório GitHub
2. Ou use o **Webhook URL** para acionar manualmente:
   ```
   https://181.232.139.201:26187/hook?access_key=UD67WTYP
   ```
3. O deploy será executado automaticamente

---

## 🔍 Versão Detalhada (com logs)

Se quiser uma versão com logs mais detalhados, use o arquivo:
- `webhook-deploy-aapanel.sh`

---

## ✅ O que o Script Faz

1. ✅ **Atualiza repositório** (`git pull`)
2. ✅ **Cria .env** (se não existir)
3. ✅ **Instala dependências** (`npm install`)
4. ✅ **Faz build** (`npm run build`)
5. ✅ **Ajusta permissões** (`chown` e `chmod`)
6. ✅ **Recarrega Nginx** (`systemctl reload nginx`)

---

## 🐛 Troubleshooting

### Erro: "npm: command not found"
**Solução**: Instale Node.js pelo aapanel: App Store → Node.js Version Manager

### Erro: "git: command not found"
**Solução**: Instale Git pelo aapanel: App Store → Git

### Erro: "Permission denied"
**Solução**: O script ajusta permissões automaticamente. Se persistir, execute manualmente:
```bash
chown -R www:www /www/wwwroot/sites/elislecio/cf.don.cim.br
```

### Erro: "Build falhou"
**Solução**: 
- Verifique se o arquivo `.env` está configurado
- Verifique os logs do build no aapanel
- Execute `npm install` manualmente primeiro

---

## 📊 Verificar se Funcionou

Após o deploy, verifique:

1. **Pasta dist criada:**
   ```bash
   ls -la /www/wwwroot/sites/elislecio/cf.don.cim.br/dist/
   ```

2. **Site funcionando:**
   - Acesse: https://cf.don.cim.br

3. **Logs do deploy:**
   - No aapanel: Git Manager → Webhook Logs
   - Ou em: `/tmp/deploy-*.log`

---

## 🎯 Resumo

1. **Copie o script** acima
2. **Cole no aapanel** (Git Manager → Script → Create)
3. **Selecione o script** no Git Manager
4. **Faça push** ou acione o webhook
5. **Deploy automático!**

---

**✅ Pronto! Use este script no aapanel para deploy automático!**

