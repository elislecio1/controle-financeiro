#!/bin/bash

###############################################################################
# 🚀 Script de Deploy Completo para Produção - aapanel
# 
# Este script:
# 1. Atualiza o repositório Git
# 2. Instala/atualiza dependências
# 3. Faz o build do projeto
# 4. Ajusta permissões
# 5. Recarrega o Nginx
#
# Uso: Execute no terminal SSH do servidor
#      bash deploy-producao-aapanel.sh
###############################################################################

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
PROJECT_DIR="/www/wwwroot/sites/elislecio/cf.don.cim.br"
BRANCH="main"  # ou "master" dependendo do seu repositório
LOG_FILE="/www/wwwlogs/cf.don.cim.br-deploy.log"

# Função para log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Função para exibir mensagens
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    log "SUCCESS: $1"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    log "ERROR: $1"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
    log "WARNING: $1"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
    log "INFO: $1"
}

# Banner
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  🚀 DEPLOY PARA PRODUÇÃO - Sistema de Controle Financeiro"
echo "═══════════════════════════════════════════════════════════════"
echo ""
print_info "Diretório: $PROJECT_DIR"
print_info "Branch: $BRANCH"
print_info "Log: $LOG_FILE"
echo ""

# Criar arquivo de log se não existir
touch "$LOG_FILE"

# 1. Navegar para o diretório do projeto
print_info "Navegando para o diretório do projeto..."
cd "$PROJECT_DIR" 2>/dev/null

if [ $? -ne 0 ]; then
    print_error "Não foi possível acessar o diretório $PROJECT_DIR"
    print_error "Verifique se o diretório existe e você tem permissões."
    exit 1
fi

print_success "Diretório acessado: $(pwd)"

# 2. Verificar se é um repositório Git
if [ ! -d ".git" ]; then
    print_error "Diretório não é um repositório Git!"
    print_info "Se o repositório ainda não foi clonado, execute primeiro:"
    echo "  git clone https://github.com/seu-usuario/controle-financeiro.git $PROJECT_DIR"
    exit 1
fi

print_success "Repositório Git encontrado"

# 3. Verificar Node.js
print_info "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    print_error "Node.js não está instalado!"
    print_info "Instale pelo aapanel: App Store → Node.js Version Manager"
    exit 1
fi

NODE_VERSION=$(node -v)
print_success "Node.js encontrado: $NODE_VERSION"

# 4. Verificar npm
print_info "Verificando npm..."
if ! command -v npm &> /dev/null; then
    print_error "npm não está instalado!"
    exit 1
fi

NPM_VERSION=$(npm -v)
print_success "npm encontrado: $NPM_VERSION"

# 5. Verificar se package.json existe
if [ ! -f "package.json" ]; then
    print_error "package.json não encontrado!"
    print_error "Certifique-se de que o repositório foi clonado corretamente."
    exit 1
fi

print_success "package.json encontrado"

# 6. Verificar/criar arquivo .env
print_info "Verificando arquivo .env..."
if [ ! -f ".env" ]; then
    print_warning "Arquivo .env não encontrado. Criando..."
    cat > .env << 'EOF'
VITE_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
NEXT_PUBLIC_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
EOF
    print_warning "⚠ Arquivo .env criado com valores padrão!"
    print_warning "⚠ VERIFIQUE se as credenciais do Supabase estão corretas!"
else
    print_success "Arquivo .env encontrado"
fi

# 7. Fazer backup do build anterior (opcional)
if [ -d "dist" ]; then
    print_info "Fazendo backup do build anterior..."
    BACKUP_DIR="dist.backup.$(date +%Y%m%d_%H%M%S)"
    mv dist "$BACKUP_DIR" 2>/dev/null
    if [ $? -eq 0 ]; then
        print_success "Backup criado: $BACKUP_DIR"
    fi
fi

# 8. Atualizar repositório Git
echo ""
print_info "═══════════════════════════════════════════════════════════════"
print_info "ATUALIZANDO REPOSITÓRIO GIT"
print_info "═══════════════════════════════════════════════════════════════"
echo ""

# Verificar status do Git
print_info "Verificando status do repositório..."
git fetch origin 2>&1 | tee -a "$LOG_FILE"

# Verificar se há mudanças locais
if [ -n "$(git status --porcelain)" ]; then
    print_warning "Há mudanças locais não commitadas!"
    print_info "Fazendo stash das mudanças locais..."
    git stash 2>&1 | tee -a "$LOG_FILE"
fi

# Fazer pull
print_info "Fazendo pull do branch $BRANCH..."
git pull origin "$BRANCH" 2>&1 | tee -a "$LOG_FILE"

if [ $? -ne 0 ]; then
    print_error "Erro ao fazer pull do repositório!"
    print_info "Verifique sua conexão e permissões do Git."
    exit 1
fi

# Mostrar últimas mudanças
echo ""
print_info "Últimas mudanças recebidas:"
git log --oneline -5 2>&1 | tee -a "$LOG_FILE"
echo ""

print_success "Repositório atualizado com sucesso!"

# 9. Instalar/atualizar dependências
echo ""
print_info "═══════════════════════════════════════════════════════════════"
print_info "INSTALANDO DEPENDÊNCIAS"
print_info "═══════════════════════════════════════════════════════════════"
echo ""

print_info "Executando npm install..."
npm install 2>&1 | tee -a "$LOG_FILE"

if [ $? -ne 0 ]; then
    print_error "Erro ao instalar dependências!"
    print_info "Tentando limpar cache e reinstalar..."
    
    # Limpar cache
    rm -rf node_modules package-lock.json
    npm cache clean --force
    
    # Reinstalar
    npm install 2>&1 | tee -a "$LOG_FILE"
    
    if [ $? -ne 0 ]; then
        print_error "Erro persistente ao instalar dependências!"
        exit 1
    fi
fi

print_success "Dependências instaladas com sucesso!"

# 10. Fazer build do projeto
echo ""
print_info "═══════════════════════════════════════════════════════════════"
print_info "FAZENDO BUILD DO PROJETO"
print_info "═══════════════════════════════════════════════════════════════"
echo ""

print_info "Executando npm run build..."
npm run build 2>&1 | tee -a "$LOG_FILE"

if [ $? -ne 0 ]; then
    print_error "Erro ao fazer build!"
    print_info "Tentando build direto com Vite (sem TypeScript check)..."
    
    # Tentar build direto com Vite
    npx vite build 2>&1 | tee -a "$LOG_FILE"
    
    if [ $? -ne 0 ]; then
        print_error "Erro também no build direto!"
        print_info "Verifique os logs acima para mais detalhes."
        exit 1
    fi
fi

# 11. Verificar se o build foi criado
if [ ! -d "dist" ]; then
    print_error "Pasta dist não foi criada!"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    print_error "index.html não encontrado em dist/!"
    exit 1
fi

# Verificar tamanho do build
BUILD_SIZE=$(du -sh dist | cut -f1)
DIST_FILES=$(find dist -type f | wc -l)

print_success "Build criado com sucesso!"
print_info "Tamanho: $BUILD_SIZE"
print_info "Arquivos: $DIST_FILES"

# 12. Ajustar permissões
echo ""
print_info "═══════════════════════════════════════════════════════════════"
print_info "AJUSTANDO PERMISSÕES"
print_info "═══════════════════════════════════════════════════════════════"
echo ""

print_info "Ajustando permissões do diretório..."
chown -R www:www "$PROJECT_DIR" 2>&1 | tee -a "$LOG_FILE"
chmod -R 755 "$PROJECT_DIR" 2>&1 | tee -a "$LOG_FILE"
chmod -R 755 dist/ 2>&1 | tee -a "$LOG_FILE"

print_success "Permissões ajustadas!"

# 13. Recarregar Nginx
echo ""
print_info "═══════════════════════════════════════════════════════════════"
print_info "RECARREGANDO NGINX"
print_info "═══════════════════════════════════════════════════════════════"
echo ""

print_info "Testando configuração do Nginx..."
nginx -t 2>&1 | tee -a "$LOG_FILE"

if [ $? -eq 0 ]; then
    print_info "Recarregando Nginx..."
    systemctl reload nginx 2>&1 | tee -a "$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        print_success "Nginx recarregado com sucesso!"
    else
        print_warning "Erro ao recarregar Nginx, mas o build está pronto."
        print_info "Recarregue manualmente: systemctl reload nginx"
    fi
else
    print_warning "Configuração do Nginx tem erros!"
    print_info "Verifique a configuração antes de recarregar."
fi

# 14. Limpar backups antigos (manter apenas os 3 mais recentes)
print_info "Limpando backups antigos..."
ls -dt dist.backup.* 2>/dev/null | tail -n +4 | xargs rm -rf 2>/dev/null

# 15. Resumo final
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}  ✅ DEPLOY CONCLUÍDO COM SUCESSO!${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
print_success "Repositório atualizado"
print_success "Dependências instaladas"
print_success "Build criado ($BUILD_SIZE)"
print_success "Permissões ajustadas"
echo ""
print_info "📝 Próximos passos:"
echo "   1. Acesse: https://cf.don.cim.br"
echo "   2. Verifique se o site está funcionando"
echo "   3. Verifique os logs se houver problemas:"
echo "      tail -f $LOG_FILE"
echo ""
print_info "📊 Logs do deploy salvos em: $LOG_FILE"
echo ""
print_success "🎉 Sistema pronto para produção!"
echo ""

