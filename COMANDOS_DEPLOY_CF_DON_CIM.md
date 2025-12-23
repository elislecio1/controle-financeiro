# 🚀 Comandos para Deploy - cf.don.cim.br

## 📋 Comandos para Executar no Terminal SSH

### 1. Navegar para o Diretório do Projeto
```bash
cd /www/wwwroot/cf.don.cim.br
```

### 2. Verificar se o Repositório Está Clonado
```bash
ls -la
# Deve mostrar package.json, src/, etc.
```

### 3. Criar Arquivo .env
```bash
cat > .env << 'EOF'
VITE_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
NEXT_PUBLIC_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
EOF
```

### 4. Instalar Dependências
```bash
npm install
```

### 5. Fazer Build do Projeto
```bash
npm run build
```

### 6. Ajustar Permissões
```bash
chown -R www:www /www/wwwroot/cf.don.cim.br
chmod -R 755 /www/wwwroot/cf.don.cim.br
```

### 7. Verificar Build
```bash
ls -la dist/
```

---

## 🚀 Script Automático (Recomendado)

Execute todos os comandos de uma vez:

```bash
cd /www/wwwroot/cf.don.cim.br
chmod +x deploy-cf-don-cim.sh
./deploy-cf-don-cim.sh
```

---

## 📝 Configuração no aapanel

### 1. Criar Site (se ainda não criou)
- **Website** → **Add Site**
- **Domain**: `cf.don.cim.br`
- **Root**: `/www/wwwroot/cf.don.cim.br`
- **Submit**

### 2. Configurar Nginx (SEM SSL primeiro)
- **Website** → `cf.don.cim.br` → **Settings** → **Config File**
- Copie o conteúdo do arquivo `nginx-cf-don-cim-SEM-SSL.conf`
- **Save** → **Test Config** → **Reload**
- ✅ Site deve funcionar em HTTP

### 3. Configurar SSL
- **Website** → `cf.don.cim.br` → **Settings** → **SSL**
- **Let's Encrypt** → **Apply**
- Marque **Force HTTPS** (opcional)
- Aguarde o certificado ser gerado

### 4. Atualizar Nginx (COM SSL)
- **Website** → `cf.don.cim.br` → **Settings** → **Config File**
- Copie o conteúdo do arquivo `nginx-cf-don-cim.conf`
- **Save** → **Test Config** → **Reload**
- ✅ Site deve funcionar em HTTPS

---

## 🔒 Obter Certificado SSL via Terminal

### Verificar DNS primeiro
```bash
dig +short cf.don.cim.br A
# Deve retornar o IP do servidor
```

### Obter certificado SSL
```bash
sudo certbot certonly --webroot -w /www/wwwroot/cf.don.cim.br -d cf.don.cim.br
```

### Verificar certificado
```bash
sudo certbot certificates
ls -la /etc/letsencrypt/live/cf.don.cim.br/
```

---

## 🔄 Atualizar o Sistema (Futuro)

```bash
cd /www/wwwroot/cf.don.cim.br
git pull origin main
npm install
npm run build
chown -R www:www /www/wwwroot/cf.don.cim.br
```

---

## ✅ Verificar se Está Funcionando

```bash
# Verificar se a pasta dist existe
ls -la dist/

# Verificar permissões
ls -la

# Verificar logs do Nginx
tail -f /www/wwwlogs/cf.don.cim.br.error.log
```

---

## 🐛 Troubleshooting

### Erro: Node.js não encontrado
```bash
# Instalar Node.js pelo aapanel
# App Store → Node.js Version Manager → Install
```

### Erro: Permissão negada
```bash
chown -R www:www /www/wwwroot/cf.don.cim.br
chmod -R 755 /www/wwwroot/cf.don.cim.br
```

### Erro: Build falhou
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Verificar logs
```bash
# Logs do Nginx
tail -f /www/wwwlogs/cf.don.cim.br.error.log

# Logs do aapanel
tail -f /www/server/panel/logs/error.log
```

---

**✅ Após executar os comandos, acesse: https://cf.don.cim.br**

