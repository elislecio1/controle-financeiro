# 🔧 Solucionar Erro: "Failed to obtain the current submitted info"

## ❌ Erro Encontrado

```
Failed to obtain the current submitted info. 
Please check if the repository is correct!
```

## 🔍 Causa do Problema

O aapanel precisa validar o repositório Git **ANTES** de permitir a implantação do script de webhook. Isso acontece quando:

1. O repositório não está configurado corretamente no Git Manager
2. O aapanel está tentando usar HTTPS em vez de SSH (ou vice-versa)
3. A configuração do repositório está incompleta

---

## ✅ Solução Passo a Passo

### **Passo 1: Configurar o Repositório PRIMEIRO**

No aapanel, vá em **Website** → `cf.don.cim.br` → **Git Manager** → **Repositório**

Configure nesta ordem:

1. **Provedor Git**: Selecione **"Personalizado"** ou **"GitHub"**
2. **Repositório**: Use uma das opções abaixo:

   **Opção A - HTTPS (Mais fácil):**
   ```
   https://github.com/elislecio1/controle-financeiro.git
   ```

   **Opção B - SSH (Se já tiver chave SSH configurada):**
   ```
   git@github.com:elislecio1/controle-financeiro.git
   ```

3. **Filial (Branch)**: `main`
4. **Registro**: `5` (número de backups)
5. **Clique em "Salvar"** e aguarde a validação

### **Passo 2: Verificar se o Repositório Foi Validado**

Após salvar, o aapanel deve:
- ✅ Mostrar uma mensagem de sucesso
- ✅ Exibir informações do repositório
- ✅ Permitir fazer "Pull" manualmente

Se aparecer erro, tente a outra opção (HTTPS ou SSH).

### **Passo 3: Configurar o Script de Webhook**

Agora que o repositório está configurado:

1. No aapanel, vá em **Website** → `cf.don.cim.br` → **Settings** → **Webhook**
2. Ou vá em **Git Manager** → **Roteiro** (aba)
3. No campo **"Implantar script"**, cole o conteúdo do arquivo `webhook-deploy-avancado.sh`
4. **Clique em "Salvar"**

### **Passo 4: Associar o Script ao Repositório**

1. Volte em **Git Manager** → **Repositório**
2. No campo **"Script de webhook"**, selecione o script que você acabou de criar
3. **Clique em "Salvar"**

---

## 🔄 Alternativa: Usar HTTPS em vez de SSH

Se o SSH não funcionar, use HTTPS:

### **No Terminal do Servidor:**

```bash
cd /www/wwwroot/cf.don.cim.br

# Verificar remote atual
git remote -v

# Se estiver usando SSH, mudar para HTTPS
git remote set-url origin https://github.com/elislecio1/controle-financeiro.git

# Verificar novamente
git remote -v
```

### **No aapanel:**

1. **Git Manager** → **Repositório**
2. **Repositório**: `https://github.com/elislecio1/controle-financeiro.git`
3. **Salvar**

---

## 🧪 Testar a Configuração

### **Teste 1: Pull Manual**

No aapanel:
- **Git Manager** → **Repositório** → **"Pull"**

Deve funcionar sem erros.

### **Teste 2: Deploy Manual**

No aapanel:
- **Git Manager** → **Roteiro** → **"Implantar"**

Deve executar o script sem erros.

---

## 🐛 Se Ainda Der Erro

### **Erro: "Repository not found"**

**Causa**: Repositório privado ou URL incorreta

**Solução**:
1. Verifique se o repositório é público ou se você tem acesso
2. Se for privado, configure token de acesso no aapanel

### **Erro: "Permission denied"**

**Causa**: Problemas de permissão SSH

**Solução**:
```bash
# Verificar permissões
ls -la /www/wwwroot/cf.don.cim.br/.git

# Ajustar permissões
chown -R www:www /www/wwwroot/cf.don.cim.br
chmod -R 755 /www/wwwroot/cf.don.cim.br
```

### **Erro: "Connection timeout"**

**Causa**: Firewall bloqueando conexão com GitHub

**Solução**:
1. Verifique se o servidor tem acesso à internet
2. Teste manualmente:
   ```bash
   ping github.com
   ```

---

## 📋 Checklist Final

- [ ] Repositório configurado no Git Manager (HTTPS ou SSH)
- [ ] Repositório validado com sucesso
- [ ] Script de webhook criado e salvo
- [ ] Script associado ao repositório
- [ ] Pull manual funciona
- [ ] Deploy manual funciona
- [ ] Webhook configurado no GitHub (opcional)

---

## 🎯 Ordem Correta de Configuração

1. ✅ **PRIMEIRO**: Configurar repositório no Git Manager
2. ✅ **SEGUNDO**: Criar script de webhook
3. ✅ **TERCEIRO**: Associar script ao repositório
4. ✅ **QUARTO**: Testar pull/deploy manual
5. ✅ **QUINTO**: Configurar webhook no GitHub (opcional)

---

**⚠️ IMPORTANTE**: Sempre configure o repositório ANTES de tentar implantar o script!

