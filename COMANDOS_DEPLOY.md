# 🚀 Comandos para Deploy - financeiro.donsantosba.com.br

## 📋 Comandos para Executar no Terminal SSH

### 1. Conectar ao Servidor via SSH
```bash
ssh usuario@seu-servidor.com
```

### 2. Navegar para o Diretório do Projeto
```bash
cd /www/wwwroot/financeiro.donsantosba.com.br
```

### 3. Clonar o Repositório (se ainda não tiver)
```bash
git clone https://github.com/elislecio1/controle-financeiro.git .
```

### 4. Criar Arquivo .env
```bash
cat > .env << 'EOF'
VITE_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
NEXT_PUBLIC_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_SV3lBKi83O1jhjIYPW_bjQ_m5vK9lBD
EOF
```

### 5. Instalar Dependências
```bash
npm install
```

### 6. Fazer Build do Projeto
```bash
npm run build
```

### 7. Ajustar Permissões
```bash
chown -R www:www /www/wwwroot/financeiro.donsantosba.com.br
chmod -R 755 /www/wwwroot/financeiro.donsantosba.com.br
```

### 8. Verificar Build
```bash
ls -la dist/
```

---

## 🚀 Script Automático (Recomendado)

Execute todos os comandos de uma vez:

```bash
cd /www/wwwroot/financeiro.donsantosba.com.br
chmod +x deploy-financeiro.sh
./deploy-financeiro.sh
```

---

## 📝 Configuração no aapanel

### 1. Criar Site (se ainda não criou)
- **Website** → **Add Site**
- **Domain**: `financeiro.donsantosba.com.br`
- **Root**: `/www/wwwroot/financeiro.donsantosba.com.br`
- **Submit**

### 2. Configurar Nginx (SEM SSL primeiro)
- **Website** → `financeiro.donsantosba.com.br` → **Settings** → **Config File**
- Copie o conteúdo do arquivo `nginx-financeiro-SEM-SSL.conf`
- **Save** → **Test Config** → **Reload**
- ✅ Site deve funcionar em HTTP

### 3. Configurar SSL
- **Website** → `financeiro.donsantosba.com.br` → **Settings** → **SSL**
- **Let's Encrypt** → **Apply**
- Marque **Force HTTPS** (opcional)
- Aguarde o certificado ser gerado

### 4. Atualizar Nginx (COM SSL)
- **Website** → `financeiro.donsantosba.com.br` → **Settings** → **Config File**
- Copie o conteúdo do arquivo `nginx-financeiro.conf`
- **Save** → **Test Config** → **Reload**
- ✅ Site deve funcionar em HTTPS

---

## 🔄 Atualizar o Sistema (Futuro)

```bash
cd /www/wwwroot/financeiro.donsantosba.com.br
git pull origin main
npm install
npm run build
chown -R www:www /www/wwwroot/financeiro.donsantosba.com.br
```

---

## ✅ Verificar se Está Funcionando

```bash
# Verificar se a pasta dist existe
ls -la dist/

# Verificar permissões
ls -la

# Verificar logs do Nginx
tail -f /www/wwwlogs/financeiro.donsantosba.com.br.error.log
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
chown -R www:www /www/wwwroot/financeiro.donsantosba.com.br
chmod -R 755 /www/wwwroot/financeiro.donsantosba.com.br
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
tail -f /www/wwwlogs/financeiro.donsantosba.com.br.error.log

# Logs do aapanel
tail -f /www/server/panel/logs/error.log
```

---

**✅ Após executar os comandos, acesse: https://financeiro.donsantosba.com.br**

