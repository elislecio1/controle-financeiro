# 🚀 Comando para Deploy em Produção - aapanel

## 📋 Opção 1: Script Completo (Recomendado)

### Passo 1: Baixar o script
Execute no terminal SSH do servidor:

```bash
cd /www/wwwroot/sites/elislecio/cf.don.cim.br
wget -O deploy-producao-aapanel.sh https://raw.githubusercontent.com/elislecio1/controle-financeiro/main/deploy-producao-aapanel.sh
```

**OU** se o arquivo já estiver no repositório:

```bash
cd /www/wwwroot/sites/elislecio/cf.don.cim.br
git pull origin main
chmod +x deploy-producao-aapanel.sh
```

### Passo 2: Executar o script
```bash
bash deploy-producao-aapanel.sh
```

---

## 📋 Opção 2: Comando Único (Copiar e Colar)

Execute este comando completo no terminal SSH do servidor:

```bash
cd /www/wwwroot/sites/elislecio/cf.don.cim.br && \
echo "🚀 Iniciando deploy..." && \
git fetch origin && \
git pull origin main && \
echo "📦 Instalando dependências..." && \
npm install && \
echo "🔨 Fazendo build..." && \
npm run build && \
echo "🔐 Ajustando permissões..." && \
sudo chown -R www:www /www/wwwroot/sites/elislecio/cf.don.cim.br && \
sudo chmod -R 755 /www/wwwroot/sites/elislecio/cf.don.cim.br && \
sudo chmod -R 755 dist/ && \
echo "🔄 Recarregando Nginx..." && \
sudo nginx -t && sudo systemctl reload nginx && \
echo "✅ Deploy concluído! Acesse: https://cf.don.cim.br"
```

---

## 📋 Opção 3: Comando Simplificado (Sem Verificações)

Se você tem certeza de que tudo está configurado:

```bash
cd /www/wwwroot/sites/elislecio/cf.don.cim.br && git pull origin main && npm install && npm run build && sudo chown -R www:www . && sudo systemctl reload nginx && echo "✅ Deploy concluído!"
```

---

## 📋 Opção 4: Via aapanel (Interface Web)

### Método 1: Git Manager
1. Acesse o aapanel: `https://seu-ip:porta`
2. Vá em **Website** → `cf.don.cim.br`
3. Clique em **Settings** → **Git Manager**
4. Clique em **Pull** ou **Deploy**
5. Aguarde o processo concluir

### Método 2: Terminal SSH do aapanel
1. Acesse o aapanel
2. Vá em **Terminal** (ou **SSH**)
3. Execute um dos comandos acima

---

## 🔧 Configuração Inicial (Apenas Primeira Vez)

Se o repositório ainda não foi clonado:

```bash
cd /www/wwwroot
git clone https://github.com/seu-usuario/controle-financeiro.git cf.don.cim.br
cd cf.don.cim.br
npm install
npm run build
sudo chown -R www:www /www/wwwroot/sites/elislecio/cf.don.cim.br
```

---

## 📝 Verificar se Funcionou

### 1. Verificar Build
```bash
ls -la /www/wwwroot/sites/elislecio/cf.don.cim.br/dist/
```

Deve mostrar `index.html` e outros arquivos.

### 2. Verificar Site
Acesse no navegador: `https://cf.don.cim.br`

### 3. Verificar Logs
```bash
# Logs do deploy
tail -f /www/wwwlogs/cf.don.cim.br-deploy.log

# Logs de erro do Nginx
tail -f /www/wwwlogs/cf.don.cim.br.error.log

# Logs de acesso
tail -f /www/wwwlogs/cf.don.cim.br.log
```

---

## 🐛 Troubleshooting

### Erro: "git: command not found"
```bash
# Instalar Git pelo aapanel
# App Store → Git → Install
```

### Erro: "Node.js não encontrado"
```bash
# Instalar Node.js pelo aapanel
# App Store → Node.js Version Manager → Install
```

### Erro: "Permission denied"
```bash
sudo chown -R www:www /www/wwwroot/sites/elislecio/cf.don.cim.br
sudo chmod -R 755 /www/wwwroot/sites/elislecio/cf.don.cim.br
```

### Erro: "Build falhou"
```bash
# Limpar e reinstalar
cd /www/wwwroot/sites/elislecio/cf.don.cim.br
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

### Erro: "Nginx não recarrega"
```bash
# Verificar configuração
sudo nginx -t

# Se estiver OK, recarregar manualmente
sudo systemctl reload nginx

# Ou reiniciar
sudo systemctl restart nginx
```

---

## ⚡ Comando Rápido para Atualizações Futuras

Depois da primeira configuração, use este comando para atualizar:

```bash
cd /www/wwwroot/sites/elislecio/cf.don.cim.br && git pull && npm install && npm run build && sudo chown -R www:www . && sudo systemctl reload nginx
```

Ou crie um alias:

```bash
echo 'alias deploy-cf="cd /www/wwwroot/sites/elislecio/cf.don.cim.br && git pull && npm install && npm run build && sudo chown -R www:www . && sudo systemctl reload nginx"' >> ~/.bashrc
source ~/.bashrc
```

Depois use apenas:
```bash
deploy-cf
```

---

## 📊 Checklist de Deploy

Antes de executar:
- [ ] Repositório Git configurado
- [ ] Node.js instalado
- [ ] Arquivo .env configurado
- [ ] Nginx configurado
- [ ] SSL configurado (se usar HTTPS)

Após executar:
- [ ] Build criado em `dist/`
- [ ] Permissões corretas
- [ ] Nginx recarregado
- [ ] Site acessível
- [ ] Sem erros nos logs

---

## 🎯 Resumo

**Para deploy rápido, use:**
```bash
cd /www/wwwroot/sites/elislecio/cf.don.cim.br && git pull origin main && npm install && npm run build && sudo chown -R www:www . && sudo systemctl reload nginx
```

**Para deploy completo com verificações, use:**
```bash
bash deploy-producao-aapanel.sh
```

---

✅ **Pronto! Seu sistema estará atualizado e rodando em produção!**

