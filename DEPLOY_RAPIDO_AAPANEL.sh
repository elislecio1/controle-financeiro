#!/bin/bash
# 🚀 Script Rápido de Deploy para aapanel
# Execute este script no terminal SSH do servidor

PROJECT_DIR="/www/wwwroot/sites/elislecio/cf.don.cim.br"

echo "🚀 Iniciando deploy..."
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
ls -la dist/
ls -la dist/assets/ 2>/dev/null || echo "⚠️  Pasta assets não encontrada!"

echo "🔐 Ajustando permissões..."
sudo chown -R www:www "$PROJECT_DIR"
sudo chmod -R 755 dist/

echo "✅ Deploy concluído!"
echo ""
echo "⚠️  IMPORTANTE: Recarregue o Nginx pelo painel do aapanel"
echo "   Site → cf.don.cim.br → Nginx → Botão 'Reload'"
echo ""
echo "📊 Verifique os arquivos:"
echo "   ls -la $PROJECT_DIR/dist/assets/"

