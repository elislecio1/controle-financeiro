#!/bin/bash
# ============================================
# Script para Verificar e Corrigir HTTPS
# ============================================

DOMAIN="cf.don.cim.br"
NGINX_CONFIG="/www/server/panel/vhost/nginx/${DOMAIN}.conf"

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
echo "🔍 VERIFICAR E CORRIGIR HTTPS"
echo "=========================================="
echo ""

# Verificar se é root
if [ "$EUID" -ne 0 ]; then 
    log_error "Este script precisa ser executado como root"
    exit 1
fi

# 1. Verificar status do Nginx
log_info "1️⃣ Verificando status do Nginx..."
if systemctl is-active --quiet nginx; then
    log_success "Nginx está rodando"
else
    log_error "Nginx não está rodando"
    log_info "Iniciando Nginx..."
    systemctl start nginx
    sleep 3
    if systemctl is-active --quiet nginx; then
        log_success "Nginx iniciado"
    else
        log_error "Não foi possível iniciar Nginx"
        log_info "Verificando erros:"
        systemctl status nginx --no-pager -l | head -20
        exit 1
    fi
fi

echo ""

# 2. Verificar portas
log_info "2️⃣ Verificando portas..."
if netstat -tuln | grep -q ":80 "; then
    log_success "Porta 80 está aberta"
else
    log_warning "Porta 80 não está aberta"
fi

if netstat -tuln | grep -q ":443 "; then
    log_success "Porta 443 está aberta"
else
    log_warning "Porta 443 não está aberta"
    log_info "Aguardando alguns segundos..."
    sleep 5
    if netstat -tuln | grep -q ":443 "; then
        log_success "Porta 443 agora está aberta"
    else
        log_error "Porta 443 ainda não está aberta"
    fi
fi

echo ""

# 3. Verificar configuração do Nginx
log_info "3️⃣ Verificando configuração do Nginx..."
if nginx -t 2>&1 | grep -q "successful"; then
    log_success "Configuração válida"
else
    log_error "Configuração inválida:"
    nginx -t
    exit 1
fi

# Verificar se listen 443 está configurado
if grep -q "listen 443" "$NGINX_CONFIG"; then
    log_success "listen 443 configurado"
else
    log_error "listen 443 não encontrado na configuração"
    exit 1
fi

echo ""

# 4. Verificar processos do Nginx
log_info "4️⃣ Verificando processos do Nginx..."
NGINX_PROCESSES=$(ps aux | grep nginx | grep -v grep | wc -l)
log_info "Processos Nginx encontrados: $NGINX_PROCESSES"

# Verificar se há processo master
if ps aux | grep -q "[n]ginx: master process"; then
    log_success "Processo master do Nginx encontrado"
else
    log_error "Processo master do Nginx não encontrado"
    log_info "Reiniciando Nginx..."
    systemctl restart nginx
    sleep 3
fi

echo ""

# 5. Verificar logs de erro
log_info "5️⃣ Verificando logs de erro recentes..."
ERROR_LOG="/www/wwwlogs/cf.don.cim.br.error.log"
if [ -f "$ERROR_LOG" ]; then
    RECENT_ERRORS=$(tail -20 "$ERROR_LOG" | grep -i "error\|fail" | tail -5)
    if [ -n "$RECENT_ERRORS" ]; then
        log_warning "Erros recentes encontrados:"
        echo "$RECENT_ERRORS"
    else
        log_success "Nenhum erro recente encontrado"
    fi
else
    log_warning "Arquivo de log não encontrado: $ERROR_LOG"
fi

echo ""

# 6. Verificar firewall
log_info "6️⃣ Verificando firewall..."
if command -v ufw &> /dev/null; then
    if ufw status | grep -q "443"; then
        log_success "Porta 443 permitida no firewall"
    else
        log_warning "Porta 443 pode não estar permitida no firewall"
        log_info "Para permitir: ufw allow 443/tcp"
    fi
elif command -v firewall-cmd &> /dev/null; then
    if firewall-cmd --list-ports | grep -q "443"; then
        log_success "Porta 443 permitida no firewall"
    else
        log_warning "Porta 443 pode não estar permitida no firewall"
    fi
else
    log_info "Firewall não detectado ou não configurado"
fi

echo ""

# 7. Testar conectividade
log_info "7️⃣ Testando conectividade..."

# Testar HTTP
log_info "Testando HTTP..."
HTTP_RESPONSE=$(curl -I -s -o /dev/null -w "%{http_code}" --max-time 5 "http://${DOMAIN}" 2>&1)
if [ "$HTTP_RESPONSE" = "301" ] || [ "$HTTP_RESPONSE" = "302" ]; then
    log_success "HTTP redireciona corretamente (código: $HTTP_RESPONSE)"
elif [ "$HTTP_RESPONSE" = "200" ]; then
    log_warning "HTTP retorna 200 (deveria redirecionar para HTTPS)"
else
    log_warning "HTTP retornou código: $HTTP_RESPONSE"
fi

# Testar HTTPS
log_info "Testando HTTPS..."
HTTPS_RESPONSE=$(curl -I -s -o /dev/null -w "%{http_code}" --max-time 10 "https://${DOMAIN}" 2>&1)
if [ "$HTTPS_RESPONSE" = "200" ]; then
    log_success "✅ HTTPS está funcionando (código: $HTTPS_RESPONSE)"
elif [ "$HTTPS_RESPONSE" = "000" ]; then
    log_error "HTTPS não está respondendo (timeout ou conexão recusada)"
    log_info "Tentando reiniciar Nginx..."
    systemctl restart nginx
    sleep 5
    HTTPS_RESPONSE=$(curl -I -s -o /dev/null -w "%{http_code}" --max-time 10 "https://${DOMAIN}" 2>&1)
    if [ "$HTTPS_RESPONSE" = "200" ]; then
        log_success "✅ HTTPS funcionando após reiniciar Nginx"
    else
        log_warning "HTTPS ainda retorna código: $HTTPS_RESPONSE"
    fi
else
    log_warning "HTTPS retornou código: $HTTPS_RESPONSE"
fi

# Testar certificado SSL diretamente
log_info "Testando certificado SSL..."
SSL_TEST=$(echo | timeout 5 openssl s_client -connect "${DOMAIN}:443" -servername "${DOMAIN}" 2>&1)
if echo "$SSL_TEST" | grep -q "Verify return code: 0"; then
    log_success "✅ Certificado SSL válido"
elif echo "$SSL_TEST" | grep -q "Connection refused"; then
    log_error "Conexão recusada na porta 443"
    log_info "Verificando se Nginx está escutando:"
    netstat -tuln | grep ":443" || echo "Porta 443 não encontrada"
elif echo "$SSL_TEST" | grep -q "timeout"; then
    log_error "Timeout ao conectar na porta 443"
else
    log_warning "Problema com certificado SSL:"
    echo "$SSL_TEST" | grep -i "verify\|error" | head -3
fi

echo ""

# 8. Resumo e recomendações
echo "=========================================="
echo "📋 RESUMO"
echo "=========================================="

if [ "$HTTPS_RESPONSE" = "200" ]; then
    log_success "✅ HTTPS está funcionando!"
    echo ""
    log_info "Teste no navegador: https://${DOMAIN}"
else
    log_warning "⚠️ HTTPS ainda não está funcionando completamente"
    echo ""
    log_info "Próximos passos:"
    log_info "1. Verificar logs: tail -50 /www/wwwlogs/cf.don.cim.br.error.log"
    log_info "2. Verificar status: systemctl status nginx"
    log_info "3. Verificar portas: netstat -tuln | grep -E ':80|:443'"
    log_info "4. Verificar configuração: nginx -t"
    log_info "5. Reiniciar Nginx: systemctl restart nginx"
fi

echo ""

