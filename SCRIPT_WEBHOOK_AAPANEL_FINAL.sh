#!/bin/bash

###############################################################################
# 🚀 Script de Deploy Completo para aapanel Webhook
# 
# Diretório: /www/wwwroot/sites/elislecio/cf.don.cim.br
# 
# Use no aapanel: Git Manager → Script → Create/Select
###############################################################################

# Diretório do projeto
PROJECT_DIR="/www/wwwroot/sites/elislecio/cf.don.cim.br"
BRANCH="main"

# Mudar para o diretório
cd "$PROJECT_DIR" || exit 1

# 1. Atualizar Git
git fetch origin
git stash 2>/dev/null
git pull origin "$BRANCH"

# 2. Criar .env se não existir
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
VITE_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
NEXT_PUBLIC_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
EOF
fi

# 3. Instalar dependências
npm install

# 4. Build
npm run build

# 5. Permissões
chown -R www:www "$PROJECT_DIR"
chmod -R 755 "$PROJECT_DIR"
chmod -R 755 dist/

# 6. Recarregar Nginx
nginx -t && systemctl reload nginx

echo "✅ Deploy concluído!"

