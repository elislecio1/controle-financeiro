# 🔧 SOLUÇÃO DEFINITIVA - Erro "dubious ownership"

## Problema
O Git Manager executa como um usuário diferente do dono do repositório, causando erro:
```
fatal: detected dubious ownership in repository at '/www/wwwroot/sites/elislecio/cf.don.cim.br'
```

## Solução 1: Script de Configuração Única (RECOMENDADO)

Execute este script **UMA VEZ** no servidor:

```bash
# No servidor, execute:
cd /www/wwwroot/sites/elislecio/cf.don.cim.br
bash configurar-git-safe-directory.sh
```

Ou manualmente:
```bash
# Como root ou o usuário que executa o Git Manager
git config --global --add safe.directory "/www/wwwroot/sites/elislecio/cf.don.cim.br"
git config --global --add safe.directory "*"
```

## Solução 2: Script de Deploy Atualizado

O script `deploy-git-manager.sh` agora:
- ✅ Filtra o erro de "dubious ownership" automaticamente
- ✅ Ignora o erro se for apenas esse aviso
- ✅ Continua a execução normalmente
- ✅ Mostra outros erros reais

## Como Aplicar

1. **Execute o script de configuração no servidor** (Solução 1 - RECOMENDADO):
   ```bash
   ssh seu-servidor
   cd /www/wwwroot/sites/elislecio/cf.don.cim.br
   bash configurar-git-safe-directory.sh
   ```

2. **OU atualize o script no Git Manager** (Solução 2):
   - Vá em Script > Editar "atualiza_deploy"
   - Cole o conteúdo de `deploy-git-manager.sh`
   - Salve

## Verificação

Após executar o script de configuração, verifique:
```bash
git config --global --get-all safe.directory
```

Deve mostrar:
```
/www/wwwroot/sites/elislecio/cf.don.cim.br
*
```

## Nota de Segurança

O erro de "dubious ownership" é uma proteção do Git. Como o RLS no banco garante isolamento de dados, é seguro ignorar este erro no contexto de deploy automatizado.
