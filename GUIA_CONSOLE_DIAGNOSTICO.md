# Guia: Como Usar a Função de Diagnóstico no Console

## ⚠️ Problema com Aviso de Segurança

Se você ver este aviso no console:
```
Aviso: não cole código no Console do DevTools se você não entender...
```

**Solução:** Não cole o código! Digite manualmente no console.

## 📝 Passo a Passo

### 1. Abrir o Console
- Pressione **F12** (ou **Ctrl+Shift+I** no Windows/Linux)
- Ou **Cmd+Option+I** no Mac
- Ou clique com botão direito → "Inspecionar" → aba "Console"

### 2. Digitar Manualmente (NÃO COLAR)

Digite exatamente isto no console e pressione Enter:

```javascript
window.diagnosticoEmpresa()
```

**Importante:** Digite letra por letra, não cole!

### 3. Ver o Resultado

A função mostrará um diagnóstico completo no console com:
- ✅ Empresa selecionada
- 📋 Total de categorias
- 👥 Total de contatos
- ⚠️ Problemas encontrados
- 💡 Recomendações

## 🔄 Migrar Dados (se necessário)

Se o diagnóstico mostrar que há categorias/contatos sem `empresa_id`, execute:

```javascript
window.migrarDadosParaEmpresa()
```

**Importante:** Digite manualmente, não cole!

## ✅ Verificar se a Função Está Disponível

Antes de executar, você pode verificar se a função está carregada:

```javascript
typeof window.diagnosticoEmpresa
```

Se retornar `"function"`, está tudo certo! Se retornar `"undefined"`, recarregue a página (F5).

## 🐛 Solução de Problemas

### Problema: "window.diagnosticoEmpresa is not a function"
**Solução:** Recarregue a página (F5 ou Ctrl+F5)

### Problema: Aviso de segurança ao colar
**Solução:** Não cole! Digite manualmente no console

### Problema: Nenhum resultado aparece
**Solução:** 
1. Verifique se há erros no console (em vermelho)
2. Recarregue a página
3. Verifique se está logado no sistema
