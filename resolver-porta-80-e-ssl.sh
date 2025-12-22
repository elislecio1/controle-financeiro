#!/bin/bash
# ============================================
# Script para Resolver Porta 80 em Uso e Corrigir SSL
# ============================================

DOMAIN="cf.don.cim.br"
NGINX_CONFIG="/www/server/panel/vhost/nginx/${DOMAIN}.conf"
AAPANEL_CERT_DIR="/www/server/panel/vhost/cert/${DOMAIN}"

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
echo "🔧 RESOLVER PORTA 80 E SSL"
echo "=========================================="
echo ""

# Verificar se é root
if [ "$EUID" -ne 0 ]; then 
    log_error "Este script precisa ser executado como root"
    exit 1
fi

# 1. Identificar processo usando porta 80
log_info "1️⃣ Identificando processo usando porta 80..."
PROCESS_80=$(lsof -ti :80 2>/dev/null | head -1)

if [ -n "$PROCESS_80" ]; then
    log_warning "Processo encontrado usando porta 80: PID $PROCESS_80"
    PROCESS_INFO=$(ps -p "$PROCESS_80" -o comm=,args= 2>/dev/null)
    log_info "Informações do processo: $PROCESS_INFO"
    
    # Verificar se é Nginx
    if echo "$PROCESS_INFO" | grep -q nginx; then
        log_info "É um processo do Nginx. Parando todos os processos Nginx..."
        systemctl stop nginx 2>/dev/null || true
        killall -9 nginx 2>/dev/null || true
        sleep 2
    else
        log_warning "Não é Nginx. Matando processo..."
        kill -9 "$PROCESS_80" 2>/dev/null || true
        sleep 2
    fi
else
    log_success "Porta 80 está livre"
fi

# Verificar novamente
if lsof -ti :80 > /dev/null 2>&1; then
    log_error "Porta 80 ainda está em uso"
    log_info "Processos usando porta 80:"
    lsof -i :80
    log_info "Tentando matar todos os processos..."
    killall -9 nginx 2>/dev/null || true
    killall -9 apache2 2>/dev/null || true
    sleep 3
else
    log_success "Porta 80 está livre agora"
fi

echo ""

# 2. Corrigir configuração duplicada
log_info "2️⃣ Corrigindo configuração duplicada..."
if [ ! -f "$NGINX_CONFIG" ]; then
    log_error "Arquivo de configuração não encontrado: $NGINX_CONFIG"
    exit 1
fi

# Fazer backup
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d-%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
log_info "Backup criado: $BACKUP_FILE"

# Remover linhas duplicadas de ssl_certificate e ssl_certificate_key
# Manter apenas a primeira ocorrência de cada
TEMP_FILE=$(mktemp)
SSL_CERT_ADDED=0
SSL_KEY_ADDED=0

while IFS= read -r line || [ -n "$line" ]; do
    # Verificar se é ssl_certificate
    if echo "$line" | grep -q "ssl_certificate.*fullchain.pem"; then
        if [ "$SSL_CERT_ADDED" -eq 0 ]; then
            echo "$line" >> "$TEMP_FILE"
            SSL_CERT_ADDED=1
        else
            log_info "Removendo linha duplicada: ssl_certificate"
        fi
    # Verificar se é ssl_certificate_key
    elif echo "$line" | grep -q "ssl_certificate_key.*privkey.pem"; then
        if [ "$SSL_KEY_ADDED" -eq 0 ]; then
            echo "$line" >> "$TEMP_FILE"
            SSL_KEY_ADDED=1
        else
            log_info "Removendo linha duplicada: ssl_certificate_key"
        fi
    else
        echo "$line" >> "$TEMP_FILE"
    fi
done < "$NGINX_CONFIG"

mv "$TEMP_FILE" "$NGINX_CONFIG"
log_success "Linhas duplicadas removidas"

# Verificar se ambas as linhas estão presentes
if grep -q "ssl_certificate.*fullchain.pem" "$NGINX_CONFIG" && \
   grep -q "ssl_certificate_key.*privkey.pem" "$NGINX_CONFIG"; then
    log_success "Configuração SSL correta (sem duplicatas)"
else
    log_error "Problema ao corrigir configuração"
    exit 1
fi

echo ""

# 3. Verificar se certificados existem
log_info "3️⃣ Verificando certificados..."
if [ ! -f "${AAPANEL_CERT_DIR}/fullchain.pem" ] || [ ! -f "${AAPANEL_CERT_DIR}/privkey.pem" ]; then
    log_error "Certificados não encontrados em: ${AAPANEL_CERT_DIR}"
    exit 1
fi
log_success "Certificados encontrados"

echo ""

# 4. Testar configuração do Nginx
log_info "4️⃣ Testando configuração do Nginx..."
if nginx -t 2>&1 | grep -q "successful"; then
    log_success "Configuração válida"
else
    log_error "Configuração inválida:"
    nginx -t
    exit 1
fi

echo ""

# 5. Iniciar Nginx
log_info "5️⃣ Iniciando Nginx..."
systemctl start nginx 2>/dev/null || service nginx start 2>/dev/null

sleep 3

# Verificar se iniciou
if systemctl is-active --quiet nginx; then
    log_success "Nginx iniciado"
else
    log_error "Nginx não iniciou"
    log_info "Verificando erros:"
    systemctl status nginx --no-pager -l | head -20
    exit 1
fi

echo ""

# 6. Verificar portas
log_info "6️⃣ Verificando portas..."
sleep 2

if netstat -tuln | grep -q ":80 "; then
    log_success "Porta 80 está aberta"
else
    log_warning "Porta 80 não está aberta"
fi

if netstat -tuln | grep -q ":443 "; then
    log_success "✅ Porta 443 está aberta"
else
    log_warning "Porta 443 não está aberta"
    log_info "Aguardando mais alguns segundos..."
    sleep 5
    if netstat -tuln | grep -q ":443 "; then
        log_success "✅ Porta 443 agora está aberta"
    else
        log_error "Porta 443 ainda não está aberta"
        log_info "Verificando processos Nginx:"
        ps aux | grep nginx | grep -v grep
        log_info "Verificando se há erros nos logs:"
        tail -20 /var/log/nginx/error.log 2>/dev/null || tail -20 /www/wwwlogs/cf.don.cim.br.error.log
    fi
fi

echo ""

# 7. Testar conectividade
log_info "7️⃣ Testando conectividade..."

# Testar HTTP
log_info "Testando HTTP..."
HTTP_RESPONSE=$(curl -I -s -o /dev/null -w "%{http_code}" --max-time 5 "http://${DOMAIN}" 2>&1)
if [ "$HTTP_RESPONSE" = "301" ] || [ "$HTTP_RESPONSE" = "302" ]; then
    log_success "✅ HTTP redireciona para HTTPS (código: $HTTP_RESPONSE)"
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
    log_warning "HTTPS retornou código 000 (timeout/conexão recusada)"
    log_info "Verificando se porta 443 está realmente aberta:"
    netstat -tuln | grep ":443"
else
    log_warning "HTTPS retornou código: $HTTPS_RESPONSE"
fi

echo ""

# 8. Resumo
echo "=========================================="
if [ "$HTTPS_RESPONSE" = "200" ]; then
    log_success "✅ HTTPS ESTÁ FUNCIONANDO!"
else
    log_warning "⚠️ HTTPS ainda precisa de atenção"
    log_info "Verifique:"
    log_info "  - Porta 443: netstat -tuln | grep :443"
    log_info "  - Status Nginx: systemctl status nginx"
    log_info "  - Logs: tail -50 /www/wwwlogs/cf.don.cim.br.error.log"
fi
echo "=========================================="
log_info "Teste no navegador: https://${DOMAIN}"
echo ""

