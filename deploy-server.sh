#!/bin/bash

# Script de deploy para servidor - resolve conflitos com dist/
# Uso: ./deploy-server.sh

set -e  # Para em caso de erro

echo "🚀 Iniciando deploy..."

# Navegar para o diretório do projeto
cd /www/wwwroot/cf.don.cim.br

echo "📦 Descartando mudanças locais em dist/ (arquivos de build)"
# Descartar mudanças locais em dist/ se houver
git checkout -- dist/ 2>/dev/null || true
git clean -fd dist/ 2>/dev/null || true

echo "🔄 Fazendo pull das mudanças remotas..."
git pull origin main

echo "📥 Instalando dependências..."
npm install

echo "🔨 Fazendo build da aplicação..."
npm run build

echo "🔐 Ajustando permissões..."
chown -R www:www dist
chmod -R 755 dist

echo "🔄 Recarregando servidor web..."
systemctl reload webserver

echo "✅ Deploy concluído com sucesso!"

