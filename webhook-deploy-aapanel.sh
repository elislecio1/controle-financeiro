#!/bin/bash

###############################################################################
# 🚀 Script de Deploy Completo para aapanel Webhook
# 
# Este script é executado quando o webhook é acionado
# Execute no aapanel: Git Manager → Script → Create/Select
#
# O script:
# 1. Atualiza o repositório Git (pull)
# 2. Instala/atualiza dependências
# 3. Faz build do projeto
# 4. Ajusta permissões
# 5. Recarrega Nginx
###############################################################################

# Cores para output (opcional, funciona melhor em terminal)
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Diretório do projeto
PROJECT_DIR="/www/wwwroot/sites/elislecio/cf.don.cim.br"
BRANCH="main"

# Arquivo de log
LOG_FILE="/tmp/deploy-$(date +%Y%m%d-%H%M%S).log"

# Função para log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Mudar para o diretório do projeto
cd "$PROJECT_DIR" || {
    echo "❌ Erro: Não foi possível acessar o diretório $PROJECT_DIR"
    exit 1
}

log "🚀 Iniciando deploy..."
log "📁 Diretório: $PROJECT_DIR"
log "🌿 Branch: $BRANCH"

# 1. Atualizar repositório Git
log "📥 Atualizando repositório Git..."
git fetch origin 2>&1 | tee -a "$LOG_FILE"

# Verificar se há mudanças locais
if [ -n "$(git status --porcelain)" ]; then
    log "⚠️ Há mudanças locais, fazendo stash..."
    git stash 2>&1 | tee -a "$LOG_FILE"
fi

# Fazer pull
git pull origin "$BRANCH" 2>&1 | tee -a "$LOG_FILE"

if [ $? -ne 0 ]; then
    log "❌ Erro ao fazer pull do repositório"
    exit 1
fi

log "✅ Repositório atualizado"

# 2. Verificar/criar arquivo .env
if [ ! -f ".env" ]; then
    log "⚠️ Arquivo .env não encontrado, criando..."
    cat > .env << 'EOF'
VITE_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
NEXT_PUBLIC_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
EOF
    log "✅ Arquivo .env criado (verifique as credenciais!)"
fi

# 3. Instalar/atualizar dependências
log "📦 Instalando dependências..."
npm install 2>&1 | tee -a "$LOG_FILE"

if [ $? -ne 0 ]; then
    log "❌ Erro ao instalar dependências"
    exit 1
fi

log "✅ Dependências instaladas"

# 4. Fazer build do projeto
log "🔨 Fazendo build do projeto..."
npm run build 2>&1 | tee -a "$LOG_FILE"

if [ $? -ne 0 ]; then
    log "❌ Erro ao fazer build"
    exit 1
fi

# Verificar se dist foi criado
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    log "❌ Erro: Build não foi criado corretamente"
    exit 1
fi

log "✅ Build criado com sucesso"

# 5. Ajustar permissões
log "🔐 Ajustando permissões..."
sudo chown -R www:www "$PROJECT_DIR" 2>&1 | tee -a "$LOG_FILE"
sudo chmod -R 755 "$PROJECT_DIR" 2>&1 | tee -a "$LOG_FILE"
sudo chmod -R 755 dist/ 2>&1 | tee -a "$LOG_FILE"

log "✅ Permissões ajustadas"

# 6. Recarregar Nginx
log "🔄 Recarregando Nginx..."
sudo nginx -t 2>&1 | tee -a "$LOG_FILE"

if [ $? -eq 0 ]; then
    sudo systemctl reload nginx 2>&1 | tee -a "$LOG_FILE"
    log "✅ Nginx recarregado"
else
    log "⚠️ Erro na configuração do Nginx (mas build está pronto)"
fi

# 7. Resumo final
BUILD_SIZE=$(du -sh dist | cut -f1)
log "═══════════════════════════════════════════════════════════════"
log "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
log "📊 Tamanho do build: $BUILD_SIZE"
log "📝 Log completo: $LOG_FILE"
log "═══════════════════════════════════════════════════════════════"

exit 0

