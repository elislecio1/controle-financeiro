#!/bin/bash

# Script para obter certificado SSL via Let's Encrypt para cf.don.cim.br
# Uso: sudo ./obter-ssl-cf-don-cim.sh

echo "🔒 Obtendo certificado SSL para cf.don.cim.br"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DOMAIN="cf.don.cim.br"
WEBROOT="/www/wwwroot/cf.don.cim.br"

# Verificar se é root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Por favor, execute com sudo${NC}"
    echo "Uso: sudo ./obter-ssl-cf-don-cim.sh"
    exit 1
fi

# Verificar se certbot está instalado
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}⚠ Certbot não encontrado. Instalando...${NC}"
    
    # Detectar sistema operacional
    if [ -f /etc/debian_version ]; then
        apt update
        apt install -y certbot python3-certbot-nginx
    elif [ -f /etc/redhat-release ]; then
        yum install -y certbot python3-certbot-nginx
    else
        echo -e "${RED}❌ Sistema operacional não suportado. Instale o certbot manualmente.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Certbot encontrado: $(certbot --version)${NC}"

# Verificar se o domínio está acessível
echo ""
echo "🔍 Verificando DNS..."
if ! nslookup $DOMAIN &> /dev/null; then
    echo -e "${YELLOW}⚠ Aviso: Não foi possível resolver o DNS para $DOMAIN${NC}"
    echo "Certifique-se de que o domínio está apontando para este servidor."
    read -p "Continuar mesmo assim? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

# Verificar se o webroot existe
if [ ! -d "$WEBROOT" ]; then
    echo -e "${YELLOW}⚠ Diretório webroot não encontrado: $WEBROOT${NC}"
    echo "Usando método standalone..."
    METHOD="standalone"
else
    echo -e "${GREEN}✓ Webroot encontrado: $WEBROOT${NC}"
    METHOD="webroot"
fi

# Obter certificado
echo ""
echo "📜 Obtendo certificado SSL..."
echo ""

if [ "$METHOD" == "webroot" ]; then
    certbot certonly --webroot -w $WEBROOT -d $DOMAIN --email admin@don.cim.br --agree-tos --non-interactive
else
    echo -e "${YELLOW}⚠ Parando Nginx temporariamente...${NC}"
    systemctl stop nginx 2>/dev/null || service nginx stop 2>/dev/null
    
    certbot certonly --standalone -d $DOMAIN --email admin@don.cim.br --agree-tos --non-interactive
    
    echo -e "${YELLOW}⚠ Reiniciando Nginx...${NC}"
    systemctl start nginx 2>/dev/null || service nginx start 2>/dev/null
fi

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Certificado SSL obtido com sucesso!${NC}"
    echo ""
    echo "📁 Localização dos certificados:"
    echo "   /etc/letsencrypt/live/$DOMAIN/"
    echo ""
    
    # Verificar certificados
    echo "📋 Verificando certificados:"
    ls -la /etc/letsencrypt/live/$DOMAIN/
    echo ""
    
    # Verificar data de expiração
    echo "📅 Data de expiração:"
    openssl x509 -in /etc/letsencrypt/live/$DOMAIN/cert.pem -noout -dates
    echo ""
    
    # Copiar para caminho do aapanel (se necessário)
    AAPANEL_CERT_DIR="/www/server/panel/vhost/cert/$DOMAIN"
    if [ ! -d "$AAPANEL_CERT_DIR" ]; then
        echo -e "${YELLOW}⚠ Diretório do aapanel não encontrado.${NC}"
        echo "Deseja copiar os certificados para o caminho do aapanel? (s/N)"
        read -p "Resposta: " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Ss]$ ]]; then
            mkdir -p $AAPANEL_CERT_DIR
            cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $AAPANEL_CERT_DIR/
            cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $AAPANEL_CERT_DIR/
            chown -R www:www $AAPANEL_CERT_DIR
            chmod 600 $AAPANEL_CERT_DIR/privkey.pem
            chmod 644 $AAPANEL_CERT_DIR/fullchain.pem
            echo -e "${GREEN}✓ Certificados copiados para: $AAPANEL_CERT_DIR${NC}"
        fi
    fi
    
    echo ""
    echo "📝 Próximos passos:"
    echo "1. Configure o Nginx com SSL (use nginx-cf-don-cim.conf)"
    echo "2. Teste a configuração: sudo nginx -t"
    echo "3. Recarregue o Nginx: sudo systemctl reload nginx"
    echo ""
    echo -e "${GREEN}🎉 Certificado SSL configurado!${NC}"
else
    echo ""
    echo -e "${RED}❌ Erro ao obter certificado SSL${NC}"
    echo "Verifique os logs: sudo tail -f /var/log/letsencrypt/letsencrypt.log"
    exit 1
fi

