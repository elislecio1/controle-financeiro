# 🔍 Verificar e Configurar DNS

## ❌ Problema Identificado

O erro mostra que o DNS não está configurado:
```
DNS problem: NXDOMAIN looking up A for financeiro.donsantosba.com.br
```

Isso significa que o registro DNS **A** não existe para o subdomínio.

---

## 🔍 Passo 1: Verificar DNS Atual

Execute estes comandos no terminal:

```bash
# Verificar se o DNS está configurado
nslookup financeiro.donsantosba.com.br

# Ou usando dig
dig financeiro.donsantosba.com.br

# Verificar apenas o registro A
dig +short financeiro.donsantosba.com.br A

# Verificar IPv4 e IPv6
dig financeiro.donsantosba.com.br A
dig financeiro.donsantosba.com.br AAAA
```

**Resultado esperado**: Deve retornar o IP do seu servidor (192.168.100.62 ou IP público)

**Se retornar**: `NXDOMAIN` ou `not found` = DNS não configurado

---

## ⚙️ Passo 2: Configurar DNS no Provedor

Você precisa criar um registro DNS **A** no provedor onde o domínio `donsantosba.com.br` está registrado.

### Onde Configurar

1. **Registro.br** (se o domínio está registrado lá)
2. **Painel do provedor de hospedagem** (Cloudflare, GoDaddy, etc.)
3. **Painel do aapanel** (se você gerencia DNS pelo aapanel)

### Como Configurar

#### Opção A: Registro DNS A (Recomendado)

1. Acesse o painel de DNS do seu provedor
2. Adicione um novo registro:
   - **Tipo**: A
   - **Nome/Host**: `financeiro` (ou `financeiro.donsantosba.com.br`)
   - **Valor/IP**: `SEU_IP_PUBLICO` (não o IP local 192.168.100.62)
   - **TTL**: 3600 (ou padrão)

#### Opção B: CNAME (Alternativa)

1. Acesse o painel de DNS
2. Adicione um novo registro:
   - **Tipo**: CNAME
   - **Nome/Host**: `financeiro`
   - **Valor**: `donsantosba.com.br` (ou outro domínio que já aponte para o servidor)

---

## 🔍 Passo 3: Descobrir o IP Público do Servidor

Execute no servidor:

```bash
# Verificar IP público
curl ifconfig.me
# Ou
curl -4 ifconfig.me
# Ou
wget -qO- ifconfig.me

# Verificar IPs de todas as interfaces
ip addr show
# Ou
ifconfig
```

**Importante**: Use o **IP público**, não o IP local (192.168.100.62)

---

## ⏳ Passo 4: Aguardar Propagação DNS

Após configurar o DNS, aguarde a propagação:

```bash
# Verificar propagação (execute várias vezes)
dig +short financeiro.donsantosba.com.br A

# Verificar de diferentes servidores DNS
dig @8.8.8.8 financeiro.donsantosba.com.br A
dig @1.1.1.1 financeiro.donsantosba.com.br A
```

**Tempo de propagação**: Geralmente 5-30 minutos, mas pode levar até 48 horas.

---

## ✅ Passo 5: Verificar se DNS Está Funcionando

Antes de tentar obter o certificado SSL novamente, verifique:

```bash
# Verificar se o DNS está resolvendo
nslookup financeiro.donsantosba.com.br

# Deve retornar algo como:
# Name: financeiro.donsantosba.com.br
# Address: SEU_IP_PUBLICO

# Testar acesso HTTP
curl -I http://financeiro.donsantosba.com.br

# Verificar se o site está acessível
wget --spider http://financeiro.donsantosba.com.br
```

---

## 🔒 Passo 6: Obter Certificado SSL (Após DNS Configurado)

**SOMENTE após o DNS estar funcionando**, execute:

```bash
# Verificar DNS primeiro
dig +short financeiro.donsantosba.com.br A

# Se retornar um IP, então pode obter o certificado
sudo certbot certonly --webroot -w /www/wwwroot/financeiro.donsantosba.com.br -d financeiro.donsantosba.com.br
```

---

## 🐛 Troubleshooting

### DNS ainda não resolve após configurar

**Soluções**:
1. Aguarde mais tempo (propagação pode levar horas)
2. Verifique se o registro foi salvo corretamente
3. Limpe o cache DNS local:
   ```bash
   sudo systemd-resolve --flush-caches
   # Ou
   sudo resolvectl flush-caches
   ```

### Como verificar se o DNS está propagado globalmente

Use ferramentas online:
- https://dnschecker.org
- https://www.whatsmydns.net
- https://mxtoolbox.com/DNSLookup.aspx

Digite: `financeiro.donsantosba.com.br` e verifique se aparece o IP correto em diferentes servidores DNS.

### Erro: "Unable to verify domain ownership"

**Causa**: DNS não está apontando para o servidor correto

**Solução**:
1. Verifique se o IP no DNS está correto
2. Verifique se a porta 80 está aberta no firewall
3. Verifique se o Nginx está rodando e servindo o site

---

## 📝 Checklist Rápido

- [ ] Descobrir IP público do servidor
- [ ] Configurar registro DNS A no provedor
- [ ] Aguardar propagação DNS (verificar com `dig`)
- [ ] Verificar se o site está acessível via HTTP
- [ ] Obter certificado SSL com certbot

---

## 🚀 Comandos Rápidos (Resumo)

```bash
# 1. Descobrir IP público
curl ifconfig.me

# 2. Verificar DNS
dig +short financeiro.donsantosba.com.br A

# 3. Testar acesso
curl -I http://financeiro.donsantosba.com.br

# 4. Obter certificado (após DNS funcionar)
sudo certbot certonly --webroot -w /www/wwwroot/financeiro.donsantosba.com.br -d financeiro.donsantosba.com.br
```

---

**⚠️ IMPORTANTE**: Configure o DNS primeiro antes de tentar obter o certificado SSL novamente!

