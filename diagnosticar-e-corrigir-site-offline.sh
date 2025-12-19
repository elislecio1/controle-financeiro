#!/bin/bash
# ============================================
# Script para Diagnosticar e Corrigir Site Offline
# Domínio: cf.don.cim.br
# ============================================

DOMAIN="cf.don.cim.br"
PROJECT_DIR="/www/wwwroot/${DOMAIN}"
NGINX_CONFIG="/www/server/panel/vhost/nginx/${DOMAIN}.conf"
NGINX_LOG="/var/log/nginx/error.log"

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
echo "🔍 DIAGNÓSTICO DE SITE OFFLINE"
echo "=========================================="
echo ""

# 1. Verificar se Nginx está rodando
log_info "1. Verificando status do Nginx..."
if systemctl is-active --quiet nginx; then
    log_success "Nginx está rodando"
else
    log_error "Nginx NÃO está rodando!"
    log_info "Tentando iniciar Nginx..."
    if systemctl start nginx; then
        sleep 2
        if systemctl is-active --quiet nginx; then
            log_success "Nginx iniciado com sucesso"
        else
            log_error "Falha ao iniciar Nginx"
        fi
    else
        log_error "Não foi possível iniciar Nginx"
    fi
fi
echo ""

# 2. Verificar se está escutando nas portas
log_info "2. Verificando portas 80 e 443..."
if netstat -tuln | grep -q ":80 "; then
    log_success "Porta 80 está aberta"
else
    log_error "Porta 80 NÃO está aberta"
fi

if netstat -tuln | grep -q ":443 "; then
    log_success "Porta 443 está aberta"
else
    log_warning "Porta 443 NÃO está aberta (pode ser normal se SSL não estiver configurado)"
fi
echo ""

# 3. Verificar configuração do Nginx
log_info "3. Verificando configuração do Nginx..."
if [ ! -f "$NGINX_CONFIG" ]; then
    log_error "Arquivo de configuração não encontrado: $NGINX_CONFIG"
    exit 1
fi

log_info "Testando configuração..."
if nginx -t 2>&1 | grep -q "successful"; then
    log_success "Configuração do Nginx é válida"
else
    log_error "Configuração do Nginx tem erros!"
    echo ""
    log_info "Erros encontrados:"
    nginx -t 2>&1 | grep -i error
    exit 1
fi
echo ""

# 4. Verificar diretório do projeto
log_info "4. Verificando diretório do projeto..."
if [ ! -d "$PROJECT_DIR" ]; then
    log_error "Diretório do projeto não encontrado: $PROJECT_DIR"
    exit 1
fi

if [ ! -d "$PROJECT_DIR/dist" ]; then
    log_error "Diretório dist não encontrado!"
    log_info "Fazendo build do projeto..."
    cd "$PROJECT_DIR"
    npm run build
    if [ $? -eq 0 ]; then
        log_success "Build concluído"
    else
        log_error "Falha no build"
        exit 1
    fi
else
    log_success "Diretório dist existe"
fi

if [ ! -f "$PROJECT_DIR/dist/index.html" ]; then
    log_error "index.html não encontrado em dist/"
    log_info "Fazendo build do projeto..."
    cd "$PROJECT_DIR"
    npm run build
else
    log_success "index.html existe"
fi
echo ""

# 5. Verificar configuração root no Nginx
log_info "5. Verificando configuração root no Nginx..."
ROOT_DIR=$(grep -E "^\s*root\s+" "$NGINX_CONFIG" | head -1 | awk '{print $2}' | tr -d ';')
if [ -z "$ROOT_DIR" ]; then
    log_error "Diretiva 'root' não encontrada na configuração do Nginx"
    log_info "Verificando se usa 'try_files' ou outra configuração..."
    grep -E "root|try_files" "$NGINX_CONFIG" | head -5
else
    log_success "Root configurado: $ROOT_DIR"
    if [ -d "$ROOT_DIR" ]; then
        log_success "Diretório root existe"
    else
        log_error "Diretório root não existe: $ROOT_DIR"
    fi
fi
echo ""

# 6. Verificar permissões
log_info "6. Verificando permissões..."
if [ -d "$PROJECT_DIR/dist" ]; then
    PERMS=$(stat -c "%a %U:%G" "$PROJECT_DIR/dist" 2>/dev/null || stat -f "%OLp %Su:%Sg" "$PROJECT_DIR/dist" 2>/dev/null)
    log_info "Permissões de dist/: $PERMS"
    
    # Tentar corrigir permissões se necessário
    chown -R www:www "$PROJECT_DIR/dist" 2>/dev/null || chown -R www-data:www-data "$PROJECT_DIR/dist" 2>/dev/null
    chmod -R 755 "$PROJECT_DIR/dist" 2>/dev/null
    log_success "Permissões ajustadas"
fi
echo ""

# 7. Verificar logs de erro
log_info "7. Verificando últimos erros do Nginx..."
if [ -f "$NGINX_LOG" ]; then
    ERROR_COUNT=$(tail -50 "$NGINX_LOG" | grep -i error | wc -l)
    if [ "$ERROR_COUNT" -gt 0 ]; then
        log_warning "Encontrados $ERROR_COUNT erros recentes nos logs"
        echo ""
        log_info "Últimos erros:"
        tail -20 "$NGINX_LOG" | grep -i error | tail -5
    else
        log_success "Nenhum erro recente nos logs"
    fi
else
    log_warning "Arquivo de log não encontrado: $NGINX_LOG"
fi
echo ""

# 8. Tentar recarregar Nginx
log_info "8. Recarregando Nginx..."
if systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null; then
    log_success "Nginx recarregado"
    sleep 2
else
    log_warning "Não foi possível recarregar Nginx, tentando reiniciar..."
    if systemctl restart nginx 2>/dev/null || service nginx restart 2>/dev/null; then
        log_success "Nginx reiniciado"
        sleep 3
    else
        log_error "Não foi possível reiniciar Nginx"
    fi
fi
echo ""

# 9. Testar conectividade
log_info "9. Testando conectividade..."
if curl -I http://localhost 2>&1 | grep -q "HTTP"; then
    log_success "Nginx responde localmente"
else
    log_error "Nginx não responde localmente"
fi

if curl -I "http://${DOMAIN}" 2>&1 | grep -q "HTTP"; then
    log_success "Site acessível via HTTP"
else
    log_error "Site NÃO acessível via HTTP"
    log_info "Verifique se o domínio aponta para este servidor"
fi

if curl -I "https://${DOMAIN}" 2>&1 | grep -q "HTTP"; then
    log_success "Site acessível via HTTPS"
else
    log_warning "Site NÃO acessível via HTTPS (pode ser normal se SSL não estiver configurado)"
fi
echo ""

# 10. Resumo
echo "=========================================="
echo "📋 RESUMO DO DIAGNÓSTICO"
echo "=========================================="
echo ""

NGINX_STATUS=$(systemctl is-active nginx 2>/dev/null || echo "unknown")
PORT80=$(netstat -tuln | grep -q ":80 " && echo "aberta" || echo "fechada")
PORT443=$(netstat -tuln | grep -q ":443 " && echo "aberta" || echo "fechada")
DIST_EXISTS=$([ -d "$PROJECT_DIR/dist" ] && echo "sim" || echo "não")
INDEX_EXISTS=$([ -f "$PROJECT_DIR/dist/index.html" ] && echo "sim" || echo "não")

echo "Nginx: $NGINX_STATUS"
echo "Porta 80: $PORT80"
echo "Porta 443: $PORT443"
echo "Diretório dist: $DIST_EXISTS"
echo "index.html: $INDEX_EXISTS"
echo ""

if [ "$NGINX_STATUS" = "active" ] && [ "$PORT80" = "aberta" ] && [ "$DIST_EXISTS" = "sim" ] && [ "$INDEX_EXISTS" = "sim" ]; then
    log_success "✅ Site deve estar funcionando!"
    log_info "Teste: curl -I http://${DOMAIN}"
else
    log_error "❌ Problemas detectados. Verifique os itens acima."
fi

echo ""
echo "=========================================="

