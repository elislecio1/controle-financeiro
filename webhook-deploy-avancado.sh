#!/bin/bash

# Script de Webhook Avançado para Deploy Automático
# Versão com validações extras, rollback e notificações
# Uso: Configurar no aapanel como Script de Webhook

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# ==================== CONFIGURAÇÕES ====================
PROJECT_DIR="/www/wwwroot/cf.don.cim.br"
GIT_BRANCH="main"
GIT_REPO="git@github.com:elislecio1/controle-financeiro.git"
LOG_FILE="/www/wwwlogs/cf.don.cim.br-deploy.log"
BACKUP_DIR="/www/backups/cf.don.cim.br"
MAX_BACKUPS=5
MAX_LOG_SIZE=10485760  # 10MB

# ==================== FUNÇÕES ====================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

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
rotate_log() {
    if [ -f "$LOG_FILE" ]; then
        LOG_SIZE=$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null)
        if [ "$LOG_SIZE" -gt $MAX_LOG_SIZE ]; then
            mv "$LOG_FILE" "${LOG_FILE}.old"
            touch "$LOG_FILE"
            log_info "Log rotacionado"
        fi
    fi
}

# Criar backup antes do deploy
create_backup() {
    log_info "Criando backup antes do deploy..."
    
    mkdir -p "$BACKUP_DIR"
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    # Backup apenas da pasta dist (build anterior)
    if [ -d "dist" ]; then
        cp -r dist "$BACKUP_PATH"
        log_success "Backup criado: $BACKUP_NAME"
        
        # Limpar backups antigos
        cd "$BACKUP_DIR" || return
        ls -t | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -rf 2>/dev/null
        cd "$PROJECT_DIR" || return
    else
        log_warning "Pasta dist não existe. Pulando backup."
    fi
}

# Rollback em caso de erro
rollback() {
    log_error "Erro detectado. Iniciando rollback..."
    
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR" 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        log_info "Restaurando backup: $LATEST_BACKUP"
        rm -rf dist
        cp -r "$BACKUP_DIR/$LATEST_BACKUP" dist
        chown -R www:www dist
        chmod -R 755 dist
        log_success "Rollback concluído"
    else
        log_error "Nenhum backup disponível para rollback"
    fi
}

# Verificar pré-requisitos
check_prerequisites() {
    log_info "Verificando pré-requisitos..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js não está instalado"
        return 1
    fi
    log_success "Node.js: $(node -v)"
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        log_error "npm não está instalado"
        return 1
    fi
    log_success "npm: $(npm -v)"
    
    # Verificar Git
    if ! command -v git &> /dev/null; then
        log_error "Git não está instalado"
        return 1
    fi
    log_success "Git: $(git --version)"
    
    # Verificar diretório
    if [ ! -d "$PROJECT_DIR" ]; then
        log_error "Diretório do projeto não encontrado: $PROJECT_DIR"
        return 1
    fi
    
    return 0
}

# Atualizar repositório
update_repository() {
    log_info "Atualizando repositório..."
    
    cd "$PROJECT_DIR" || return 1
    
    # Verificar se é repositório Git
    if [ ! -d ".git" ]; then
        log_error "Diretório não é um repositório Git"
        return 1
    fi
    
    # Stash de mudanças locais
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "Há mudanças locais. Fazendo stash..."
        git stash
    fi
    
    # Fetch e pull
    git fetch origin
    
    if [ $? -ne 0 ]; then
        log_error "Erro ao fazer fetch"
        return 1
    fi
    
    # Verificar se há atualizações
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/$GIT_BRANCH)
    
    if [ "$LOCAL" = "$REMOTE" ]; then
        log_info "Repositório já está atualizado"
        return 2  # Código especial: sem atualizações
    fi
    
    # Pull
    git pull origin $GIT_BRANCH
    
    if [ $? -ne 0 ]; then
        log_error "Erro ao fazer pull"
        return 1
    fi
    
    log_success "Repositório atualizado!"
    log_info "Commit: $(git rev-parse --short HEAD)"
    log_info "Mensagem: $(git log -1 --pretty=%B)"
    
    return 0
}

# Instalar dependências
install_dependencies() {
    log_info "Instalando dependências..."
    
    npm install --production=false
    
    if [ $? -ne 0 ]; then
        log_error "Erro ao instalar dependências"
        return 1
    fi
    
    log_success "Dependências instaladas"
    return 0
}

# Fazer build
build_project() {
    log_info "Fazendo build do projeto..."
    
    npm run build
    
    if [ $? -ne 0 ]; then
        log_error "Erro ao fazer build"
        return 1
    fi
    
    # Verificar se dist foi criado
    if [ ! -d "dist" ]; then
        log_error "Pasta dist não foi criada"
        return 1
    fi
    
    BUILD_SIZE=$(du -sh dist | cut -f1)
    log_success "Build concluído! Tamanho: $BUILD_SIZE"
    
    return 0
}

# Ajustar permissões
fix_permissions() {
    log_info "Ajustando permissões..."
    
    chown -R www:www "$PROJECT_DIR"
    chmod -R 755 "$PROJECT_DIR"
    chmod -R 755 dist/
    
    log_success "Permissões ajustadas"
}

# Recarregar serviços
reload_services() {
    log_info "Recarregando serviços..."
    
    # Nginx
    if command -v nginx &> /dev/null; then
        if nginx -t > /dev/null 2>&1; then
            systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null
            if [ $? -eq 0 ]; then
                log_success "Nginx recarregado"
            else
                log_warning "Não foi possível recarregar Nginx"
            fi
        else
            log_warning "Configuração do Nginx tem erros"
        fi
    fi
}

# ==================== EXECUÇÃO PRINCIPAL ====================

main() {
    START_TIME=$(date +%s)
    
    log "=========================================="
    log "🚀 DEPLOY AUTOMÁTICO INICIADO"
    log "=========================================="
    log_info "Diretório: $PROJECT_DIR"
    log_info "Branch: $GIT_BRANCH"
    log_info "Usuário: $(whoami)"
    log_info "Data: $(date)"
    
    # Rotacionar log
    rotate_log
    
    # Verificar pré-requisitos
    if ! check_prerequisites; then
        log_error "Pré-requisitos não atendidos. Abortando."
        exit 1
    fi
    
    # Navegar para diretório
    cd "$PROJECT_DIR" || {
        log_error "Não foi possível acessar o diretório"
        exit 1
    }
    
    # Criar backup
    create_backup
    
    # Atualizar repositório
    UPDATE_RESULT=$(update_repository)
    UPDATE_EXIT_CODE=$?
    
    if [ $UPDATE_EXIT_CODE -eq 1 ]; then
        log_error "Erro ao atualizar repositório"
        rollback
        exit 1
    elif [ $UPDATE_EXIT_CODE -eq 2 ]; then
        log_info "Nenhuma atualização disponível. Deploy cancelado."
        exit 0
    fi
    
    # Instalar dependências
    if ! install_dependencies; then
        log_error "Erro ao instalar dependências"
        rollback
        exit 1
    fi
    
    # Verificar .env
    if [ ! -f ".env" ]; then
        log_warning "Arquivo .env não encontrado. Criando..."
        if [ -f "env.example" ]; then
            cp env.example .env
        else
            cat > .env << EOF
VITE_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
NEXT_PUBLIC_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
EOF
        fi
        log_warning "⚠️ Configure o arquivo .env com suas credenciais!"
    fi
    
    # Fazer build
    if ! build_project; then
        log_error "Erro ao fazer build"
        rollback
        exit 1
    fi
    
    # Ajustar permissões
    fix_permissions
    
    # Recarregar serviços
    reload_services
    
    # Resumo final
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    log "=========================================="
    log_success "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
    log "=========================================="
    log_info "Commit: $(git rev-parse --short HEAD)"
    log_info "Build: $(du -sh dist | cut -f1)"
    log_info "Duração: ${DURATION}s"
    log "=========================================="
    
    exit 0
}

# Executar
main "$@"

