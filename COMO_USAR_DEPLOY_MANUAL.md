# 🚀 Como Usar o Script de Deploy Manual

## 📋 Visão Geral

O script `deploy-manual-aapanel.sh` automatiza todo o processo de deploy no aapanel:
- ✅ Atualiza o repositório Git
- ✅ Instala dependências
- ✅ Faz build do projeto
- ✅ Ajusta permissões
- ✅ Recarrega serviços (Nginx, PHP-FPM)
- ✅ Cria backup antes do deploy
- ✅ Faz rollback em caso de erro

## 🔧 Pré-requisitos

1. Acesso SSH ao servidor aapanel
2. Permissões para executar scripts
3. Node.js e npm instalados
4. Git configurado

## 📝 Como Usar

### Opção 1: Executar Diretamente

```bash
# Conectar ao servidor via SSH
ssh root@seu-servidor

# Navegar para o diretório do projeto
cd /www/wwwroot/cf.don.cim.br

# Baixar o script (se ainda não estiver no servidor)
wget https://raw.githubusercontent.com/elislecio1/controle-financeiro/main/deploy-manual-aapanel.sh

# Dar permissão de execução
chmod +x deploy-manual-aapanel.sh

# Executar o script
./deploy-manual-aapanel.sh
```

### Opção 2: Executar com Caminho Completo

```bash
# Se o script estiver em outro local
bash /caminho/para/deploy-manual-aapanel.sh
```

### Opção 3: Executar com Log Detalhado

```bash
# Salvar output em arquivo
./deploy-manual-aapanel.sh 2>&1 | tee deploy-$(date +%Y%m%d-%H%M%S).log
```

## 📊 O que o Script Faz

1. **Verifica Pré-requisitos**
   - Node.js, npm, Git
   - Diretório do projeto

2. **Cria Backup**
   - Backup da pasta `dist` antes do deploy
   - Mantém os últimos 5 backups

3. **Atualiza Repositório**
   - Faz `git fetch` e `git pull`
   - Verifica se há atualizações
   - Faz stash de mudanças locais se necessário

4. **Instala Dependências**
   - Executa `npm install`
   - Instala todas as dependências (dev e prod)

5. **Faz Build**
   - Executa `npm run build`
   - Verifica se a pasta `dist` foi criada

6. **Ajusta Permissões**
   - Define dono como `www:www`
   - Ajusta permissões para 755

7. **Recarrega Serviços**
   - Testa configuração do Nginx
   - Recarrega Nginx
   - Recarrega PHP-FPM (se aplicável)

8. **Verifica Status**
   - Verifica se serviços estão rodando
   - Testa se o site está acessível

## 🔍 Verificar Logs

```bash
# Ver log do deploy
tail -f /www/wwwlogs/cf.don.cim.br-deploy-manual.log

# Ver últimas 50 linhas
tail -n 50 /www/wwwlogs/cf.don.cim.br-deploy-manual.log

# Buscar erros no log
grep -i error /www/wwwlogs/cf.don.cim.br-deploy-manual.log
```

## ⚙️ Configurações

O script usa estas configurações (edite se necessário):

```bash
PROJECT_DIR="/www/wwwroot/cf.don.cim.br"
GIT_BRANCH="main"
GIT_REPO="git@github.com:elislecio1/controle-financeiro.git"
LOG_FILE="/www/wwwlogs/cf.don.cim.br-deploy-manual.log"
BACKUP_DIR="/www/backups/cf.don.cim.br"
MAX_BACKUPS=5
```

## 🛠️ Solução de Problemas

### Erro: "Diretório não é um repositório Git"
```bash
cd /www/wwwroot/cf.don.cim.br
git init
git remote add origin git@github.com:elislecio1/controle-financeiro.git
git fetch origin
git checkout -b main origin/main
```

### Erro: "Node.js não está instalado"
```bash
# Instalar Node.js via aapanel ou:
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs
```

### Erro: "Erro ao fazer build"
```bash
# Verificar erros de TypeScript
cd /www/wwwroot/cf.don.cim.br
npm run build 2>&1 | tee build-errors.log

# Verificar se há erros de sintaxe
npm run type-check  # se disponível
```

### Erro: "Nginx não recarregou"
```bash
# Verificar configuração
nginx -t

# Recarregar manualmente
systemctl reload nginx
# ou
service nginx reload
```

### Rollback Manual
```bash
# Listar backups disponíveis
ls -lt /www/backups/cf.don.cim.br/

# Restaurar backup específico
rm -rf /www/wwwroot/cf.don.cim.br/dist
cp -r /www/backups/cf.don.cim.br/backup-YYYYMMDD-HHMMSS /www/wwwroot/cf.don.cim.br/dist
chown -R www:www /www/wwwroot/cf.don.cim.br/dist
chmod -R 755 /www/wwwroot/cf.don.cim.br/dist
systemctl reload nginx
```

## 📞 Comandos Úteis

```bash
# Ver status do Git
cd /www/wwwroot/cf.don.cim.br
git status
git log --oneline -5

# Verificar espaço em disco
df -h

# Verificar processos Node
ps aux | grep node

# Verificar portas em uso
netstat -tulpn | grep :80
netstat -tulpn | grep :443

# Verificar logs do Nginx
tail -f /www/wwwlogs/access.log
tail -f /www/wwwlogs/error.log
```

## ✅ Checklist Pós-Deploy

- [ ] Site está acessível: `https://cf.don.cim.br`
- [ ] Build foi criado: `ls -lh /www/wwwroot/cf.don.cim.br/dist`
- [ ] Nginx está rodando: `systemctl status nginx`
- [ ] Sem erros no console do navegador
- [ ] Funcionalidades principais funcionando

## 🎯 Dicas

1. **Sempre faça backup antes de deploy manual**
2. **Execute em horário de baixo tráfego**
3. **Monitore os logs durante o deploy**
4. **Teste o site após o deploy**
5. **Mantenha os backups organizados**

