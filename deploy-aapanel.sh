#!/bin/bash

# Script de Deploy Automático para aapanel
# Uso: ./deploy-aapanel.sh

echo "🚀 Iniciando deploy do Sistema de Controle Financeiro..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Diretório do projeto
PROJECT_DIR="/www/wwwroot/controle-financeiro"

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: package.json não encontrado. Execute este script no diretório do projeto.${NC}"
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Erro: Node.js não está instalado.${NC}"
    echo "Instale o Node.js pelo aapanel: App Store → Node.js Version Manager"
    exit 1
fi

echo -e "${GREEN}✓ Node.js encontrado: $(node -v)${NC}"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Erro: npm não está instalado.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm encontrado: $(npm -v)${NC}"

# Verificar arquivo .env
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ Aviso: Arquivo .env não encontrado.${NC}"
    echo "Criando arquivo .env a partir do env.example..."
    if [ -f "env.example" ]; then
        cp env.example .env
        echo -e "${YELLOW}⚠ Por favor, edite o arquivo .env com suas credenciais do Supabase.${NC}"
    else
        echo -e "${RED}❌ Erro: env.example não encontrado.${NC}"
        exit 1
    fi
fi

# Instalar dependências
echo ""
echo "📦 Instalando dependências..."
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao instalar dependências.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Dependências instaladas com sucesso.${NC}"

# Fazer build
echo ""
echo "🔨 Fazendo build do projeto..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao fazer build.${NC}"
    exit 1
fi

# Verificar se a pasta dist foi criada
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Erro: Pasta dist não foi criada.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build concluído com sucesso.${NC}"

# Ajustar permissões
echo ""
echo "🔐 Ajustando permissões..."
chown -R www:www dist/
chmod -R 755 dist/

echo -e "${GREEN}✓ Permissões ajustadas.${NC}"

# Verificar tamanho do build
BUILD_SIZE=$(du -sh dist | cut -f1)
echo ""
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo -e "📊 Tamanho do build: ${BUILD_SIZE}"
echo ""
echo "📝 Próximos passos:"
echo "1. Configure o Nginx no aapanel (Website → Settings → Config File)"
echo "2. Use o arquivo nginx.conf como referência"
echo "3. Configure o SSL (Website → Settings → SSL)"
echo "4. Acesse seu site e teste!"
echo ""
echo -e "${GREEN}🎉 Pronto para produção!${NC}"

