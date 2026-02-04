#!/bin/bash
# 🚀 Script de Deploy Completo para aapanel (Corrigido)
# Execute: bash DEPLOY_FINAL_AAPANEL.sh

PROJECT_DIR="/www/wwwroot/sites/elislecio/cf.don.cim.br"

echo "🔧 Configurando Git..."
git config --global --add safe.directory "$PROJECT_DIR"

echo "📂 Navegando para o diretório..."
cd "$PROJECT_DIR" || exit 1

echo "📥 Atualizando repositório..."
git pull origin main

echo "📦 Instalando dependências..."
npm install

echo "🔨 Fazendo build..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Erro: Pasta dist não foi criada!"
    exit 1
fi

echo "📁 Verificando arquivos do build..."
if [ -d "dist/assets" ]; then
    echo "✅ Pasta assets encontrada!"
    ls -la dist/assets/ | head -10
else
    echo "⚠️  Pasta assets não encontrada! Verificando dist..."
    ls -la dist/
fi

echo "🔐 Ajustando permissões..."
sudo chown -R www:www "$PROJECT_DIR"
sudo chmod -R 755 dist/

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "⚠️  IMPORTANTE: Recarregue o Nginx pelo painel do aapanel:"
echo "   Site → cf.don.cim.br → Nginx → Botão 'Reload'"
echo ""

