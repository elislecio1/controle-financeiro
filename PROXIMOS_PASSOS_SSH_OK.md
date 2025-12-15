# ✅ SSH Funcionando - Próximos Passos

## ✅ Status Atual

- ✅ SSH autenticado no GitHub com sucesso
- ✅ Remote configurado para SSH

---

## 🔍 Verificar Configuração do Git

Execute para confirmar:

```bash
cd /www/wwwroot/cf.don.cim.br
git remote -v
```

**Deve mostrar:**
```
origin  git@github.com:elislecio1/controle-financeiro.git (fetch)
origin  git@github.com:elislecio1/controle-financeiro.git (push)
```

---

## 🔧 Configurar no aapanel

### Passo 1: Configurar Repositório

1. No aapanel, vá em **Site** → **cf.don.cim.br** → **Git Manager**
2. Clique na aba **"Repositório"**
3. Preencha:
   - **Repositório**: `git@github.com:elislecio1/controle-financeiro.git`
   - **Filial**: `main`
   - **Registro**: `5`
   - **Script de webhook**: Deixe em branco por enquanto
4. Clique em **"Salvar"**
5. Aguarde a validação (deve aparecer mensagem de sucesso)

### Passo 2: Criar Script de Deploy

1. Clique na aba **"Roteiro"** (ou "Script")
2. Clique em **"Criar"** ou **"Adicionar"**
3. **Alias/Nome**: `cf.doncim` (ou qualquer nome)
4. **Conteúdo**: Cole o conteúdo do arquivo `webhook-deploy-avancado.sh`
5. Clique em **"Salvar"**

### Passo 3: Associar Script ao Webhook

1. Volte para a aba **"Repositório"**
2. No campo **"Script de webhook"**, **selecione** o script criado (`cf.doncim`)
3. Clique em **"Salvar"**

### Passo 4: Copiar URL do Webhook

1. Ainda na aba **"Repositório"**, copie a **URL do webhook**
2. Deve ser algo como:
   ```
   https://181.232.139.201:25936/hook?access_key=OjdV16tkuhIb8GyGEWvIsiTFxn9rHS6cy2Wmw8w86Ltuqwq3&site_id=15
   ```

---

## 🎣 Configurar Webhook no GitHub

1. Acesse: https://github.com/elislecio1/controle-financeiro/settings/hooks
2. Clique em **"Add webhook"**
3. Preencha:
   - **Payload URL**: Cole a URL do webhook do aapanel
   - **Content type**: `application/json`
   - **SSL verification**: **Disable** ⚠️ (importante!)
   - **Which events**: **Just the push event**
   - **Active**: Marque a caixa
4. Clique em **"Add webhook"**

---

## ✅ Testar o Webhook

### Teste 1: Manual (Navegador)

Acesse a URL do webhook no navegador. Deve retornar:
- ✅ `{"code": 0}` = Sucesso
- ❌ `{"code": 1}` = Erro (verifique logs)

### Teste 2: Via GitHub

1. Faça uma pequena alteração no repositório
2. Commit e push:
   ```bash
   git add .
   git commit -m "Teste webhook"
   git push origin main
   ```
3. O webhook deve ser acionado automaticamente

### Verificar Logs

```bash
# Ver logs do deploy
tail -f /www/wwwlogs/cf.don.cim.br-deploy.log

# Ou no aapanel: Git Manager → "Registros de webhook"
```

---

## 📋 Checklist Final

- [ ] Remote Git configurado para SSH ✅
- [ ] SSH autenticado no GitHub ✅
- [ ] Repositório configurado no aapanel (aba "Repositório")
- [ ] Script criado no aapanel (aba "Roteiro")
- [ ] Script associado ao webhook (aba "Repositório")
- [ ] Webhook configurado no GitHub
- [ ] Teste manual retorna `{"code": 0}`
- [ ] Push no GitHub aciona deploy automaticamente

---

## 🆘 Se Der Erro `{"code": 1}`

1. Verifique se o script está **selecionado** no campo "Script de webhook"
2. Execute o script manualmente para ver erros:
   ```bash
   cd /www/wwwroot/cf.don.cim.br
   bash webhook-deploy-avancado.sh
   ```
3. Verifique os logs:
   ```bash
   tail -n 50 /www/server/panel/logs/error.log
   tail -n 50 /www/wwwlogs/cf.don.cim.br-deploy.log
   ```

---

## 🎯 Próximo Passo Imediato

**Agora configure no aapanel:**
1. Aba "Repositório" → Preencha com `git@github.com:elislecio1/controle-financeiro.git`
2. Salve e aguarde validação
3. Me avise se funcionou ou se apareceu algum erro!

