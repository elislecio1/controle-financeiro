# 🔗 Configurar Webhook para Deploy Automático

## 📋 Visão Geral

Este guia explica como configurar o webhook no aapanel para fazer deploy automático sempre que houver push no repositório GitHub.

---

## 🚀 Passo 1: Criar Script de Webhook

### Opção A: Script Básico (Recomendado para começar)

1. No aapanel, vá em **Website** → `cf.don.cim.br` → **Settings** → **Git Manager**
2. Clique na aba **"Repositório"**
3. Em **"Script de webhook"**, clique em **"Criar"**
4. Cole o conteúdo do arquivo `webhook-deploy.sh`
5. Salve o script

### Opção B: Script Avançado (Com backup e rollback)

Use o arquivo `webhook-deploy-avancado.sh` se quiser:
- Backup automático antes do deploy
- Rollback em caso de erro
- Validações extras
- Melhor tratamento de erros

---

## ⚙️ Passo 2: Configurar Repositório

No aapanel, em **Git Manager** → **Repositório**:

1. **Provedor Git**: Personalizado
2. **SSH key**: Sua chave SSH (já configurada)
3. **Repositório**: `git@github.com:elislecio1/controle-financeiro.git`
4. **Filial**: `main`
5. **Registro**: `5` (número de backups)
6. **Script de webhook**: Selecione o script criado
7. Clique em **"Salvar"**

---

## 🔗 Passo 3: Configurar Webhook no GitHub

1. Acesse: https://github.com/elislecio1/controle-financeiro/settings/hooks
2. Clique em **"Add webhook"**
3. Configure:
   - **Payload URL**: `https://181.232.139.201:25936/hook?access_key=OjdV16tkuhIb8GyGEWvIsiTFxn9rHS6cy2Wmw8w86Ltuqwq3&site_id=15`
   - **Content type**: `application/json`
   - **Events**: Selecione **"Just the push event"**
   - **Active**: ✅ Marcado
4. Clique em **"Add webhook"**

---

## 🧪 Passo 4: Testar Webhook

### Teste Manual

1. Faça uma pequena alteração no repositório
2. Faça commit e push:
   ```bash
   git add .
   git commit -m "Teste de webhook"
   git push origin main
   ```
3. Verifique os logs:
   ```bash
   tail -f /www/wwwlogs/cf.don.cim.br-deploy.log
   ```

### Teste via cURL

```bash
curl -X POST "https://181.232.139.201:25936/hook?access_key=OjdV16tkuhIb8GyGEWvIsiTFxn9rHS6cy2Wmw8w86Ltuqwq3&site_id=15"
```

---

## 📝 O Que o Script Faz

1. ✅ **Atualiza repositório** (git pull)
2. ✅ **Verifica atualizações** (não executa se já estiver atualizado)
3. ✅ **Instala dependências** (npm install)
4. ✅ **Faz build** (npm run build)
5. ✅ **Ajusta permissões** (chown, chmod)
6. ✅ **Recarrega Nginx** (se necessário)
7. ✅ **Registra logs** (tudo é logado)

---

## 🔍 Verificar Logs

```bash
# Ver logs em tempo real
tail -f /www/wwwlogs/cf.don.cim.br-deploy.log

# Ver últimas 50 linhas
tail -n 50 /www/wwwlogs/cf.don.cim.br-deploy.log

# Buscar erros
grep "❌" /www/wwwlogs/cf.don.cim.br-deploy.log
```

---

## 🐛 Troubleshooting

### Webhook não executa

**Verificar**:
1. URL do webhook está correta
2. Access key está correta
3. Script foi criado e selecionado
4. Permissões do script (deve ser executável)

**Solução**:
```bash
chmod +x /www/server/panel/script/webhook-deploy.sh
```

### Erro: "git pull failed"

**Causa**: Problemas de autenticação SSH

**Solução**:
1. Verificar se a chave SSH está configurada
2. Testar manualmente:
   ```bash
   cd /www/wwwroot/cf.don.cim.br
   git pull origin main
   ```

### Erro: "npm install failed"

**Causa**: Problemas de permissão ou dependências

**Solução**:
```bash
cd /www/wwwroot/cf.don.cim.br
chown -R www:www .
npm install
```

### Build falha

**Verificar**:
1. Variáveis de ambiente (.env)
2. Dependências instaladas
3. Logs de erro do build

---

## 🔒 Segurança

### Proteger Access Key

O access key do webhook deve ser mantido em segredo:
- ✅ Não commitar no repositório
- ✅ Não compartilhar publicamente
- ✅ Rotacionar periodicamente

### Atualizar Access Key

No aapanel:
1. **Git Manager** → **Repositório**
2. Clique em **"Atualizar token"**
3. Copie o novo token
4. Atualize no GitHub

---

## 📊 Monitoramento

### Verificar Último Deploy

```bash
# Ver último commit deployado
cd /www/wwwroot/cf.don.cim.br
git log -1

# Ver último deploy nos logs
tail -n 20 /www/wwwlogs/cf.don.cim.br-deploy.log | grep "DEPLOY CONCLUÍDO"
```

### Estatísticas

```bash
# Contar deploys bem-sucedidos
grep -c "DEPLOY CONCLUÍDO" /www/wwwlogs/cf.don.cim.br-deploy.log

# Contar erros
grep -c "❌" /www/wwwlogs/cf.don.cim.br-deploy.log
```

---

## ✅ Checklist de Configuração

- [ ] Script de webhook criado no aapanel
- [ ] Repositório configurado no aapanel
- [ ] Webhook configurado no GitHub
- [ ] Teste manual executado com sucesso
- [ ] Logs sendo gerados corretamente
- [ ] Deploy automático funcionando

---

## 🎯 Próximos Passos

Após configurar o webhook:

1. **Testar**: Faça um push e verifique se o deploy acontece
2. **Monitorar**: Acompanhe os logs nas primeiras execuções
3. **Otimizar**: Ajuste o script conforme necessário

---

**✅ Com o webhook configurado, cada push no GitHub fará deploy automático!**

