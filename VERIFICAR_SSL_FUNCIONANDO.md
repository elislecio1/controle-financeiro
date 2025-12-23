# ✅ Verificar se SSL Está Funcionando Corretamente

## 🔍 Verificações Rápidas

### 1. Verificar se está acessando via HTTPS

**Certifique-se de acessar**: `https://cf.don.cim.br` (com **https**)

Não acesse: `http://cf.don.cim.br` (sem s)

### 2. Verificar no aapanel

1. **Website** → `cf.don.cim.br` → **Settings** → **SSL**
2. Verifique se **"Force HTTPS"** está marcado
3. Se não estiver, marque e salve

### 3. Limpar Cache do Navegador

- Pressione `Ctrl + Shift + Delete`
- Limpe **Cache** e **Cookies**
- Ou use **Janela Anônima/Privada** (`Ctrl + Shift + N`)

### 4. Verificar Certificado

No navegador:
1. Clique no **cadeado** na barra de endereço
2. Clique em **"Certificado"** ou **"Connection is secure"**
3. Deve mostrar:
   - **Emitido para**: cf.don.cim.br
   - **Emitido por**: Let's Encrypt
   - **Válido até**: 2026-03-10

---

## 🧪 Testar no Terminal

```bash
# Verificar se HTTPS está funcionando
curl -I https://cf.don.cim.br

# Deve retornar:
# HTTP/2 200
# (não HTTP/1.1)

# Verificar certificado
openssl s_client -connect cf.don.cim.br:443 -servername cf.don.cim.br < /dev/null 2>/dev/null | openssl x509 -noout -subject -dates
```

---

## 🔧 Se Ainda Mostrar "Não Seguro"

### Verificar Console do Navegador (F12)

1. Abra o Console (F12)
2. Procure por erros:
   - `Mixed Content` (conteúdo misto)
   - `insecure resource`
   - `blocked loading`

### Verificar se há recursos HTTP

Todos os recursos devem carregar via HTTPS:
- Imagens
- Scripts (JS)
- CSS
- Fontes
- APIs

---

## 📝 Checklist

- [ ] Acessando via `https://cf.don.cim.br` (não http)
- [ ] "Force HTTPS" marcado no aapanel
- [ ] Cache do navegador limpo
- [ ] Certificado válido (verificado no navegador)
- [ ] Sem erros de conteúdo misto no Console
- [ ] Configuração Nginx está usando `nginx-cf-don-cim-SSL.conf`

---

**✅ Após verificar tudo, o aviso deve desaparecer!**

