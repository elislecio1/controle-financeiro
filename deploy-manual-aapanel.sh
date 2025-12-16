#!/bin/bash

# ============================================
# Script de Deploy Manual para aapanel
# Atualiza repositório, faz build e reinicia serviços
# ============================================

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ==================== CONFIGURAÇÕES ====================
PROJECT_DIR="/www/wwwroot/cf.don.cim.br"
GIT_BRANCH="main"
GIT_REPO="git@github.com:elislecio1/controle-financeiro.git"
LOG_FILE="/www/wwwlogs/cf.don.cim.br-deploy-manual.log"
BACKUP_DIR="/www/backups/cf.don.cim.br"
MAX_BACKUPS=5

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

log_step() {
    echo -e "${CYAN}▶️${NC} $1" | tee -a "$LOG_FILE"
}

# Criar backup antes do deploy
create_backup() {
    log_step "Criando backup antes do deploy..."
    
    mkdir -p "$BACKUP_DIR"
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    # Backup apenas da pasta dist (build anterior)
    if [ -d "$PROJECT_DIR/dist" ]; then
        cp -r "$PROJECT_DIR/dist" "$BACKUP_PATH"
        log_success "Backup criado: $BACKUP_NAME"
        
        # Limpar backups antigos
        cd "$BACKUP_DIR" || return
        ls -t | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -rf 2>/dev/null
        cd "$PROJECT_DIR" || return
    else
        log_warning "Pasta dist não existe. Pulando backup."
    fi
}

# Verificar pré-requisitos
check_prerequisites() {
    log_step "Verificando pré-requisitos..."
    
    # Verificar se está no diretório correto
    if [ ! -d "$PROJECT_DIR" ]; then
        log_error "Diretório do projeto não encontrado: $PROJECT_DIR"
        return 1
    fi
    
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
    
    return 0
}

# Atualizar repositório
update_repository() {
    log_step "Atualizando repositório Git..."
    
    cd "$PROJECT_DIR" || return 1
    
    # Configurar diretório como seguro para Git
    git config --global --add safe.directory "$PROJECT_DIR" 2>/dev/null || true
    
    # Verificar se é repositório Git
    if [ ! -d ".git" ]; then
        log_error "Diretório não é um repositório Git"
        return 1
    fi
    
    # Verificar e ajustar o remote se necessário
    CURRENT_REMOTE=$(git remote -v | grep 'origin' | head -n 1 | awk '{print $2}')
    if [[ "$CURRENT_REMOTE" != *"$GIT_REPO"* ]]; then
        log_warning "Remote atual não corresponde. Ajustando..."
        git remote set-url origin "$GIT_REPO"
        log_success "Remote ajustado"
    fi
    
    # Verificar arquivos não rastreados que podem conflitar
    UNTRACKED_FILES=$(git ls-files --others --exclude-standard)
    if [ -n "$UNTRACKED_FILES" ]; then
        log_warning "Arquivos não rastreados encontrados que podem conflitar:"
        echo "$UNTRACKED_FILES" | while read -r file; do
            log_info "  - $file"
        done
        
        # Verificar se algum arquivo não rastreado está no repositório remoto
        log_info "Verificando se arquivos não rastreados existem no repositório remoto..."
        git fetch origin $GIT_BRANCH --quiet
        
        CONFLICTING_FILES=""
        for file in $UNTRACKED_FILES; do
            if git ls-tree -r origin/$GIT_BRANCH --name-only | grep -q "^$file$"; then
                CONFLICTING_FILES="$CONFLICTING_FILES $file"
            fi
        done
        
        if [ -n "$CONFLICTING_FILES" ]; then
            log_warning "Arquivos não rastreados que conflitam com o repositório remoto:"
            for file in $CONFLICTING_FILES; do
                log_info "  - $file (será movido para .backup)"
                # Fazer backup do arquivo local
                if [ -f "$file" ]; then
                    mkdir -p .backup-$(date +%Y%m%d-%H%M%S)
                    cp "$file" ".backup-$(date +%Y%m%d-%H%M%S)/$file" 2>/dev/null || true
                    rm -f "$file"
                fi
            done
        fi
    fi
    
    # Stash de mudanças locais se houver
    if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
        log_warning "Há mudanças locais rastreadas. Fazendo stash..."
        git stash push -m "Deploy manual - $(date +%Y%m%d-%H%M%S)"
    fi
    
    # Fetch
    log_info "Executando git fetch origin..."
    if ! git fetch origin; then
        log_error "Erro ao fazer fetch"
        return 1
    fi
    
    # Verificar se há atualizações
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/$GIT_BRANCH)
    
    if [ "$LOCAL" = "$REMOTE" ]; then
        log_info "Repositório já está atualizado (commit: $(git rev-parse --short HEAD))"
    else
        log_info "Atualizações disponíveis. Fazendo pull..."
        
        # Tentar pull com estratégia de merge
        if ! git pull origin $GIT_BRANCH --no-edit; then
            log_error "Erro ao fazer pull"
            log_info "Tentando reset hard para forçar atualização..."
            # Se pull falhar, fazer reset hard (cuidado: perde mudanças locais)
            if git reset --hard origin/$GIT_BRANCH; then
                log_success "Repositório atualizado via reset hard"
            else
                log_error "Erro ao fazer reset hard"
                return 1
            fi
        fi
        log_success "Repositório atualizado!"
        log_info "Commit anterior: $(git rev-parse --short $LOCAL)"
        log_info "Commit atual: $(git rev-parse --short HEAD)"
        log_info "Mensagem: $(git log -1 --pretty=%B)"
    fi
    
    return 0
}

# Instalar dependências
install_dependencies() {
    log_step "Instalando dependências npm..."
    
    cd "$PROJECT_DIR" || return 1
    
    log_info "Executando npm install..."
    if ! npm install --production=false; then
        log_error "Erro ao instalar dependências"
        return 1
    fi
    
    log_success "Dependências instaladas"
    return 0
}

# Fazer build
build_project() {
    log_step "Fazendo build do projeto..."
    
    cd "$PROJECT_DIR" || return 1
    
    log_info "Executando npm run build..."
    if ! npm run build; then
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
    log_step "Ajustando permissões..."
    
    cd "$PROJECT_DIR" || return 1
    
    # Ajustar dono e permissões
    chown -R www:www "$PROJECT_DIR"
    chmod -R 755 "$PROJECT_DIR"
    chmod -R 755 dist/ 2>/dev/null || true
    
    log_success "Permissões ajustadas"
}

# Recarregar serviços
reload_services() {
    log_step "Recarregando serviços..."
    
    # Nginx
    if command -v nginx &> /dev/null; then
        log_info "Testando configuração do Nginx..."
        if nginx -t > /dev/null 2>&1; then
            log_info "Recarregando Nginx..."
            if systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null; then
                log_success "Nginx recarregado com sucesso"
            else
                log_warning "Não foi possível recarregar Nginx automaticamente"
                log_info "Tente manualmente: systemctl reload nginx"
            fi
        else
            log_error "Configuração do Nginx tem erros. Verifique com: nginx -t"
            return 1
        fi
    else
        log_warning "Nginx não encontrado"
    fi
    
    # PHP-FPM (se aplicável)
    if command -v php-fpm &> /dev/null || systemctl list-units | grep -q php-fpm; then
        log_info "Recarregando PHP-FPM..."
        if systemctl reload php-fpm 2>/dev/null || service php-fpm reload 2>/dev/null; then
            log_success "PHP-FPM recarregado"
        else
            log_warning "Não foi possível recarregar PHP-FPM"
        fi
    fi
    
    return 0
}

# Verificar status dos serviços
check_services() {
    log_step "Verificando status dos serviços..."
    
    # Nginx
    if command -v nginx &> /dev/null; then
        if systemctl is-active --quiet nginx; then
            log_success "Nginx está rodando"
        else
            log_warning "Nginx não está rodando"
        fi
    fi
    
    # Verificar se o site está acessível
    log_info "Verificando se o site está acessível..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302"; then
        log_success "Site está respondendo"
    else
        log_warning "Site pode não estar respondendo corretamente"
    fi
}

# Rollback em caso de erro
rollback() {
    log_error "Erro detectado. Iniciando rollback..."
    
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR" 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        log_info "Restaurando backup: $LATEST_BACKUP"
        rm -rf "$PROJECT_DIR/dist"
        cp -r "$BACKUP_DIR/$LATEST_BACKUP" "$PROJECT_DIR/dist"
        chown -R www:www "$PROJECT_DIR/dist"
        chmod -R 755 "$PROJECT_DIR/dist"
        log_success "Rollback concluído"
    else
        log_error "Nenhum backup disponível para rollback"
    fi
}

# Verificar arquivo .env
check_env_file() {
    log_step "Verificando arquivo .env..."
    
    cd "$PROJECT_DIR" || return 1
    
    if [ ! -f ".env" ]; then
        log_warning "Arquivo .env não encontrado. Criando..."
        if [ -f "env.example" ]; then
            cp env.example .env
            log_warning "⚠️ Configure o arquivo .env com suas credenciais!"
        else
            log_error "Arquivo env.example não encontrado"
            return 1
        fi
    else
        log_success "Arquivo .env encontrado"
    fi
}

# ==================== EXECUÇÃO PRINCIPAL ====================

main() {
    START_TIME=$(date +%s)
    
    echo ""
    echo "=========================================="
    echo -e "${CYAN}🚀 DEPLOY MANUAL - AAPANEL${NC}"
    echo "=========================================="
    log_info "Diretório: $PROJECT_DIR"
    log_info "Branch: $GIT_BRANCH"
    log_info "Usuário: $(whoami)"
    log_info "Data: $(date)"
    echo "=========================================="
    echo ""
    
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
    if ! update_repository; then
        log_error "Erro ao atualizar repositório"
        rollback
        exit 1
    fi
    
    # Verificar .env
    if ! check_env_file; then
        log_warning "Problema com arquivo .env, mas continuando..."
    fi
    
    # Instalar dependências
    if ! install_dependencies; then
        log_error "Erro ao instalar dependências"
        rollback
        exit 1
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
    if ! reload_services; then
        log_warning "Alguns serviços podem não ter sido recarregados"
    fi
    
    # Verificar status
    check_services
    
    # Resumo final
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    echo ""
    echo "=========================================="
    log_success "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
    echo "=========================================="
    log_info "Commit: $(git rev-parse --short HEAD)"
    log_info "Build: $(du -sh dist | cut -f1)"
    log_info "Duração: ${DURATION}s"
    log_info "Log: $LOG_FILE"
    echo "=========================================="
    echo ""
    
    exit 0
}

# Executar
main "$@"

