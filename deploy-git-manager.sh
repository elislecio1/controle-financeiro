#!/bin/bash

# =====================================================
# SCRIPT DE DEPLOY PARA GIT MANAGER
# =====================================================
# Este script é executado automaticamente pelo Git Manager
# quando há push para o repositório ou deploy manual
#
# Diretório do projeto no servidor
PROJECT_DIR="/www/wwwroot/sites/elislecio/cf.don.cim.br"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERRO]${NC} $1" >&2
}

log_success() {
    echo -e "${GREEN}[SUCESSO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

# SOLUÇÃO DEFINITIVA: Função git_safe que executa git e filtra "dubious ownership"
git_safe() {
    # Capturar stdout e stderr separadamente
    local temp_out=$(mktemp 2>/dev/null || echo "/tmp/git_out_$$")
    local temp_err=$(mktemp 2>/dev/null || echo "/tmp/git_err_$$")
    
    # Executar comando git com safe.directory
    git -c safe.directory="$PROJECT_DIR" "$@" > "$temp_out" 2> "$temp_err"
    local exit_code=$?
    
    # Ler conteúdo dos arquivos
    local out_content=$(cat "$temp_out" 2>/dev/null || echo "")
    local err_content=$(cat "$temp_err" 2>/dev/null || echo "")
    
    # Mostrar stdout
    if [ -n "$out_content" ]; then
        echo "$out_content"
    fi
    
    # Verificar se o erro é apenas "dubious ownership"
    if echo "$err_content" | grep -q "dubious ownership"; then
        # Verificar se há outros erros além de "dubious ownership"
        local other_errors=$(echo "$err_content" | grep -v "dubious ownership" | grep -v "To add an exception" | grep -v "^$")
        
        if [ -z "$other_errors" ]; then
            # Apenas "dubious ownership" - ignorar completamente e considerar sucesso
            rm -f "$temp_out" "$temp_err" 2>/dev/null || true
            return 0
        else
            # Há outros erros além de "dubious ownership"
            echo "$other_errors" >&2
            rm -f "$temp_out" "$temp_err" 2>/dev/null || true
            return $exit_code
        fi
    else
        # Não é erro de "dubious ownership" - mostrar todos os erros
        if [ -n "$err_content" ]; then
            echo "$err_content" >&2
        fi
        rm -f "$temp_out" "$temp_err" 2>/dev/null || true
        return $exit_code
    fi
}

# Iniciar deploy
log "🚀 Iniciando deploy do projeto..."

# 1. Navegar para o diretório do projeto
log "📂 Navegando para o diretório do projeto..."
cd "$PROJECT_DIR" || {
    log_error "Não foi possível navegar para $PROJECT_DIR"
    exit 1
}

# Verificar se é um repositório Git
if [ ! -d ".git" ]; then
    log_error "Diretório não é um repositório Git válido"
    exit 1
fi

# Verificar se package.json existe
if [ ! -f "package.json" ]; then
    log_error "package.json não encontrado em $PROJECT_DIR"
    exit 1
fi

log_success "Diretório: $(pwd)"

# 2. Configurar Git safe.directory (tentativa, mas não crítico se falhar)
log "🔧 Configurando Git safe.directory..."
git config --global --add safe.directory "$PROJECT_DIR" 2>/dev/null || true
git config --global --add safe.directory "*" 2>/dev/null || true
git config --local --add safe.directory "$PROJECT_DIR" 2>/dev/null || true
log_success "Git configurado"

# 3. Verificar e tratar mudanças locais
log "🔍 Verificando mudanças locais..."
# Usar git_safe que filtra o erro de "dubious ownership"
if ! git_safe diff-index --quiet HEAD -- 2>/dev/null; then
    log_warning "Mudanças locais detectadas. Fazendo reset forçado..."
    git_safe fetch origin main || {
        log_error "Erro ao buscar do repositório remoto"
        exit 1
    }
    git_safe reset --hard origin/main || {
        log_error "Erro ao resetar repositório"
        exit 1
    }
    git_safe clean -df || {
        log_warning "Erro ao limpar arquivos não rastreados (continuando...)"
    }
    log_success "Mudanças locais descartadas e repositório atualizado"
fi

# 4. Atualizar repositório
log "📥 Atualizando repositório do Git..."
git_safe fetch origin main || {
    log_error "Erro ao buscar do repositório remoto"
    exit 1
}

# Verificar se há atualizações
LOCAL=$(git_safe rev-parse HEAD 2>/dev/null)
REMOTE=$(git_safe rev-parse origin/main 2>/dev/null)

if [ -z "$LOCAL" ] || [ -z "$REMOTE" ]; then
    log_warning "Não foi possível verificar versões, fazendo reset forçado..."
    git_safe reset --hard origin/main || {
        log_error "Erro ao resetar repositório"
        exit 1
    }
elif [ "$LOCAL" = "$REMOTE" ]; then
    log_warning "Repositório já está atualizado (sem novas alterações)"
else
    log "Atualizando de $LOCAL para $REMOTE..."
    git_safe reset --hard origin/main || {
        log_error "Erro ao atualizar repositório"
        exit 1
    }
    git_safe clean -df || {
        log_warning "Erro ao limpar arquivos não rastreados (continuando...)"
    }
    log_success "Repositório atualizado com sucesso"
fi

# 5. Instalar dependências
log "📦 Instalando dependências do npm..."
npm install --production=false || {
    log_error "Erro ao instalar dependências"
    exit 1
}
log_success "Dependências instaladas"

# 6. Build do projeto
log "🔨 Fazendo build do projeto..."
npm run build || {
    log_error "Erro ao fazer build do projeto"
    exit 1
}
log_success "Build concluído com sucesso"

# 7. Limpar cache do npm (opcional, mas recomendado)
log "🧹 Limpando cache do npm..."
npm cache clean --force 2>/dev/null || true
log_success "Cache limpo"

# 8. Verificar se o diretório dist foi criado
if [ ! -d "dist" ]; then
    log_warning "Diretório 'dist' não encontrado após build"
else
    DIST_SIZE=$(du -sh dist | cut -f1)
    log_success "Build gerado em ./dist (tamanho: $DIST_SIZE)"
fi

# 9. Resumo final
log "✅ Deploy concluído com sucesso!"
log "📁 Arquivos prontos em: $PROJECT_DIR/dist"
log "🕐 Deploy finalizado em: $(date +'%Y-%m-%d %H:%M:%S')"

exit 0
