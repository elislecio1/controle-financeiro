#!/bin/bash
# Script rápido para copiar certificado manualmente

DOMAIN="cf.don.cim.br"
LETSENCRYPT_LIVE_DIR="/etc/letsencrypt/live"
AAPANEL_CERT_DIR="/www/server/panel/vhost/cert/${DOMAIN}"

echo "🔍 Procurando certificado..."

# Procurar diretório do certificado
CERT_DIR=$(find "${LETSENCRYPT_LIVE_DIR}" -maxdepth 1 -type d -name "${DOMAIN}*" | head -1)

if [ -z "$CERT_DIR" ]; then
    echo "❌ Certificado não encontrado!"
    echo "Diretórios disponíveis:"
    ls -la "${LETSENCRYPT_LIVE_DIR}" | grep "${DOMAIN}"
    exit 1
fi

echo "✅ Certificado encontrado em: $CERT_DIR"

# Criar diretório se não existir
mkdir -p "${AAPANEL_CERT_DIR}"

# Copiar certificados
echo "📋 Copiando certificados..."
cp "${CERT_DIR}/fullchain.pem" "${AAPANEL_CERT_DIR}/" && echo "✅ fullchain.pem copiado" || echo "❌ Erro ao copiar fullchain.pem"
cp "${CERT_DIR}/privkey.pem" "${AAPANEL_CERT_DIR}/" && echo "✅ privkey.pem copiado" || echo "❌ Erro ao copiar privkey.pem"

# Ajustar permissões
echo "🔐 Ajustando permissões..."
chown -R www:www "${AAPANEL_CERT_DIR}"
chmod 644 "${AAPANEL_CERT_DIR}/fullchain.pem"
chmod 600 "${AAPANEL_CERT_DIR}/privkey.pem"

echo "✅ Certificados copiados com sucesso!"
echo "📁 Localização: ${AAPANEL_CERT_DIR}"
ls -la "${AAPANEL_CERT_DIR}"

