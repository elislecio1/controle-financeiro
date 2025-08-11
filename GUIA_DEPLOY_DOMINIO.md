# 🚀 Guia Completo para Deploy em Domínio

## 📋 Pré-requisitos

Antes de começar, você precisa ter:
- Um domínio registrado
- Acesso ao painel de controle do seu provedor de hospedagem
- Node.js instalado (versão 16 ou superior)
- Git configurado

## 🛠️ Preparação do Projeto

### 1. Configuração de Ambiente

Primeiro, crie um arquivo `.env` na raiz do projeto:

```bash
# Copie o arquivo env.example
cp env.example .env
```

Edite o arquivo `.env` com suas configurações do Supabase:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 2. Otimização para Produção

Atualize o `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          icons: ['lucide-react']
        }
      }
    }
  },
  preview: {
    port: 4173,
    open: true
  }
})
```

## 🏗️ Opções de Deploy

### Opção 1: Vercel (Recomendado)

#### Passo a Passo:

1. **Instale o Vercel CLI:**
```bash
npm install -g vercel
```

2. **Faça login no Vercel:**
```bash
vercel login
```

3. **Deploy do projeto:**
```bash
# Na raiz do projeto
vercel
```

4. **Configure as variáveis de ambiente:**
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

5. **Deploy em produção:**
```bash
vercel --prod
```

### Opção 2: Netlify

#### Passo a Passo:

1. **Crie um arquivo `netlify.toml` na raiz:**
```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. **Deploy via Git:**
- Conecte seu repositório no Netlify
- Configure as variáveis de ambiente no painel
- Deploy automático a cada push

### Opção 3: GitHub Pages

#### Passo a Passo:

1. **Instale o gh-pages:**
```bash
npm install --save-dev gh-pages
```

2. **Adicione scripts no `package.json`:**
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

3. **Deploy:**
```bash
npm run deploy
```

### Opção 4: Hospedagem Tradicional (cPanel, etc.)

#### Passo a Passo:

1. **Build do projeto:**
```bash
npm run build
```

2. **Faça upload da pasta `dist` para o servidor**

3. **Configure o servidor web:**
- Apache: Crie um `.htaccess`:
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

- Nginx: Configure o servidor:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## 🔧 Configurações Específicas por Provedor

### Vercel
- **Domínio customizado:** Configurado no painel do Vercel
- **SSL:** Automático
- **CDN:** Automático

### Netlify
- **Domínio customizado:** Settings > Domain management
- **SSL:** Automático
- **Formulários:** Suporte nativo

### GitHub Pages
- **Domínio customizado:** Settings > Pages
- **SSL:** Automático
- **Limitações:** Apenas arquivos estáticos

## 🔒 Configurações de Segurança

### 1. Headers de Segurança

Crie um arquivo `_headers` (Netlify) ou configure no servidor:

```
/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';
```

### 2. Configuração do Supabase

Certifique-se de configurar as políticas RLS (Row Level Security) no Supabase:

```sql
-- Exemplo de política para tabela de transações
CREATE POLICY "Users can view own transactions" ON transactions
FOR SELECT USING (auth.uid() = user_id);
```

## 📊 Monitoramento e Analytics

### 1. Google Analytics

Adicione no `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 2. Vercel Analytics

```bash
npm install @vercel/analytics
```

```typescript
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      {/* Seu app */}
      <Analytics />
    </>
  );
}
```

## 🚀 Comandos de Deploy

### Build e Teste Local:
```bash
# Instalar dependências
npm install

# Build para produção
npm run build

# Testar build localmente
npm run preview
```

### Deploy Automático:
```bash
# Vercel
vercel --prod

# Netlify (se configurado com CLI)
netlify deploy --prod

# GitHub Pages
npm run deploy
```

## 🔧 Troubleshooting

### Problemas Comuns:

1. **Erro 404 em rotas:**
   - Configure redirects para SPA
   - Verifique se o servidor está servindo `index.html`

2. **Variáveis de ambiente não carregadas:**
   - Verifique se estão configuradas no provedor
   - Reinicie o deploy após adicionar variáveis

3. **Erro de CORS:**
   - Configure as origens permitidas no Supabase
   - Verifique as configurações de segurança

4. **Performance lenta:**
   - Ative compressão no servidor
   - Configure cache adequado
   - Use CDN quando possível

## 📱 Configuração de PWA (Opcional)

Para transformar em PWA, adicione:

1. **Manifest.json:**
```json
{
  "name": "Controle Financeiro",
  "short_name": "Financeiro",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000"
}
```

2. **Service Worker:**
```javascript
// sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/static/js/bundle.js',
        '/static/css/main.css'
      ]);
    })
  );
});
```

## 🎯 Checklist Final

- [ ] Variáveis de ambiente configuradas
- [ ] Build testado localmente
- [ ] Deploy realizado
- [ ] Domínio configurado
- [ ] SSL ativo
- [ ] Analytics configurado
- [ ] Monitoramento ativo
- [ ] Backup configurado

## 📞 Suporte

Para problemas específicos:
- **Vercel:** https://vercel.com/docs
- **Netlify:** https://docs.netlify.com
- **Supabase:** https://supabase.com/docs

---

**🎉 Parabéns! Seu controle financeiro está online!** 