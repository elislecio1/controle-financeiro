# 🧪 Testar Deploy - Guia Rápido

## 🚀 Método 1: Teste Manual (Via Navegador/curl)

### 1. Acessar URL do Webhook

No navegador, acesse a URL do webhook:
```
https://181.232.139.201:25936/hook?access_key=OjdV16tkuhIb8GyGEWvIsiTFxn9rHS6cy2Wmw8w86Ltuqwq3&site_id=15
```

**Resposta esperada:**
- ✅ `{"code": 0}` = Sucesso, deploy iniciado
- ❌ `{"code": 1}` = Erro (verificar logs)

### 2. Via Terminal (curl)

```bash
curl -X POST "https://181.232.139.201:25936/hook?access_key=OjdV16tkuhIb8GyGEWvIsiTFxn9rHS6cy2Wmw8w86Ltuqwq3&site_id=15"
```

---

## 🚀 Método 2: Teste Real (Push no GitHub)

### 1. Fazer Alteração no Repositório

```bash
# No seu computador local
cd controle-financeiro

# Fazer uma pequena alteração (ex: adicionar comentário)
echo "# Teste deploy - $(date)" >> README.md

# Commit e push
git add README.md
git commit -m "Teste deploy automático"
git push origin main
```

### 2. Verificar se Webhook Foi Acionado

No GitHub:
1. Acesse: https://github.com/elislecio1/controle-financeiro/settings/hooks
2. Clique no webhook configurado
3. Veja "Recent deliveries" - deve aparecer uma nova entrega

---

## 📊 Monitorar Logs em Tempo Real

### Terminal 1: Logs do Deploy

```bash
tail -f /www/wwwlogs/cf.don.cim.br-deploy.log
```

### Terminal 2: Logs do aapanel

```bash
tail -f /www/server/panel/logs/error.log
```

### Terminal 3: Executar Webhook

```bash
curl -X POST "https://181.232.139.201:25936/hook?access_key=OjdV16tkuhIb8GyGEWvIsiTFxn9rHS6cy2Wmw8w86Ltuqwq3&site_id=15"
```

---

## 🔍 Verificar Resultado do Deploy

### 1. Verificar se Build Foi Criado

```bash
cd /www/wwwroot/cf.don.cim.br
ls -la dist/
```

Deve existir a pasta `dist/` com os arquivos compilados.

### 2. Verificar Último Commit

```bash
cd /www/wwwroot/cf.don.cim.br
git log -1
```

Deve mostrar o último commit do repositório.

### 3. Verificar Site no Navegador

Acesse: `https://cf.don.cim.br`

O site deve estar atualizado com as últimas mudanças.

---

## 🧪 Teste Completo Passo a Passo

### Passo 1: Preparar Teste

```bash
# No servidor, verificar estado atual
cd /www/wwwroot/cf.don.cim.br
git log -1 --oneline
ls -la dist/ | head -5
```

### Passo 2: Monitorar Logs

```bash
# Em um terminal, deixe rodando:
tail -f /www/wwwlogs/cf.don.cim.br-deploy.log
```

### Passo 3: Executar Webhook

```bash
# Em outro terminal:
curl -v -X POST "https://181.232.139.201:25936/hook?access_key=OjdV16tkuhIb8GyGEWvIsiTFxn9rHS6cy2Wmw8w86Ltuqwq3&site_id=15"
```

### Passo 4: Verificar Logs

No terminal que está monitorando, você deve ver:
```
[2025-12-15 XX:XX:XX] ==========================================
[2025-12-15 XX:XX:XX] 🚀 DEPLOY AUTOMÁTICO INICIADO
[2025-12-15 XX:XX:XX] ==========================================
...
[2025-12-15 XX:XX:XX] ✅ Deploy concluído com sucesso!
```

### Passo 5: Verificar Resultado

```bash
cd /www/wwwroot/cf.don.cim.br
git log -1 --oneline
ls -lh dist/ | head -5
```

---

## ❌ Troubleshooting

### Erro: `{"code": 1}`

**Verificar:**
1. Script está selecionado no aapanel?
2. Permissões do diretório:
   ```bash
   ls -la /www/wwwroot/cf.don.cim.br
   chown -R www:www /www/wwwroot/cf.don.cim.br
   ```

### Erro: "Script execution failed"

**Executar script manualmente:**
```bash
cd /www/wwwroot/cf.don.cim.br
bash webhook-deploy-avancado.sh
```

Isso mostrará os erros específicos.

### Erro: "Git pull failed"

**Verificar:**
```bash
cd /www/wwwroot/cf.don.cim.br
git remote -v
git fetch origin
git status
```

### Erro: "npm install failed"

**Verificar Node.js:**
```bash
node -v
npm -v
which node
which npm
```

### Erro: "Build failed"

**Verificar:**
```bash
cd /www/wwwroot/cf.don.cim.br
npm run build
```

Isso mostrará erros de compilação.

---

## ✅ Checklist de Teste

- [ ] Webhook retorna `{"code": 0}`
- [ ] Logs mostram "DEPLOY AUTOMÁTICO INICIADO"
- [ ] Git pull executado com sucesso
- [ ] npm install executado
- [ ] npm run build executado
- [ ] Pasta `dist/` criada/atualizada
- [ ] Permissões ajustadas
- [ ] Nginx recarregado
- [ ] Site atualizado no navegador

---

## 🎯 Comando Rápido de Teste

```bash
# Tudo em um comando:
curl -X POST "https://181.232.139.201:25936/hook?access_key=OjdV16tkuhIb8GyGEWvIsiTFxn9rHS6cy2Wmw8w86Ltuqwq3&site_id=15" && echo "" && sleep 5 && tail -n 20 /www/wwwlogs/cf.don.cim.br-deploy.log
```

Este comando:
1. Executa o webhook
2. Aguarda 5 segundos
3. Mostra as últimas 20 linhas do log

