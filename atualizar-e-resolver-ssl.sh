#!/bin/bash
# ============================================
# Script para Atualizar Repositório e Resolver SSL
# Resolve conflitos automaticamente
# ============================================

PROJECT_DIR="/www/wwwroot/cf.don.cim.br"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅${NC} $1"
}

log_error() {
    echo -e "${RED}❌${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

echo "=========================================="
echo "🔄 ATUALIZAR E RESOLVER SSL"
echo "=========================================="
echo ""

# Verificar se é root
if [ "$EUID" -ne 0 ]; then 
    log_error "Este script precisa ser executado como root"
    exit 1
fi

# Verificar diretório
if [ ! -d "$PROJECT_DIR" ]; then
    log_error "Diretório do projeto não encontrado: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR" || exit 1

# 1. Verificar status do Git
log_info "1️⃣ Verificando status do Git..."
if [ -n "$(git status --porcelain)" ]; then
    log_warning "Há mudanças locais não commitadas"
    
    # Verificar se há mudanças em arquivos rastreados
    if [ -n "$(git diff --name-only)" ]; then
        log_info "Fazendo stash das mudanças rastreadas..."
        git stash push -m "Stash automático antes de atualizar - $(date +%Y%m%d-%H%M%S)"
        log_success "Mudanças rastreadas salvas em stash"
    fi
    
    # Verificar se há arquivos não rastreados que podem conflitar
    UNTRACKED=$(git ls-files --others --exclude-standard)
    if [ -n "$UNTRACKED" ]; then
        log_info "Movendo arquivos não rastreados para backup..."
        BACKUP_DIR="backup-untracked-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        echo "$UNTRACKED" | while read -r file; do
            if [ -f "$file" ]; then
                mv "$file" "$BACKUP_DIR/" 2>/dev/null || true
            fi
        done
        log_success "Arquivos não rastreados movidos para: $BACKUP_DIR"
    fi
fi

echo ""

# 2. Atualizar repositório
log_info "2️⃣ Atualizando repositório..."
git fetch origin main

# Tentar pull
if git pull origin main; then
    log_success "Repositório atualizado"
else
    log_warning "Pull falhou, tentando reset hard..."
    log_info "⚠️ ATENÇÃO: Mudanças locais serão descartadas!"
    
    # Fazer backup antes de reset
    BACKUP_BRANCH="backup-local-$(date +%Y%m%d-%H%M%S)"
    git branch "$BACKUP_BRANCH" 2>/dev/null || true
    log_info "Backup criado na branch: $BACKUP_BRANCH"
    
    # Reset hard
    git reset --hard origin/main
    git clean -fd
    log_success "Repositório atualizado (reset hard)"
fi

echo ""

# 3. Dar permissão de execução aos scripts
log_info "3️⃣ Configurando permissões dos scripts..."
chmod +x *.sh 2>/dev/null || true
log_success "Permissões configuradas"

echo ""

# 4. Executar resolver SSL completo
log_info "4️⃣ Executando resolver SSL completo..."
if [ -f "resolver-ssl-completo.sh" ]; then
    bash resolver-ssl-completo.sh
else
    log_error "Script resolver-ssl-completo.sh não encontrado"
    log_info "Tentando gerar certificado diretamente..."
    if [ -f "gerar-novo-certificado-ssl.sh" ]; then
        bash gerar-novo-certificado-ssl.sh
    else
        log_error "Nenhum script de SSL encontrado"
        exit 1
    fi
fi

echo ""
log_success "✅ Processo concluído!"

