# 🚀 Comandos Rápidos - Diagnosticar Webhook `{"code": 1}`

## 1️⃣ Verificar Logs (Execute no Terminal do Servidor)

```bash
# Ver logs do aapanel
tail -n 50 /www/server/panel/logs/error.log

# Ver logs do deploy (se existir)
tail -n 50 /www/wwwlogs/cf.don.cim.br-deploy.log 2>/dev/null || echo "Log ainda não criado"

# Ver logs em tempo real (deixe rodando e teste o webhook)
tail -f /www/server/panel/logs/error.log
```

---

## 2️⃣ Verificar Configuração do Git

```bash
cd /www/wwwroot/cf.don.cim.br

# Verificar remote (deve ser HTTPS)
git remote -v

# Testar conexão
git fetch origin

# Verificar status
git status
```

---

## 3️⃣ Verificar Permissões

```bash
# Verificar permissões do diretório
ls -la /www/wwwroot/cf.don.cim.br | head -5

# Ajustar permissões se necessário
chown -R www:www /www/wwwroot/cf.don.cim.br
chmod -R 755 /www/wwwroot/cf.don.cim.br
```

---

## 4️⃣ Testar Script Manualmente

```bash
cd /www/wwwroot/cf.don.cim.br

# Executar o script diretamente (vai mostrar erros se houver)
bash webhook-deploy-avancado.sh
```

---

## 5️⃣ Verificar se Script está no aapanel

```bash
# Procurar scripts salvos
find /www/server/panel -name "*cf.don*" -o -name "*webhook*" 2>/dev/null
```

---

## 6️⃣ Testar Webhook

```bash
# Testar via curl
curl -X POST "https://181.232.139.201:25936/hook?access_key=OjdV16tkuhIb8GyGEWvIsiTFxn9rHS6cy2Wmw8w86Ltuqwq3&site_id=15"

# Ou com mais detalhes
curl -v -X POST "https://181.232.139.201:25936/hook?access_key=OjdV16tkuhIb8GyGEWvIsiTFxn9rHS6cy2Wmw8w86Ltuqwq3&site_id=15"
```

---

## ✅ Checklist Rápido no aapanel

1. **Aba "Roteiro":**
   - [ ] Script está salvo?
   - [ ] Nome do script: `cf.doncim` (ou outro nome que você escolheu)

2. **Aba "Repositório":**
   - [ ] Campo "Repositório" = `https://github.com/elislecio1/controle-financeiro.git`
   - [ ] Campo "Filial" = `main`
   - [ ] Campo "Script de webhook" = **selecionado** (não "Por favor selecione")
   - [ ] Clique em **"Salvar"**

---

## 🎯 O Que Fazer Agora

1. **Execute os comandos acima** para verificar logs e configurações
2. **No aapanel**, verifique se o script está configurado corretamente
3. **Teste o webhook novamente** e veja os logs em tempo real
4. **Me envie os resultados** dos logs para eu ajudar a identificar o problema específico

---

## 📝 Resumo do Problema

O `{"code": 1}` geralmente significa:
- Script não está selecionado no campo "Script de webhook"
- Script tem erro de sintaxe
- Permissões insuficientes
- Repositório não configurado

**A causa mais comum é o script não estar selecionado no campo "Script de webhook" da aba "Repositório".**

