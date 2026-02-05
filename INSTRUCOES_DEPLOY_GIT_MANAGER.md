# 📋 INSTRUÇÕES - DEPLOY NO GIT MANAGER

## 🎯 Scripts Disponíveis

### 1. Script Completo (Recomendado)
**Arquivo:** `deploy-git-manager.sh`

**Características:**
- ✅ Tratamento de conflitos Git
- ✅ Verificação de mudanças locais
- ✅ Logs detalhados com cores
- ✅ Validações de segurança
- ✅ Limpeza de cache
- ✅ Verificação de build

### 2. Script Simples (Alternativa)
**Arquivo:** `deploy-git-manager-simples.sh`

**Características:**
- ✅ Versão minimalista
- ✅ Apenas atualiza e faz build
- ✅ Útil se o script completo der problemas

---

## 📝 Como Configurar no Git Manager

### Passo 1: Acessar Git Manager
1. No painel de controle, vá em **Git Manager**
2. Selecione o site **cf.don.cim.br**
3. Clique na aba **Script**

### Passo 2: Adicionar Novo Script

1. Clique no botão **"Adicionar"** (verde)

2. Preencha os campos:
   - **Alias:** `deploy-completo` (ou nome de sua preferência)
   - **Script:** Cole o conteúdo do arquivo `deploy-git-manager.sh`

3. Clique em **Salvar**

### Passo 3: Configurar Deploy Automático (Opcional)

Se quiser que o script execute automaticamente em cada push:

1. Vá na aba **Repositório**
2. Configure o **Webhook** (se ainda não estiver configurado)
3. O Git Manager executará o script automaticamente

---

## 🔧 Configuração do Script

### Diretório do Projeto
O script está configurado para:
```bash
PROJECT_DIR="/www/wwwroot/sites/elislecio/cf.don.cim.br"
```

**Se seu diretório for diferente**, edite a linha no script:
```bash
PROJECT_DIR="/caminho/para/seu/projeto"
```

### Comandos Executados

O script executa na seguinte ordem:

1. ✅ Navega para o diretório do projeto
2. ✅ Verifica se é repositório Git válido
3. ✅ Trata mudanças locais (stash ou reset)
4. ✅ Atualiza do repositório remoto (`git pull`)
5. ✅ Instala dependências (`npm install`)
6. ✅ Faz build do projeto (`npm run build`)
7. ✅ Limpa cache do npm
8. ✅ Verifica se build foi gerado

---

## 🚀 Como Usar

### Deploy Manual

1. No Git Manager, aba **Script**
2. Encontre o script criado
3. Clique em **"Implantar"** (verde)
4. Aguarde a execução
5. Verifique os logs

### Deploy Automático

O script será executado automaticamente quando:
- ✅ Há push para a branch `main`
- ✅ Webhook é acionado
- ✅ Deploy manual é solicitado

---

## ⚠️ Solução de Problemas

### Erro: "Não foi possível navegar para o diretório"
- **Solução:** Verifique se o caminho `PROJECT_DIR` está correto
- Edite o script e ajuste o caminho

### Erro: "package.json não encontrado"
- **Solução:** Verifique se está no diretório correto do projeto
- O script deve estar na raiz do projeto (onde fica package.json)

### Erro: "Erro ao atualizar repositório"
- **Solução:** Verifique permissões do Git
- Execute manualmente: `git pull origin main` no servidor

### Erro: "Erro ao instalar dependências"
- **Solução:** Verifique se o Node.js/npm está instalado
- Execute: `node --version` e `npm --version`

### Erro: "Erro ao fazer build"
- **Solução:** Verifique os logs de build
- Execute manualmente: `npm run build` para ver erros detalhados

---

## 📊 Logs e Monitoramento

O script completo gera logs coloridos:
- 🔵 **Azul:** Informações gerais
- 🟢 **Verde:** Sucesso
- 🟡 **Amarelo:** Avisos
- 🔴 **Vermelho:** Erros

Os logs aparecem no Git Manager após a execução.

---

## 🔄 Atualizar Script

Para atualizar o script:

1. Edite o arquivo `deploy-git-manager.sh` localmente
2. Faça commit e push
3. No Git Manager, edite o script (botão **"Editar"**)
4. Cole o novo conteúdo
5. Salve

---

## ✅ Checklist de Configuração

- [ ] Script adicionado no Git Manager
- [ ] Caminho `PROJECT_DIR` está correto
- [ ] Testado deploy manual
- [ ] Verificado se build é gerado em `./dist`
- [ ] Configurado webhook (se desejar deploy automático)

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no Git Manager
2. Execute os comandos manualmente no servidor para debug
3. Verifique permissões de arquivos e diretórios

---

**Última atualização:** 2026-02-05
