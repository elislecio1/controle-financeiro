#!/bin/bash
# ============================================
# Script para Gerar Novo Certificado SSL
# Domínio: cf.don.cim.br
# ============================================

DOMAIN="cf.don.cim.br"
EMAIL="elislecio@gmail.com"
AAPANEL_CERT_DIR="/www/server/panel/vhost/cert/${DOMAIN}"
NGINX_CONFIG="/www/server/panel/vhost/nginx/${DOMAIN}.conf"
WEBROOT="/www/wwwroot/${DOMAIN}"
PROJECT_DIR="/www/wwwroot/${DOMAIN}"

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
echo "🔒 GERAR NOVO CERTIFICADO SSL"
echo "=========================================="
log_info "Domínio: ${DOMAIN}"
log_info "Email: ${EMAIL}"
echo "=========================================="
echo ""

# Verificar se é root
if [ "$EUID" -ne 0 ]; then 
    log_error "Este script precisa ser executado como root"
    exit 1
fi

# 1. Verificar se certbot está instalado
log_info "1️⃣ Verificando Certbot..."
if ! command -v certbot &> /dev/null; then
    log_warning "Certbot não encontrado. Instalando..."
    if command -v apt-get &> /dev/null; then
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    elif command -v yum &> /dev/null; then
        yum install -y certbot python3-certbot-nginx
    else
        log_error "Não foi possível instalar certbot automaticamente"
        exit 1
    fi
    log_success "Certbot instalado"
else
    log_success "Certbot já está instalado"
    certbot --version
fi

echo ""

# 2. Verificar se o domínio está acessível e se o diretório existe
log_info "2️⃣ Verificando acessibilidade do domínio..."
if curl -I "http://${DOMAIN}" > /dev/null 2>&1; then
    log_success "Domínio acessível via HTTP"
else
    log_warning "Domínio não está acessível via HTTP"
    log_info "Certbot tentará mesmo assim..."
fi

# Verificar se diretório do projeto existe
if [ ! -d "$PROJECT_DIR" ]; then
    log_error "Diretório do projeto não encontrado: $PROJECT_DIR"
    exit 1
fi

# Verificar se diretório dist existe (para webroot)
if [ ! -d "${PROJECT_DIR}/dist" ]; then
    log_warning "Diretório dist não encontrado. Será criado para webroot."
    mkdir -p "${PROJECT_DIR}/dist"
fi

echo ""

# 3. Parar Nginx temporariamente (para método standalone)
log_info "3️⃣ Parando Nginx para gerar certificado..."
if systemctl is-active --quiet nginx; then
    systemctl stop nginx
    sleep 2
    log_success "Nginx parado"
else
    log_info "Nginx já estava parado"
fi

# Verificar se porta 80 está livre
if lsof -i :80 > /dev/null 2>&1; then
    log_warning "Porta 80 ainda está em uso. Matando processos..."
    killall -9 nginx 2>/dev/null || true
    sleep 2
fi

echo ""

# 4. Remover certificados antigos (opcional, mas recomendado)
log_info "4️⃣ Removendo certificados antigos..."
if [ -d "${AAPANEL_CERT_DIR}" ]; then
    BACKUP_DIR="${AAPANEL_CERT_DIR}.backup.$(date +%Y%m%d-%H%M%S)"
    mv "${AAPANEL_CERT_DIR}" "${BACKUP_DIR}" 2>/dev/null
    log_info "Certificados antigos movidos para: ${BACKUP_DIR}"
fi

# Remover certificado Let's Encrypt antigo completamente
log_info "Removendo certificados Let's Encrypt antigos..."
CERT_DIR=$(find /etc/letsencrypt/live -maxdepth 1 -type d -name "${DOMAIN}*" | head -1)
if [ -n "$CERT_DIR" ]; then
    log_info "Encontrado diretório antigo: $CERT_DIR"
    # Tentar deletar via certbot primeiro
    certbot delete --cert-name "${DOMAIN}" --non-interactive 2>/dev/null || true
    sleep 1
fi

# Remover manualmente se ainda existir
if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
    log_info "Removendo diretório live: /etc/letsencrypt/live/${DOMAIN}"
    rm -rf "/etc/letsencrypt/live/${DOMAIN}" 2>/dev/null || true
fi

if [ -d "/etc/letsencrypt/archive/${DOMAIN}" ]; then
    log_info "Removendo diretório archive: /etc/letsencrypt/archive/${DOMAIN}"
    rm -rf "/etc/letsencrypt/archive/${DOMAIN}" 2>/dev/null || true
fi

if [ -f "/etc/letsencrypt/renewal/${DOMAIN}.conf" ]; then
    log_info "Removendo arquivo renewal: /etc/letsencrypt/renewal/${DOMAIN}.conf"
    rm -f "/etc/letsencrypt/renewal/${DOMAIN}.conf" 2>/dev/null || true
fi

# Remover qualquer diretório com sufixo
for dir in /etc/letsencrypt/live/${DOMAIN}-*; do
    if [ -d "$dir" ]; then
        log_info "Removendo diretório com sufixo: $dir"
        rm -rf "$dir" 2>/dev/null || true
    fi
done

for dir in /etc/letsencrypt/archive/${DOMAIN}-*; do
    if [ -d "$dir" ]; then
        log_info "Removendo archive com sufixo: $dir"
        rm -rf "$dir" 2>/dev/null || true
    fi
done

log_success "Limpeza de certificados antigos concluída"

echo ""

# 5. Gerar novo certificado usando método standalone
log_info "5️⃣ Gerando novo certificado SSL..."

# Verificar se porta 80 está realmente livre
if lsof -i :80 > /dev/null 2>&1; then
    log_warning "Porta 80 ainda está em uso. Matando processos..."
    killall -9 nginx 2>/dev/null || true
    killall -9 apache2 2>/dev/null || true
    sleep 3
fi

log_info "Tentando método standalone (requer porta 80 livre)..."

CERTBOT_OUTPUT=$(certbot certonly \
    --standalone \
    -d "${DOMAIN}" \
    --non-interactive \
    --agree-tos \
    --email "${EMAIL}" \
    --preferred-challenges http \
    2>&1)

CERTBOT_EXIT=$?

if [ $CERTBOT_EXIT -eq 0 ]; then
    log_success "Certificado gerado com sucesso!"
else
    log_warning "Método standalone falhou. Verificando logs..."
    log_info "Últimas linhas do log do Certbot:"
    tail -20 /var/log/letsencrypt/letsencrypt.log 2>/dev/null | grep -i error || echo "$CERTBOT_OUTPUT" | tail -10
    
    # Tentar método webroot como alternativa
    log_info "Tentando método webroot como alternativa..."
    
    # Criar diretório .well-known se não existir
    mkdir -p "${WEBROOT}/.well-known/acme-challenge"
    chown -R www:www "${WEBROOT}/.well-known" 2>/dev/null || chown -R www-data:www-data "${WEBROOT}/.well-known" 2>/dev/null
    
    # Iniciar Nginx para servir o webroot
    systemctl start nginx
    sleep 2
    
    CERTBOT_OUTPUT=$(certbot certonly \
        --webroot \
        -w "${WEBROOT}" \
        -d "${DOMAIN}" \
        --non-interactive \
        --agree-tos \
        --email "${EMAIL}" \
        --preferred-challenges http \
        2>&1)
    
    CERTBOT_EXIT=$?
    
    if [ $CERTBOT_EXIT -eq 0 ]; then
        log_success "Certificado gerado com sucesso usando webroot!"
    else
        log_error "Erro ao gerar certificado com ambos os métodos"
        log_info "Saída do Certbot:"
        echo "$CERTBOT_OUTPUT" | tail -20
        log_info "Verifique o log completo: tail -50 /var/log/letsencrypt/letsencrypt.log"
        systemctl start nginx
        exit 1
    fi
fi

echo ""

# 6. Encontrar diretório do certificado gerado
log_info "6️⃣ Localizando certificado gerado..."
CERT_DIR=$(find /etc/letsencrypt/live -maxdepth 1 -type d -name "${DOMAIN}*" | head -1)

if [ -z "$CERT_DIR" ]; then
    # Tentar sem sufixo
    CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
fi

if [ -d "$CERT_DIR" ] && [ -f "${CERT_DIR}/fullchain.pem" ]; then
    log_success "Certificado encontrado em: $CERT_DIR"
else
    log_error "Certificado não encontrado após geração"
    systemctl start nginx
    exit 1
fi

echo ""

# 7. Copiar certificado para Aapanel
log_info "7️⃣ Copiando certificado para Aapanel..."
mkdir -p "${AAPANEL_CERT_DIR}"

if [ -f "${CERT_DIR}/fullchain.pem" ] && [ -f "${CERT_DIR}/privkey.pem" ]; then
    cp "${CERT_DIR}/fullchain.pem" "${AAPANEL_CERT_DIR}/"
    cp "${CERT_DIR}/privkey.pem" "${AAPANEL_CERT_DIR}/"
    
    # Ajustar permissões
    chown -R www:www "${AAPANEL_CERT_DIR}" 2>/dev/null || chown -R www-data:www-data "${AAPANEL_CERT_DIR}" 2>/dev/null
    chmod 644 "${AAPANEL_CERT_DIR}/fullchain.pem"
    chmod 600 "${AAPANEL_CERT_DIR}/privkey.pem"
    
    log_success "Certificados copiados para: ${AAPANEL_CERT_DIR}"
else
    log_error "Arquivos de certificado não encontrados"
    systemctl start nginx
    exit 1
fi

echo ""

# 8. Verificar e atualizar configuração do Nginx
log_info "8️⃣ Verificando configuração do Nginx..."
if [ -f "$NGINX_CONFIG" ]; then
    # Verificar se certificados estão configurados corretamente
    if grep -q "ssl_certificate.*${DOMAIN}" "$NGINX_CONFIG"; then
        # Atualizar caminhos
        sed -i "s|ssl_certificate.*|ssl_certificate ${AAPANEL_CERT_DIR}/fullchain.pem;|g" "$NGINX_CONFIG"
        sed -i "s|ssl_certificate_key.*|ssl_certificate_key ${AAPANEL_CERT_DIR}/privkey.pem;|g" "$NGINX_CONFIG"
        log_success "Caminhos dos certificados atualizados"
    else
        log_warning "Certificados não configurados no Nginx"
        log_info "Execute: bash aplicar-config-nginx.sh"
    fi
else
    log_warning "Arquivo de configuração do Nginx não encontrado"
fi

echo ""

# 9. Testar configuração do Nginx
log_info "9️⃣ Testando configuração do Nginx..."
if nginx -t 2>&1 | grep -q "successful"; then
    log_success "Configuração do Nginx válida"
else
    log_error "Configuração do Nginx tem erros:"
    nginx -t
    systemctl start nginx
    exit 1
fi

echo ""

# 10. Iniciar Nginx
log_info "🔟 Iniciando Nginx..."
if systemctl start nginx; then
    log_success "Nginx iniciado"
    sleep 3
else
    log_error "Erro ao iniciar Nginx"
    exit 1
fi

echo ""

# 11. Verificar certificado
log_info "1️⃣1️⃣ Verificando certificado SSL..."
sleep 2

SSL_TEST=$(echo | timeout 5 openssl s_client -connect "${DOMAIN}:443" -servername "${DOMAIN}" 2>&1)
if echo "$SSL_TEST" | grep -q "Verify return code: 0"; then
    log_success "✅ Certificado SSL válido e funcionando!"
elif echo "$SSL_TEST" | grep -q "Connection refused"; then
    log_warning "Conexão recusada (pode levar alguns segundos para o Nginx iniciar)"
else
    log_warning "Verifique manualmente: openssl s_client -connect ${DOMAIN}:443"
fi

# Testar HTTPS
HTTPS_RESPONSE=$(curl -I -s -o /dev/null -w "%{http_code}" --max-time 10 "https://${DOMAIN}" 2>&1)
if [ "$HTTPS_RESPONSE" = "200" ]; then
    log_success "✅ HTTPS está funcionando (código: $HTTPS_RESPONSE)"
else
    log_warning "HTTPS retornou código: $HTTPS_RESPONSE"
fi

echo ""
echo "=========================================="
log_success "✅ PROCESSO CONCLUÍDO!"
echo "=========================================="
log_info "Certificado instalado em: ${AAPANEL_CERT_DIR}"
log_info "Certificado Let's Encrypt em: ${CERT_DIR}"
log_info "Teste o site: https://${DOMAIN}"
echo "=========================================="
echo ""
log_info "📝 PRÓXIMOS PASSOS:"
log_info "1. Se o site ainda não funciona, execute: bash diagnosticar-ssl.sh"
log_info "2. Para renovar automaticamente, configure cron: certbot renew --dry-run"
echo ""

