# 🔧 Solucionar Conflito com .htaccess

## Problema
O Git está impedindo o pull porque há um arquivo `.htaccess` não rastreado que seria sobrescrito.

## Solução Rápida

Execute estes comandos no servidor:

```bash
cd /www/wwwroot/cf.don.cim.br

# Opção 1: Fazer backup e remover o .htaccess local
mv .htaccess .htaccess.backup 2>/dev/null || true

# Agora fazer pull
git pull origin main

# Se o .htaccess for necessário, ele virá do repositório
# Se não vier, restaure o backup:
# cp .htaccess.backup .htaccess
```

## Solução Completa (Recomendada)

```bash
cd /www/wwwroot/cim.br

# 1. Fazer backup do .htaccess se existir
if [ -f .htaccess ]; then
    cp .htaccess .htaccess.local-backup
    echo "Backup do .htaccess criado: .htaccess.local-backup"
fi

# 2. Remover arquivos não rastreados que podem conflitar
git clean -fd

# 3. Fazer pull
git pull origin main

# 4. Se precisar do .htaccess local, restaure:
# cp .htaccess.local-backup .htaccess
```

## Usar o Script Atualizado

O script `deploy-manual-aapanel.sh` foi atualizado para lidar com isso automaticamente. Execute:

```bash
cd /www/wwwroot/cf.don.cim.br
git pull origin main  # Primeiro, atualizar o script
chmod +x deploy-manual-aapanel.sh
./deploy-manual-aapanel.sh
```

O script agora:
- ✅ Detecta arquivos não rastreados
- ✅ Faz backup antes de remover
- ✅ Remove apenas arquivos que conflitam
- ✅ Continua com o deploy normalmente

