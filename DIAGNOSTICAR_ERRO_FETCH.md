# 🔍 Diagnosticar Erro: "Erro ao fazer fetch"

## ❌ Problema

O webhook está falhando no passo de `git fetch origin`.

## 🔧 Teste Manual (Execute no Servidor)

Execute estes comandos para diagnosticar:

```bash
cd /www/wwwroot/cf.don.cim.br

# 1. Verificar remote
git remote -v

# 2. Verificar se é SSH
git remote get-url origin

# 3. Testar conexão SSH com GitHub
ssh -T git@github.com

# 4. Tentar fetch manualmente
git fetch origin

# 5. Verificar status
git status

# 6. Verificar branch
git branch -a
```

## 🔍 Possíveis Causas

### 1. Remote não configurado corretamente

**Sintoma:** `fatal: No such remote 'origin'`

**Solução:**
```bash
git remote add origin git@github.com:elislecio1/controle-financeiro.git
```

### 2. Remote usando HTTPS em vez de SSH

**Sintoma:** `Permission denied (publickey)` ou `fatal: Authentication failed`

**Solução:**
```bash
git remote set-url origin git@github.com:elislecio1/controle-financeiro.git
git remote -v
```

### 3. Chave SSH não configurada no GitHub

**Sintoma:** `Permission denied (publickey)` ao executar `ssh -T git@github.com`

**Solução:**
1. No aapanel: **Site** → **cf.don.cim.br** → **Git Manager** → **Repositório**
2. Copie a chave SSH
3. No GitHub: https://github.com/settings/keys → **New SSH key**
4. Cole a chave e salve

### 4. Branch não existe no remote

**Sintoma:** `fatal: couldn't find remote ref main`

**Solução:**
```bash
# Verificar branches disponíveis
git ls-remote --heads origin

# Se a branch for diferente, atualizar no script
```

### 5. Problema de permissões

**Sintoma:** `fatal: could not read Username`

**Solução:**
```bash
# Verificar permissões
ls -la /www/wwwroot/cf.don.cim.br/.git

# Ajustar se necessário
chown -R www:www /www/wwwroot/cf.don.cim.br
chmod -R 755 /www/wwwroot/cf.don.cim.br
```

## ✅ Script Atualizado

O script `webhook-deploy-avancado.sh` foi atualizado para:
- ✅ Verificar e corrigir remote automaticamente
- ✅ Mostrar logs detalhados do erro de fetch
- ✅ Testar conexão SSH antes de fazer fetch

## 🧪 Testar Novamente

Depois de diagnosticar e corrigir, teste o webhook:

```bash
curl -k -X POST "https://181.232.139.201:25936/hook?access_key=OjdV16tkuhIb8GyGEWvIsiTFxn9rHS6cy2Wmw8w86Ltuqwq3&site_id=15"
```

E monitore os logs:

```bash
tail -f /www/wwwlogs/cf.don.cim.br-deploy.log
```

## 📝 Enviar Resultados

Execute os comandos de diagnóstico acima e me envie:
1. Saída do `git remote -v`
2. Saída do `ssh -T git@github.com`
3. Saída do `git fetch origin` (com o erro completo)
4. Últimas linhas do log: `tail -n 50 /www/wwwlogs/cf.don.cim.br-deploy.log`

Com essas informações, posso identificar exatamente qual é o problema!

