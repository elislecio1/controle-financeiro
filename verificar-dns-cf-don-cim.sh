#!/bin/bash

# Script para verificar configuração DNS para cf.don.cim.br
# Uso: ./verificar-dns-cf-don-cim.sh

echo "🔍 Verificando configuração DNS para cf.don.cim.br"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DOMAIN="cf.don.cim.br"

# Verificar se dig está instalado
if ! command -v dig &> /dev/null; then
    echo -e "${YELLOW}⚠ dig não encontrado. Instalando...${NC}"
    apt update && apt install -y dnsutils
fi

# Verificar IP público do servidor
echo "📡 Descobrindo IP público do servidor..."
PUBLIC_IP=$(curl -s -4 ifconfig.me 2>/dev/null || curl -s ifconfig.me 2>/dev/null)

if [ -z "$PUBLIC_IP" ]; then
    echo -e "${RED}❌ Não foi possível descobrir o IP público${NC}"
    echo "Verifique sua conexão com a internet"
    exit 1
fi

echo -e "${GREEN}✓ IP público do servidor: $PUBLIC_IP${NC}"
echo ""

# Verificar DNS
echo "🔍 Verificando DNS..."
DNS_RESULT=$(dig +short $DOMAIN A 2>/dev/null)

if [ -z "$DNS_RESULT" ]; then
    echo -e "${RED}❌ DNS não configurado!${NC}"
    echo ""
    echo "O domínio $DOMAIN não está resolvendo para nenhum IP."
    echo ""
    echo "📝 Ação necessária:"
    echo "1. Acesse o painel DNS do seu provedor"
    echo "2. Crie um registro DNS tipo A:"
    echo "   - Nome: cf"
    echo "   - IP: $PUBLIC_IP"
    echo "   - TTL: 3600"
    echo ""
    echo "3. Aguarde a propagação DNS (5-30 minutos)"
    echo "4. Execute este script novamente para verificar"
    exit 1
fi

echo -e "${GREEN}✓ DNS encontrado: $DNS_RESULT${NC}"
echo ""

# Verificar se o IP do DNS corresponde ao IP público
if [ "$DNS_RESULT" == "$PUBLIC_IP" ]; then
    echo -e "${GREEN}✅ DNS está apontando corretamente para este servidor!${NC}"
    DNS_OK=true
else
    echo -e "${YELLOW}⚠ DNS está apontando para IP diferente: $DNS_RESULT${NC}"
    echo "   IP do servidor: $PUBLIC_IP"
    echo "   IP no DNS: $DNS_RESULT"
    echo ""
    echo "Verifique se este é o servidor correto ou atualize o DNS."
    DNS_OK=false
fi

echo ""

# Verificar acesso HTTP
echo "🌐 Testando acesso HTTP..."
HTTP_TEST=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://$DOMAIN 2>/dev/null)

if [ "$HTTP_TEST" == "200" ] || [ "$HTTP_TEST" == "301" ] || [ "$HTTP_TEST" == "302" ]; then
    echo -e "${GREEN}✅ Site está acessível via HTTP (código: $HTTP_TEST)${NC}"
    HTTP_OK=true
else
    echo -e "${YELLOW}⚠ Site não está acessível via HTTP (código: $HTTP_TEST)${NC}"
    echo "   Verifique se o Nginx está rodando e configurado corretamente"
    HTTP_OK=false
fi

echo ""

# Resumo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Resumo da Verificação"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "IP Público do Servidor: $PUBLIC_IP"
echo "DNS Resolvido: $DNS_RESULT"
echo "Acesso HTTP: $HTTP_TEST"
echo ""

if [ "$DNS_OK" == true ] && [ "$HTTP_OK" == true ]; then
    echo -e "${GREEN}✅ Tudo OK! Você pode obter o certificado SSL agora.${NC}"
    echo ""
    echo "Execute:"
    echo "  sudo certbot certonly --webroot -w /www/wwwroot/cf.don.cim.br -d cf.don.cim.br"
elif [ "$DNS_OK" == true ] && [ "$HTTP_OK" == false ]; then
    echo -e "${YELLOW}⚠ DNS está OK, mas o site não está acessível.${NC}"
    echo "   Configure o Nginx primeiro."
elif [ "$DNS_OK" == false ]; then
    echo -e "${RED}❌ Configure o DNS primeiro antes de obter o certificado SSL.${NC}"
fi

echo ""

# Verificar de diferentes servidores DNS
echo "🔍 Verificando propagação DNS em diferentes servidores..."
echo ""
echo "Google DNS (8.8.8.8):"
GOOGLE_DNS=$(dig @8.8.8.8 +short $DOMAIN A 2>/dev/null)
if [ -n "$GOOGLE_DNS" ]; then
    echo -e "  ${GREEN}✓ $GOOGLE_DNS${NC}"
else
    echo -e "  ${RED}✗ Não encontrado${NC}"
fi

echo "Cloudflare DNS (1.1.1.1):"
CF_DNS=$(dig @1.1.1.1 +short $DOMAIN A 2>/dev/null)
if [ -n "$CF_DNS" ]; then
    echo -e "  ${GREEN}✓ $CF_DNS${NC}"
else
    echo -e "  ${RED}✗ Não encontrado${NC}"
fi

echo ""

