#!/bin/bash
# ============================================
# Script Completo para Resolver SSL
# Verifica build, gera certificado e configura tudo
# ============================================

DOMAIN="cf.don.cim.br"
PROJECT_DIR="/www/wwwroot/${DOMAIN}"
DIST_DIR="${PROJECT_DIR}/dist"

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
echo "🔧 RESOLVER SSL COMPLETO"
echo "=========================================="
echo ""

# Verificar se é root
if [ "$EUID" -ne 0 ]; then 
    log_error "Este script precisa ser executado como root"
    exit 1
fi

# 1. Verificar se está no diretório correto
log_info "1️⃣ Verificando diretório do projeto..."
if [ ! -d "$PROJECT_DIR" ]; then
    log_error "Diretório do projeto não encontrado: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR" || exit 1
log_success "Diretório do projeto encontrado"

echo ""

# 2. Verificar se build existe
log_info "2️⃣ Verificando build..."
if [ ! -d "$DIST_DIR" ] || [ -z "$(ls -A $DIST_DIR 2>/dev/null)" ]; then
    log_warning "Build não encontrado ou vazio. Fazendo build..."
    
    # Verificar se node_modules existe
    if [ ! -d "node_modules" ]; then
        log_info "Instalando dependências..."
        npm install
    fi
    
    # Fazer build
    log_info "Executando build..."
    npm run build
    
    if [ $? -eq 0 ] && [ -d "$DIST_DIR" ] && [ -n "$(ls -A $DIST_DIR 2>/dev/null)" ]; then
        log_success "Build concluído com sucesso"
    else
        log_error "Erro ao fazer build"
        exit 1
    fi
else
    log_success "Build encontrado"
fi

echo ""

# 3. Verificar permissões
log_info "3️⃣ Verificando permissões..."
chown -R www:www "$DIST_DIR" 2>/dev/null || chown -R www-data:www-data "$DIST_DIR" 2>/dev/null
chmod -R 755 "$DIST_DIR"
log_success "Permissões ajustadas"

echo ""

# 4. Gerar certificado SSL
log_info "4️⃣ Gerando certificado SSL..."
if [ -f "gerar-novo-certificado-ssl.sh" ]; then
    chmod +x gerar-novo-certificado-ssl.sh
    bash gerar-novo-certificado-ssl.sh
    
    if [ $? -eq 0 ]; then
        log_success "Certificado gerado com sucesso"
    else
        log_error "Erro ao gerar certificado"
        exit 1
    fi
else
    log_error "Script gerar-novo-certificado-ssl.sh não encontrado"
    exit 1
fi

echo ""

# 5. Aplicar configuração do Nginx
log_info "5️⃣ Aplicando configuração do Nginx..."
if [ -f "aplicar-config-nginx.sh" ]; then
    chmod +x aplicar-config-nginx.sh
    bash aplicar-config-nginx.sh
else
    log_warning "Script aplicar-config-nginx.sh não encontrado"
    log_info "Verificando configuração manualmente..."
    nginx -t
fi

echo ""

# 6. Verificar status final
log_info "6️⃣ Verificando status final..."
sleep 2

# Verificar Nginx
if systemctl is-active --quiet nginx; then
    log_success "Nginx está rodando"
else
    log_error "Nginx não está rodando"
    systemctl start nginx
fi

# Verificar portas
if netstat -tuln | grep -q ":443 "; then
    log_success "Porta 443 está aberta"
else
    log_warning "Porta 443 não está aberta"
fi

# Testar HTTPS
log_info "Testando HTTPS..."
HTTPS_RESPONSE=$(curl -I -s -o /dev/null -w "%{http_code}" --max-time 10 "https://${DOMAIN}" 2>&1)
if [ "$HTTPS_RESPONSE" = "200" ]; then
    log_success "✅ HTTPS está funcionando (código: $HTTPS_RESPONSE)"
elif [ "$HTTPS_RESPONSE" = "000" ]; then
    log_warning "HTTPS ainda não está respondendo (pode levar alguns segundos)"
else
    log_warning "HTTPS retornou código: $HTTPS_RESPONSE"
fi

echo ""
echo "=========================================="
log_success "✅ PROCESSO CONCLUÍDO!"
echo "=========================================="
log_info "Teste o site: https://${DOMAIN}"
echo ""

