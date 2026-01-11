# 📋 Como Usar o Script de Deploy no aapanel

## 🎯 Opção 1: Criar Arquivo e Executar (Recomendado)

### Passo 1: Criar o arquivo no servidor

No terminal SSH do aapanel, execute:

```bash
cd /www/wwwroot/sites/elislecio/cf.don.cim.br
nano deploy-producao-aapanel.sh
```

### Passo 2: Colar o código

1. Copie TODO o conteúdo do arquivo `CODIGO_COMPLETO_DEPLOY_COPIAR_COLAR.txt`
2. Cole no editor nano (Ctrl+Shift+V ou botão direito)
3. Salve: `Ctrl+O` → Enter → `Ctrl+X`

### Passo 3: Dar permissão de execução

```bash
chmod +x deploy-producao-aapanel.sh
```

### Passo 4: Executar

```bash
bash deploy-producao-aapanel.sh
```

---

## 🎯 Opção 2: Criar Arquivo em Uma Linha (Mais Rápido)

Execute este comando completo (substitua `SEU_CODIGO_AQUI` pelo conteúdo do arquivo):

```bash
cat > /www/wwwroot/sites/elislecio/cf.don.cim.br/deploy-producao-aapanel.sh << 'SCRIPT_EOF'
# Cole aqui TODO o conteúdo do arquivo CODIGO_COMPLETO_DEPLOY_COPIAR_COLAR.txt
SCRIPT_EOF
```

**OU** use este método alternativo:

```bash
cd /www/wwwroot/sites/elislecio/cf.don.cim.br && \
wget -O deploy-producao-aapanel.sh https://raw.githubusercontent.com/SEU_USUARIO/SEU_REPO/main/deploy-producao-aapanel.sh && \
chmod +x deploy-producao-aapanel.sh
```

---

## 🎯 Opção 3: Executar Diretamente (Sem Criar Arquivo)

Se você só quer executar uma vez, pode usar o comando simples:

```bash
cd /www/wwwroot/sites/elislecio/cf.don.cim.br && git pull origin main && npm install && npm run build && chown -R www:www . && systemctl reload nginx && echo "✅ Deploy concluído!"
```

---

## 📝 O que o Script Faz

1. ✅ Verifica se o diretório existe
2. ✅ Verifica Node.js e npm
3. ✅ Cria/verifica arquivo .env
4. ✅ Faz backup do build anterior
5. ✅ Atualiza repositório Git (git pull)
6. ✅ Instala/atualiza dependências (npm install)
7. ✅ Faz build do projeto (npm run build)
8. ✅ Ajusta permissões (chown/chmod)
9. ✅ Recarrega Nginx
10. ✅ Limpa backups antigos
11. ✅ Mostra resumo completo

---

## 🔍 Verificar Logs

Após executar, veja os logs:

```bash
tail -f /www/wwwlogs/cf.don.cim.br-deploy.log
```

---

## ✅ Resumo Rápido

**Para criar e executar:**

```bash
cd /www/wwwroot/sites/elislecio/cf.don.cim.br
nano deploy-producao-aapanel.sh
# Cole o código completo
chmod +x deploy-producao-aapanel.sh
bash deploy-producao-aapanel.sh
```

**Pronto! O deploy será executado automaticamente!** 🚀

