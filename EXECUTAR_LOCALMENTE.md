# 🚀 Como Executar o Projeto Localmente

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** 16+ ([Download](https://nodejs.org/))
- **npm** 8+ (vem com Node.js)
- **Git** ([Download](https://git-scm.com/))

### Verificar Instalações

```bash
node --version   # Deve mostrar v16 ou superior
npm --version    # Deve mostrar v8 ou superior
git --version    # Qualquer versão recente
```

---

## 🛠️ Configuração Inicial

### 1. Clonar o Repositório (se ainda não tiver)

```bash
git clone https://github.com/seu-usuario/controle-financeiro.git
cd controle-financeiro
```

### 2. Instalar Dependências

```bash
npm install
```

Isso instalará todas as dependências listadas no `package.json`.

**Tempo estimado**: 2-5 minutos (dependendo da conexão)

---

## ⚙️ Configurar Variáveis de Ambiente

### Criar arquivo `.env`

Crie um arquivo `.env` na raiz do projeto com as credenciais do Supabase:

```bash
# Windows (PowerShell)
New-Item -Path .env -ItemType File

# Linux/Mac
touch .env
```

### Conteúdo do arquivo `.env`

```env
# Credenciais do Supabase
VITE_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui

# Opcional: Para compatibilidade com Next.js
NEXT_PUBLIC_SUPABASE_URL=https://eshaahpcddqkeevxpgfk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sua-chave-anon-aqui
```

**⚠️ IMPORTANTE**: 
- Substitua `sua-chave-anon-aqui` pela sua chave real do Supabase
- Você pode encontrar essas credenciais em: [Supabase Dashboard](https://app.supabase.com) → Seu Projeto → Settings → API

---

## 🚀 Executar o Projeto

### Método 1: Comando npm (Recomendado)

```bash
npm run dev
```

O servidor de desenvolvimento será iniciado e o navegador abrirá automaticamente em:
- **URL**: `http://localhost:3000`

### Método 2: Comando direto do Vite

```bash
npx vite
```

### Método 3: Com porta customizada

Se a porta 3000 estiver ocupada, você pode especificar outra porta:

```bash
# Linux/Mac
PORT=3001 npm run dev

# Windows (PowerShell)
$env:PORT=3001; npm run dev
```

Ou edite o arquivo `vite.config.ts` e altere a porta:

```typescript
server: {
  port: 3001,  // Altere para a porta desejada
  open: true,
  host: true
}
```

---

## ✅ Verificar se Está Funcionando

Após executar `npm run dev`, você deve ver:

```
  VITE v4.2.0  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### Acessar no Navegador

1. Abra seu navegador
2. Acesse: `http://localhost:3000`
3. Você deve ver a tela de login do sistema

---

## 🔧 Comandos Disponíveis

### Desenvolvimento

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Cria build de produção
npm run preview      # Preview do build de produção
npm run lint         # Verifica erros de código
```

### Build para Produção

```bash
npm run build
```

O build será criado na pasta `dist/`

---

## 🐛 Troubleshooting

### Erro: "Cannot find module"

**Solução**: Reinstale as dependências
```bash
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Port 3000 is already in use"

**Solução**: Use outra porta ou pare o processo na porta 3000

**Windows**:
```powershell
# Encontrar processo na porta 3000
netstat -ano | findstr :3000

# Matar processo (substitua PID pelo número encontrado)
taskkill /PID <PID> /F
```

**Linux/Mac**:
```bash
# Encontrar processo
lsof -ti:3000

# Matar processo
kill -9 $(lsof -ti:3000)
```

### Erro: "Supabase não configurado"

**Solução**: Verifique se o arquivo `.env` existe e tem as credenciais corretas

```bash
# Verificar se .env existe
ls -la .env

# Verificar conteúdo (não mostre em público!)
cat .env
```

### Erro: "TypeScript errors"

**Solução**: Verifique se TypeScript está instalado

```bash
npm install -D typescript
npm run build
```

### Erro: "Module not found: Can't resolve"

**Solução**: Limpe o cache e reinstale

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Erro: "EADDRINUSE: address already in use"

**Solução**: Porta já está em uso, use outra porta ou pare o processo

---

## 📱 Acessar de Outros Dispositivos na Rede Local

Por padrão, o Vite já está configurado com `host: true`, então você pode acessar de outros dispositivos na mesma rede:

1. Descubra o IP da sua máquina:
   - **Windows**: `ipconfig` (procure por IPv4)
   - **Linux/Mac**: `ifconfig` ou `ip addr`

2. Acesse de outro dispositivo:
   ```
   http://SEU-IP:3000
   ```
   Exemplo: `http://192.168.1.100:3000`

---

## 🔄 Hot Reload (Recarregamento Automático)

O Vite tem hot reload habilitado por padrão. Isso significa que:
- ✅ Mudanças no código são refletidas automaticamente no navegador
- ✅ Não precisa recarregar a página manualmente
- ✅ Estado da aplicação é preservado quando possível

---

## 📂 Estrutura do Projeto

```
controle-financeiro/
├── src/                    # Código fonte
│   ├── components/        # Componentes React
│   ├── services/          # Serviços (API, Supabase)
│   ├── hooks/             # Hooks customizados
│   ├── types/             # Definições TypeScript
│   ├── utils/             # Utilitários
│   └── App.tsx            # Componente principal
├── public/                # Arquivos estáticos
├── dist/                  # Build de produção (gerado)
├── node_modules/          # Dependências (gerado)
├── .env                   # Variáveis de ambiente (criar)
├── package.json           # Dependências e scripts
├── vite.config.ts         # Configuração do Vite
└── tsconfig.json          # Configuração TypeScript
```

---

## 🎯 Próximos Passos

Após executar o projeto localmente:

1. **Fazer login**: Use suas credenciais do Supabase
2. **Explorar funcionalidades**: Navegue pelos módulos
3. **Desenvolver**: Faça suas alterações e veja em tempo real
4. **Testar**: Teste novas funcionalidades antes de fazer deploy

---

## 💡 Dicas

### Desenvolvimento

- Use `Ctrl + C` no terminal para parar o servidor
- O Vite mostra erros no terminal e no navegador
- Use as DevTools do navegador (F12) para debug

### Performance

- O primeiro build pode ser mais lento
- Mudanças subsequentes são muito rápidas (hot reload)
- Use `npm run build` para testar o build de produção

### Debug

- Erros aparecem no terminal e no navegador
- Use `console.log()` para debug (será removido em produção)
- Use React DevTools para inspecionar componentes

---

## ✅ Checklist de Execução

Antes de começar a desenvolver:

- [ ] Node.js instalado (v16+)
- [ ] npm instalado (v8+)
- [ ] Repositório clonado
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` criado com credenciais do Supabase
- [ ] Servidor rodando (`npm run dev`)
- [ ] Site acessível em `http://localhost:3000`
- [ ] Login funcionando

---

## 🆘 Precisa de Ajuda?

### Problemas Comuns

1. **Erro de conexão com Supabase**
   - Verifique as credenciais no `.env`
   - Verifique se o projeto Supabase está ativo

2. **Erro de build**
   - Limpe o cache: `npm cache clean --force`
   - Reinstale: `rm -rf node_modules && npm install`

3. **Erro de TypeScript**
   - Verifique se TypeScript está instalado
   - Execute: `npm install -D typescript`

### Documentação

- **Vite**: https://vitejs.dev/
- **React**: https://react.dev/
- **Supabase**: https://supabase.com/docs

---

**🎉 Pronto! Seu projeto está rodando localmente!**

Agora você pode desenvolver e testar suas alterações antes de fazer deploy em produção.

