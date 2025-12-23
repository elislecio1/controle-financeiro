# 🔍 Diagnosticar Erro Webhook: `{"code": 1}`

## 📋 O que significa `{"code": 1}`?

No aapanel, `{"code": 1}` geralmente indica:
- ❌ Script não foi encontrado ou não está configurado
- ❌ Erro ao executar o script
- ❌ Permissões insuficientes
- ❌ Script com erro de sintaxe
- ❌ Repositório não configurado corretamente

---

## 🔧 Passo 1: Verificar Logs do Webhook

Execute no terminal do servidor:

```bash
# Ver logs do aapanel (últimas 50 linhas)
tail -n 50 /www/server/panel/logs/error.log

# Ver logs específicos do webhook (se existir)
tail -n 50 /www/wwwlogs/cf.don.cim.br-deploy.log

# Ver todos os logs recentes
journalctl -u bt -n 50 --no-pager
```

---

## 🔧 Passo 2: Verificar se o Script está Configurado

No aapanel:
1. Vá em **Site** → **cf.don.cim.br** → **Git Manager**
2. Clique na aba **"Roteiro"**
3. Verifique se o script está salvo e visível
4. Clique na aba **"Repositório"**
5. Verifique se o campo **"Script de webhook"** está selecionado

---

## 🔧 Passo 3: Verificar Permissões do Script

Execute no terminal:

```bash
# Ir para o diretório do projeto
cd /www/wwwroot/cf.don.cim.br

# Verificar permissões do script (se estiver no diretório)
ls -la webhook-deploy-avancado.sh

# Dar permissão de execução (se necessário)
chmod +x webhook-deploy-avancado.sh

# Verificar permissões do diretório
ls -la /www/wwwroot/cf.don.cim.br
```

---

## 🔧 Passo 4: Testar o Script Manualmente

Execute o script diretamente para ver erros:

```bash
# Ir para o diretório
cd /www/wwwroot/cf.don.cim.br

# Executar o script manualmente
bash /www/wwwroot/cf.don.cim.br/webhook-deploy-avancado.sh

# Ou se estiver salvo no aapanel, verificar onde ele salva os scripts
# Geralmente em: /www/server/panel/script/
ls -la /www/server/panel/script/
```

---

## 🔧 Passo 5: Verificar Configuração do Repositório

```bash
cd /www/wwwroot/cf.don.cim.br

# Verificar remote
git remote -v

# Deve mostrar HTTPS:
# origin  https://github.com/elislecio1/controle-financeiro.git (fetch)
# origin  https://github.com/elislecio1/controle-financeiro.git (push)

# Testar conexão
git fetch origin

# Verificar branch
git branch -a
```

---

## 🔧 Passo 6: Verificar se o Script está no aapanel

O aapanel salva os scripts em um local específico. Verifique:

```bash
# Procurar scripts do aapanel
find /www/server/panel -name "*webhook*" -type f 2>/dev/null

# Ver scripts salvos
ls -la /www/server/panel/script/ 2>/dev/null || echo "Diretório não encontrado"
```

---

## 🔧 Passo 7: Configurar o Script no aapanel (Passo a Passo)

### 7.1. Criar o Script na Aba "Roteiro"

1. No aapanel, vá em **Site** → **cf.don.cim.br** → **Git Manager**
2. Clique na aba **"Roteiro"**
3. Clique em **"Criar"** ou **"Adicionar"**
4. Cole o conteúdo do arquivo `webhook-deploy-avancado.sh`
5. **Salve** o script (dê um nome, ex: `cf.doncim`)

### 7.2. Associar o Script ao Repositório

1. Vá na aba **"Repositório"**
2. No campo **"Script de webhook"**, selecione o script que você criou
3. Verifique se o campo **"Repositório"** está preenchido com:
   ```
   https://github.com/elislecio1/controle-financeiro.git
   ```
4. Verifique se o campo **"Filial"** está como `main`
5. Clique em **"Salvar"**

---

## 🔧 Passo 8: Testar o Webhook Novamente

Depois de configurar, teste:

```bash
# Via terminal
curl -X POST "https://181.232.139.201:25936/hook?access_key=OjdV16tkuhIb8GyGEWvIsiTFxn9rHS6cy2Wmw8w86Ltuqwq3&site_id=15"

# Ou via navegador (GET também funciona)
# Acesse a URL do webhook no navegador
```

**Resposta esperada:**
- ✅ `{"code": 0}` = Sucesso
- ❌ `{"code": 1}` = Erro (continue diagnosticando)

---

## 🔧 Passo 9: Verificar Logs em Tempo Real

Enquanto testa o webhook, monitore os logs:

```bash
# Terminal 1: Monitorar logs do aapanel
tail -f /www/server/panel/logs/error.log

# Terminal 2: Monitorar logs do deploy
tail -f /www/wwwlogs/cf.don.cim.br-deploy.log

# Terminal 3: Executar o webhook
curl -X POST "https://181.232.139.201:25936/hook?access_key=OjdV16tkuhIb8GyGEWvIsiTFxn9rHS6cy2Wmw8w86Ltuqwq3&site_id=15"
```

---

## 🔧 Passo 10: Verificar Variáveis de Ambiente

O script precisa de acesso ao diretório e permissões. Verifique:

```bash
# Verificar usuário atual
whoami

# Verificar se o diretório existe
ls -la /www/wwwroot/cf.don.cim.br

# Verificar permissões
stat -c "%a %U:%G" /www/wwwroot/cf.don.cim.br

# Ajustar permissões se necessário
chown -R www:www /www/wwwroot/cf.don.cim.br
chmod -R 755 /www/wwwroot/cf.don.cim.br
```

---

## ✅ Checklist de Verificação

- [ ] Script está salvo na aba "Roteiro" do aapanel
- [ ] Script está selecionado no campo "Script de webhook" da aba "Repositório"
- [ ] Repositório está configurado como HTTPS: `https://github.com/elislecio1/controle-financeiro.git`
- [ ] Branch está configurada como `main`
- [ ] Permissões do diretório estão corretas (`www:www`)
- [ ] Git remote está configurado corretamente (HTTPS)
- [ ] Logs não mostram erros críticos
- [ ] Script executa manualmente sem erros

---

## 🆘 Se Ainda Não Funcionar

1. **Verifique a versão do aapanel:**
   ```bash
   cat /www/server/panel/class/common.py | grep "version"
   ```

2. **Reinicie o painel:**
   ```bash
   bt restart
   ```

3. **Verifique se o serviço está rodando:**
   ```bash
   systemctl status bt
   ```

4. **Entre em contato com o suporte do aapanel** ou verifique a documentação oficial.

---

## 📝 Notas Importantes

- O aviso **"Não seguro"** no navegador é sobre o SSL do **painel do aapanel** (porta 25936), não sobre o site `cf.don.cim.br`
- Isso não impede o webhook de funcionar, mas pode causar avisos no navegador
- Para resolver o SSL do painel, você precisaria configurar um certificado SSL para o próprio aapanel (geralmente não é necessário)

---

## 🎯 Próximos Passos

Depois de resolver o `{"code": 1}`, você deve receber `{"code": 0}` e o deploy será executado automaticamente quando houver push no GitHub.

