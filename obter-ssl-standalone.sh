#!/bin/bash

# Script para obter certificado SSL usando método standalone
# Uso: sudo ./obter-ssl-standalone.sh

echo "🔒 Obtendo certificado SSL para cf.don.cim.br (método standalone)"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DOMAIN="cf.don.cim.br"

# Verificar se é root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Por favor, execute com sudo${NC}"
    echo "Uso: sudo ./obter-ssl-standalone.sh"
    exit 1
fi

# Verificar se certbot está instalado
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}⚠ Certbot não encontrado. Instalando...${NC}"
    apt update
    apt install -y certbot python3-certbot-nginx
fi

echo -e "${GREEN}✓ Certbot encontrado${NC}"

# Parar Nginx
echo ""
echo "⏸️ Parando Nginx..."
systemctl stop nginx

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠ Nginx pode não estar rodando${NC}"
fi

# Obter certificado
echo ""
echo "📜 Obtendo certificado SSL..."
certbot certonly --standalone -d $DOMAIN --email admin@don.cim.br --agree-tos --non-interactive

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Certificado SSL obtido com sucesso!${NC}"
    
    # Reiniciar Nginx
    echo ""
    echo "▶️ Reiniciando Nginx..."
    systemctl start nginx
    
    # Verificar certificado
    echo ""
    echo "📋 Verificando certificado..."
    certbot certificates
    
    # Copiar para aapanel
    echo ""
    echo "📁 Copiando certificados para aapanel..."
    mkdir -p /www/server/panel/vhost/cert/$DOMAIN
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /www/server/panel/vhost/cert/$DOMAIN/
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /www/server/panel/vhost/cert/$DOMAIN/
    chown -R www:www /www/server/panel/vhost/cert/$DOMAIN
    chmod 600 /www/server/panel/vhost/cert/$DOMAIN/privkey.pem
    chmod 644 /www/server/panel/vhost/cert/$DOMAIN/fullchain.pem
    
    echo ""
    echo -e "${GREEN}✅ Certificados copiados!${NC}"
    echo ""
    echo "📝 Próximos passos:"
    echo "1. Configure o Nginx com SSL (use nginx-cf-don-cim-SSL.conf)"
    echo "2. Teste: https://cf.don.cim.br"
else
    echo ""
    echo -e "${RED}❌ Erro ao obter certificado SSL${NC}"
    echo "Reiniciando Nginx..."
    systemctl start nginx
    exit 1
fi

