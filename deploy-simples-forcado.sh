#!/bin/bash

# Script de Deploy Simples - Controle Financeiro (FORÇADO)
# Descarta mudanças locais e atualiza do repositório remoto
# Use este script quando quiser garantir que o código local seja igual ao remoto

# Diretório do projeto
PROJECT_DIR="/www/wwwroot/sites/elislecio/cf.don.cim.br"

echo "🚀 Iniciando deploy (modo forçado)..."

# Navegar para o diretório do projeto
echo "📂 Navegando para o diretório do projeto..."
cd "$PROJECT_DIR" || exit 1

if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado em $PROJECT_DIR"
    exit 1
fi

echo "✓ Diretório: $(pwd)"

# Descartar mudanças locais e atualizar do remoto
echo "🔄 Descartando mudanças locais e atualizando do repositório remoto..."
git fetch origin main || exit 1
git reset --hard origin/main || exit 1
echo "✓ Repositório atualizado"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install || exit 1

# Build do projeto
echo "🔨 Fazendo build do projeto..."
npm run build || exit 1

echo "✅ Deploy concluído com sucesso!"
echo "📁 Arquivos prontos em ./dist"
