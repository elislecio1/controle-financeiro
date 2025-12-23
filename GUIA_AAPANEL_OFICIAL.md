# 🚀 Guia Oficial: Configurar Git e Webhook no aapanel

Baseado na [documentação oficial do aapanel](https://www.aapanel.com/docs/Function/Tutorial/create_for_git.html)

---

## 📋 Pré-requisitos

- ✅ Site já criado no aapanel: `cf.don.cim.br`
- ✅ Repositório no GitHub: `elislecio1/controle-financeiro`
- ✅ Plugin "Webhook" instalado no aapanel (App Store)

---

## 🔑 Passo 1: Configurar Chave SSH no GitHub

### 1.1. Copiar Chave SSH do aapanel

1. No aapanel, vá em **Site** → **cf.don.cim.br** → **Git Manager**
2. Na aba **"Repositório"**, copie a **SSH Key** que aparece no campo
3. A chave deve começar com: `ssh-ed25519 AAAAC3NzaC1IZDI1NTE5AAAAI...`

### 1.2. Adicionar Chave SSH no GitHub

1. Acesse: https://github.com/settings/keys
2. Clique em **"New SSH key"**
3. Preencha:
   - **Title**: `aapanel - cf.don.cim.br` (ou qualquer nome descritivo)
   - **Key**: Cole a chave SSH copiada do aapanel
4. Clique em **"Add SSH key"**

---

## 🔧 Passo 2: Configurar Repositório no aapanel

### 2.1. Acessar Git Manager

1. No aapanel, vá em **Site** → **cf.don.cim.br** → **Conf** → **Git Manager**
2. Ou diretamente: **Site** → **cf.don.cim.br** → **Git Manager**

### 2.2. Configurar Repositório (Aba "Repositório")

1. Na aba **"Repositório"**, preencha:
   - **Repositório**: `git@github.com:elislecio1/controle-financeiro.git` ⚠️ **DEVE SER SSH, NÃO HTTPS**
   - **Filial (Branch)**: `main`
   - **Registro**: `5` (número de backups)
   - **Script de webhook**: Deixe em branco por enquanto (vamos configurar depois)
2. Clique em **"Salvar"**
3. Aguarde a validação (deve aparecer mensagem de sucesso)

---

## 📜 Passo 3: Criar Script de Deploy (Aba "Roteiro")

### 3.1. Acessar Aba "Roteiro"

1. No Git Manager, clique na aba **"Roteiro"** (ou "Script")

### 3.2. Criar Novo Script

1. Clique em **"Criar"** ou **"Adicionar"**
2. **Alias/Nome do Script**: `cf.doncim` (ou qualquer nome descritivo)
3. **Conteúdo do Script**: Cole o conteúdo do arquivo `webhook-deploy-avancado.sh`
4. Clique em **"Salvar"**

### 3.3. Verificar Script

O script deve conter:
- ✅ Caminho correto: `/www/wwwroot/cf.don.cim.br`
- ✅ Branch correta: `main`
- ✅ Repositório SSH: `git@github.com:elislecio1/controle-financeiro.git`
- ✅ Comandos de build: `npm install` e `npm run build`

---

## 🔗 Passo 4: Associar Script ao Webhook

### 4.1. Associar Script ao Repositório

1. Volte para a aba **"Repositório"**
2. No campo **"Script de webhook"**, **selecione** o script criado (`cf.doncim`)
3. Clique em **"Salvar"**

### 4.2. Copiar URL do Webhook

1. Ainda na aba **"Repositório"**, copie a **URL do webhook**
2. Deve ser algo como:
   ```
   https://181.232.139.201:25936/hook?access_key=OjdV16tkuhIb8GyGEWvIsiTFxn9rHS6cy2Wmw8w86Ltuqwq3&site_id=15
   ```

---

## 🎣 Passo 5: Configurar Webhook no GitHub

### 5.1. Acessar Configurações do Repositório

1. Acesse: https://github.com/elislecio1/controle-financeiro/settings/hooks
2. Clique em **"Add webhook"**

### 5.2. Configurar Webhook

Preencha os campos:

- **Payload URL**: Cole a URL do webhook copiada do aapanel
- **Content type**: Selecione `application/json`
- **SSL verification**: Selecione **"Disable"** ⚠️ (importante!)
- **Which events**: Selecione **"Just the push event"** (ou "Let me select individual events" e marque apenas "Pushes")
- **Active**: Marque a caixa

### 5.3. Salvar Webhook

1. Clique em **"Add webhook"**
2. GitHub tentará enviar um teste (pode falhar, mas não é problema)

---

## ✅ Passo 6: Testar o Webhook

### 6.1. Teste Manual

1. No aapanel, acesse a URL do webhook no navegador:
   ```
   https://181.232.139.201:25936/hook?access_key=OjdV16tkuhIb8GyGEWvIsiTFxn9rHS6cy2Wmw8w86Ltuqwq3&site_id=15
   ```
2. Deve retornar: `{"code": 0}` (sucesso) ou `{"code": 1}` (erro)

### 6.2. Teste via GitHub

1. Faça uma pequena alteração no repositório (ex: adicione um comentário em um arquivo)
2. Faça commit e push:
   ```bash
   git add .
   git commit -m "Teste webhook"
   git push origin main
   ```
3. O webhook deve ser acionado automaticamente

### 6.3. Verificar Logs

1. No aapanel, vá em **Git Manager** → **"Registros de webhook"**
2. Ou verifique os logs:
   ```bash
   tail -f /www/wwwlogs/cf.don.cim.br-deploy.log
   ```

---

## 🔍 Troubleshooting

### Erro: `{"code": 1}`

**Causas comuns:**
- ❌ Script não está selecionado no campo "Script de webhook"
- ❌ Script tem erro de sintaxe
- ❌ Permissões insuficientes
- ❌ Repositório não configurado corretamente

**Solução:**
1. Verifique se o script está selecionado na aba "Repositório"
2. Execute o script manualmente para ver erros:
   ```bash
   cd /www/wwwroot/cf.don.cim.br
   bash webhook-deploy-avancado.sh
   ```

### Erro: "Failed to obtain the current submitted info"

**Causa:** Repositório não está configurado ou não foi validado.

**Solução:**
1. Configure o repositório na aba "Repositório" primeiro
2. Use SSH: `git@github.com:elislecio1/controle-financeiro.git`
3. Salve e aguarde a validação
4. Depois configure o script

### Erro: "Permission denied (publickey)"

**Causa:** Chave SSH não está configurada no GitHub.

**Solução:**
1. Verifique se a chave SSH do aapanel está adicionada no GitHub
2. Teste a conexão:
   ```bash
   ssh -T git@github.com
   ```

### Erro: "Repository not found"

**Causa:** Repositório não existe ou não tem acesso.

**Solução:**
1. Verifique se o repositório existe: https://github.com/elislecio1/controle-financeiro
2. Verifique se a chave SSH tem acesso ao repositório

---

## 📝 Checklist Final

- [ ] Chave SSH do aapanel adicionada no GitHub
- [ ] Repositório configurado no aapanel (SSH, não HTTPS)
- [ ] Script criado na aba "Roteiro"
- [ ] Script associado ao webhook na aba "Repositório"
- [ ] URL do webhook copiada
- [ ] Webhook configurado no GitHub
- [ ] Teste manual retorna `{"code": 0}`
- [ ] Push no GitHub aciona o deploy automaticamente

---

## 🎯 Resumo dos Comandos (Terminal)

Se precisar configurar manualmente via terminal:

```bash
# Ir para o diretório
cd /www/wwwroot/cf.don.cim.br

# Verificar remote (deve ser SSH)
git remote -v

# Se não for SSH, mudar:
git remote set-url origin git@github.com:elislecio1/controle-financeiro.git

# Testar conexão SSH
ssh -T git@github.com

# Verificar permissões
chown -R www:www /www/wwwroot/cf.don.cim.br
chmod -R 755 /www/wwwroot/cf.don.cim.br
```

---

## 📚 Referências

- [Documentação Oficial do aapanel - Git](https://www.aapanel.com/docs/Function/Tutorial/create_for_git.html)
- [GitHub - Adicionar Chave SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account)

---

## ⚠️ Importante

- ✅ **SEMPRE use SSH** no aapanel: `git@github.com:...`
- ❌ **NÃO use HTTPS** no aapanel: `https://github.com/...`
- ✅ **Desabilite SSL verification** no webhook do GitHub
- ✅ **Use `application/json`** como Content type no webhook

