# 🔧 Resolver Erro de Build - tsc: command not found

## ❌ Problema

```
sh: line 1: tsc: command not found
```

**Causa**: As dependências do projeto não foram instaladas ou o TypeScript não está disponível.

---

## ✅ Solução

### Passo 1: Instalar Dependências

```bash
cd /www/wwwroot/cf.don.cim.br
npm install
```

Isso instalará todas as dependências, incluindo o TypeScript.

### Passo 2: Verificar Instalação

```bash
# Verificar se TypeScript foi instalado
npx tsc --version

# Ou verificar node_modules
ls -la node_modules/.bin/ | grep tsc
```

### Passo 3: Fazer Build Novamente

```bash
npm run build
```

---

## 🐛 Se Ainda Der Erro

### Erro: npm não encontrado

```bash
# Verificar se Node.js está instalado
node -v
npm -v

# Se não estiver, instalar pelo aapanel:
# App Store → Node.js Version Manager → Install
```

### Erro: Permissão negada

```bash
# Ajustar permissões
chown -R www:www /www/wwwroot/cf.don.cim.br
chmod -R 755 /www/wwwroot/cf.don.cim.br
```

### Erro: node_modules não encontrado

```bash
# Limpar e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Build funciona mas dist está vazio

```bash
# Verificar se o build foi criado
ls -la dist/

# Se estiver vazio, verificar erros no build
npm run build 2>&1 | tee build.log
```

---

## 📝 Comandos Completos (Copiar e Colar)

```bash
cd /www/wwwroot/cf.don.cim.br
npm install
npm run build
ls -la dist/
```

---

## ✅ Verificar se Build Foi Criado

Após o build, você deve ver:

```bash
ls -la dist/
# Deve mostrar:
# - index.html
# - assets/ (pasta com JS, CSS, etc.)
```

---

**Execute `npm install` primeiro e depois `npm run build`!**

