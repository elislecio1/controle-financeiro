# ⚡ Deploy Rápido no aapanel

## 📋 Checklist Rápido

### 1. No aapanel - Criar Site
- **Website** → **Add Site**
- **Domain**: `controle-financeiro.seudominio.com`
- **Root**: `/www/wwwroot/controle-financeiro`

### 2. Upload dos Arquivos
- Faça upload de todos os arquivos do projeto para `/www/wwwroot/controle-financeiro`
- Ou clone via SSH: `git clone https://github.com/elislecio1/controle-financeiro.git /www/wwwroot/controle-financeiro`

### 3. Configurar .env
```bash
cd /www/wwwroot/controle-financeiro
nano .env
```

Cole as variáveis:
```env
VITE_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
NEXT_PUBLIC_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
```

### 4. Build do Projeto
```bash
npm install
npm run build
```

### 5. Configurar Nginx
- **Website** → Selecione seu site → **Settings** → **Config File**
- Copie o conteúdo do arquivo `nginx.conf` (ajuste o domínio)
- **Save** → **Test Config** → **Reload**

### 6. Configurar SSL
- **Website** → Selecione seu site → **Settings** → **SSL**
- **Let's Encrypt** → **Apply**
- Marque **Force HTTPS**

### 7. Ajustar Permissões
```bash
chown -R www:www /www/wwwroot/controle-financeiro
chmod -R 755 /www/wwwroot/controle-financeiro
```

## 🚀 Script Automático

Ou use o script de deploy:

```bash
cd /www/wwwroot/controle-financeiro
chmod +x deploy-aapanel.sh
./deploy-aapanel.sh
```

## ✅ Pronto!

Acesse: `https://controle-financeiro.seudominio.com`

---

📖 **Guia completo**: Veja `GUIA_DEPLOY_AAPANEL.md` para mais detalhes.

