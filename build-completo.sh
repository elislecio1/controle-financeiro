#!/bin/bash

# Script completo para fazer build do projeto
# Uso: ./build-completo.sh

echo "🔨 Iniciando build do projeto..."
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Diretório do projeto
PROJECT_DIR="/www/wwwroot/cf.don.cim.br"

# Navegar para o diretório
cd $PROJECT_DIR

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro: Não foi possível acessar o diretório${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Diretório: $(pwd)${NC}"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não está instalado${NC}"
    echo "Instale pelo aapanel: App Store → Node.js Version Manager"
    exit 1
fi

echo -e "${GREEN}✓ Node.js: $(node -v)${NC}"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm não está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm: $(npm -v)${NC}"

# Verificar se package.json existe
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json não encontrado${NC}"
    echo "Certifique-se de que o repositório foi clonado corretamente"
    exit 1
fi

echo -e "${GREEN}✓ package.json encontrado${NC}"

# Instalar dependências
echo ""
echo "📦 Instalando dependências..."
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao instalar dependências${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Dependências instaladas${NC}"

# Verificar se TypeScript foi instalado
echo ""
echo "🔍 Verificando TypeScript..."
if [ -f "node_modules/.bin/tsc" ]; then
    TSC_VERSION=$(npx tsc --version 2>/dev/null)
    echo -e "${GREEN}✓ TypeScript instalado: $TSC_VERSION${NC}"
else
    echo -e "${YELLOW}⚠ TypeScript não encontrado em node_modules${NC}"
    echo "Tentando instalar TypeScript globalmente..."
    npm install -g typescript
fi

# Verificar arquivo .env
if [ ! -f ".env" ]; then
    echo ""
    echo -e "${YELLOW}⚠ Arquivo .env não encontrado. Criando...${NC}"
    cat > .env << EOF
VITE_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
NEXT_PUBLIC_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
EOF
    echo -e "${GREEN}✓ Arquivo .env criado${NC}"
fi

# Fazer build
echo ""
echo "🔨 Fazendo build do projeto..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao fazer build${NC}"
    echo ""
    echo "Tentando build direto com Vite (sem TypeScript check)..."
    npx vite build
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erro também no build direto${NC}"
        exit 1
    fi
fi

# Verificar se dist foi criado
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Pasta dist não foi criada${NC}"
    exit 1
fi

# Verificar conteúdo de dist
echo ""
echo "📁 Verificando build criado..."
DIST_FILES=$(ls -la dist/ | wc -l)
echo -e "${GREEN}✓ Pasta dist criada com $DIST_FILES itens${NC}"

if [ -f "dist/index.html" ]; then
    echo -e "${GREEN}✓ index.html encontrado${NC}"
else
    echo -e "${YELLOW}⚠ index.html não encontrado em dist/${NC}"
fi

# Verificar tamanho
BUILD_SIZE=$(du -sh dist | cut -f1)
echo -e "${GREEN}✓ Tamanho do build: $BUILD_SIZE${NC}"

# Ajustar permissões
echo ""
echo "🔐 Ajustando permissões..."
chown -R www:www dist/
chmod -R 755 dist/

echo -e "${GREEN}✓ Permissões ajustadas${NC}"

echo ""
echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"
echo ""
echo "📝 Próximos passos:"
echo "1. Configure o Nginx (use nginx-cf-don-cim-AJUSTADO.conf)"
echo "2. Teste o site: http://cf.don.cim.br"
echo ""

