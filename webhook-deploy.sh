#!/bin/bash

# Script de Webhook para Deploy Automático
# Uso: Configurar no aapanel como Script de Webhook
# URL: https://181.232.139.201:25936/hook?access_key=OjdV16tkuhIb8GyGEWvIsiTFxn9rHS6cy2Wmw8w86Ltuqwq3&site_id=15

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
PROJECT_DIR="/www/wwwroot/cf.don.cim.br"
GIT_BRANCH="main"
LOG_FILE="/www/wwwlogs/cf.don.cim.br-deploy.log"
MAX_LOG_SIZE=10485760  # 10MB

# Função para log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Função para log com cor
log_info() {
    echo -e "${BLUE}ℹ️${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠️${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌${NC} $1" | tee -a "$LOG_FILE"
}

# Limitar tamanho do log
if [ -f "$LOG_FILE" ] && [ $(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null) -gt $MAX_LOG_SIZE ]; then
    mv "$LOG_FILE" "${LOG_FILE}.old"
    touch "$LOG_FILE"
fi

# Iniciar deploy
log "=========================================="
log "🚀 Iniciando deploy automático"
log "=========================================="
log_info "Diretório: $PROJECT_DIR"
log_info "Branch: $GIT_BRANCH"
log_info "Usuário: $(whoami)"
log_info "Data: $(date)"

# Verificar se o diretório existe
if [ ! -d "$PROJECT_DIR" ]; then
    log_error "Diretório do projeto não encontrado: $PROJECT_DIR"
    exit 1
fi

# Navegar para o diretório do projeto
cd "$PROJECT_DIR" || {
    log_error "Não foi possível acessar o diretório: $PROJECT_DIR"
    exit 1
}

log_success "Diretório acessado: $(pwd)"

# Verificar se é um repositório Git
if [ ! -d ".git" ]; then
    log_error "Diretório não é um repositório Git"
    exit 1
fi

# Verificar se há mudanças não commitadas
if [ -n "$(git status --porcelain)" ]; then
    log_warning "Há mudanças não commitadas. Fazendo stash..."
    git stash
fi

# Atualizar repositório
log_info "Atualizando repositório (git pull)..."
git fetch origin

if [ $? -ne 0 ]; then
    log_error "Erro ao fazer fetch do repositório"
    exit 1
fi

# Verificar se há atualizações
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/$GIT_BRANCH)

if [ "$LOCAL" = "$REMOTE" ]; then
    log_info "Repositório já está atualizado. Nenhuma mudança detectada."
    exit 0
fi

log_info "Atualizações detectadas. Fazendo pull..."
git pull origin $GIT_BRANCH

if [ $? -ne 0 ]; then
    log_error "Erro ao fazer pull do repositório"
    exit 1
fi

log_success "Repositório atualizado com sucesso!"
log_info "Commit: $(git rev-parse --short HEAD)"
log_info "Mensagem: $(git log -1 --pretty=%B)"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js não está instalado"
    exit 1
fi

NODE_VERSION=$(node -v)
log_info "Node.js: $NODE_VERSION"

# Verificar npm
if ! command -v npm &> /dev/null; then
    log_error "npm não está instalado"
    exit 1
fi

NPM_VERSION=$(npm -v)
log_info "npm: $NPM_VERSION"

# Instalar dependências
log_info "Instalando dependências (npm install)..."
npm install --production=false

if [ $? -ne 0 ]; then
    log_error "Erro ao instalar dependências"
    exit 1
fi

log_success "Dependências instaladas com sucesso!"

# Verificar arquivo .env
if [ ! -f ".env" ]; then
    log_warning "Arquivo .env não encontrado. Criando a partir do env.example..."
    if [ -f "env.example" ]; then
        cp env.example .env
        log_warning "⚠️ IMPORTANTE: Configure o arquivo .env com suas credenciais!"
    else
        log_error "env.example não encontrado. Criando .env básico..."
        cat > .env << EOF
VITE_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
NEXT_PUBLIC_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
EOF
    fi
fi

# Fazer build
log_info "Fazendo build do projeto (npm run build)..."
npm run build

if [ $? -ne 0 ]; then
    log_error "Erro ao fazer build do projeto"
    exit 1
fi

# Verificar se a pasta dist foi criada
if [ ! -d "dist" ]; then
    log_error "Pasta dist não foi criada após o build"
    exit 1
fi

BUILD_SIZE=$(du -sh dist | cut -f1)
log_success "Build concluído com sucesso! Tamanho: $BUILD_SIZE"

# Ajustar permissões
log_info "Ajustando permissões..."
chown -R www:www "$PROJECT_DIR"
chmod -R 755 "$PROJECT_DIR"
chmod -R 755 dist/

log_success "Permissões ajustadas"

# Verificar se Nginx precisa ser recarregado
log_info "Verificando configuração do Nginx..."
if command -v nginx &> /dev/null; then
    nginx -t > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        log_info "Recarregando Nginx..."
        systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null
        if [ $? -eq 0 ]; then
            log_success "Nginx recarregado com sucesso!"
        else
            log_warning "Não foi possível recarregar Nginx automaticamente"
        fi
    else
        log_warning "Configuração do Nginx tem erros. Verifique manualmente."
    fi
fi

# Verificar se há processos Node.js rodando (se aplicável)
# Se você tiver algum processo Node.js rodando, adicione aqui

# Resumo final
log "=========================================="
log_success "✅ Deploy concluído com sucesso!"
log "=========================================="
log_info "Commit: $(git rev-parse --short HEAD)"
log_info "Build: $BUILD_SIZE"
log_info "Tempo total: $(($(date +%s) - $(date -d "$(head -1 $LOG_FILE | cut -d']' -f1 | tr -d '[')" +%s 2>/dev/null || echo 0))s"
log "=========================================="

exit 0

