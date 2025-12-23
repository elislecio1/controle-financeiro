# 🔄 Reverter Repositório para SSH (aapanel requer SSH)

## ⚠️ Importante

O **aapanel só aceita SSH**, não HTTPS. Se você mudou para HTTPS, precisa reverter.

---

## 🔧 Comandos para Executar no Terminal do Servidor

```bash
# 1. Ir para o diretório do projeto
cd /www/wwwroot/cf.don.cim.br

# 2. Verificar o remote atual
git remote -v

# 3. Mudar de HTTPS para SSH
git remote set-url origin git@github.com:elislecio1/controle-financeiro.git

# 4. Verificar se mudou corretamente
git remote -v

# Deve mostrar:
# origin  git@github.com:elislecio1/controle-financeiro.git (fetch)
# origin  git@github.com:elislecio1/controle-financeiro.git (push)

# 5. Testar conexão SSH
ssh -T git@github.com

# Deve retornar algo como:
# Hi elislecio1! You've successfully authenticated, but GitHub does not provide shell access.

# 6. Testar fetch
git fetch origin

# 7. Verificar status
git status
```

---

## 🔑 Verificar Chave SSH no GitHub

Se o teste SSH falhar (`Permission denied`), você precisa adicionar a chave SSH do aapanel no GitHub:

### 1. Copiar Chave SSH do aapanel

1. No aapanel: **Site** → **cf.don.cim.br** → **Git Manager** → **Repositório**
2. Copie a chave SSH que aparece no campo "SSH key"

### 2. Adicionar no GitHub

1. Acesse: https://github.com/settings/keys
2. Clique em **"New SSH key"**
3. Cole a chave e salve

---

## ✅ Depois de Reverter

1. **No aapanel**, configure o repositório:
   - **Repositório**: `git@github.com:elislecio1/controle-financeiro.git`
   - **Filial**: `main`
   - Clique em **"Salvar"**

2. **Teste o webhook** novamente

---

## 📝 Resumo

- ❌ **NÃO use**: `https://github.com/elislecio1/controle-financeiro.git`
- ✅ **USE**: `git@github.com:elislecio1/controle-financeiro.git`

