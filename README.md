# Dashboard Financeiro - Cloud Database

Dashboard interativo para controle financeiro com armazenamento em nuvem usando **Supabase**.

## 🚀 Funcionalidades

- **📊 Visualização em Tempo Real**: Conecta com banco de dados em nuvem
- **📈 Gráficos Interativos**: Gráficos de linha, barras e pizza com Recharts
- **🎨 Interface Moderna**: Design responsivo com Tailwind CSS
- **📱 Múltiplas Abas**: Visão geral, análises e cadastro de transações
- **🔄 Atualização Automática**: Botão para atualizar dados em tempo real
- **☁️ Armazenamento em Nuvem**: Dados seguros no Supabase
- **📤 Exportação/Importação**: Backup e restauração de dados

## 📋 Pré-requisitos

- Node.js 16+ 
- npm ou yarn
- Conta no Supabase (gratuita)

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone <seu-repositorio>
cd google-sheets-dashboard
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o Supabase:
   - Siga o guia em `SUPABASE_SETUP.md`
   - Crie um arquivo `.env` com suas credenciais

4. Execute o projeto:
```bash
npm run dev
```

## ☁️ Configuração do Supabase

### 1. **Criar Projeto**
1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta gratuita
3. Crie um novo projeto

### 2. **Configurar Banco**
1. Crie a tabela `transactions` (veja `SUPABASE_SETUP.md`)
2. Configure as políticas de segurança
3. Copie as credenciais da API

### 3. **Variáveis de Ambiente**
Crie um arquivo `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 📊 Estrutura do Banco

A tabela `transactions` deve ter:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | Chave primária |
| vencimento | text | Data de vencimento |
| descricao | text | Descrição da transação |
| empresa | text | Nome da empresa |
| tipo | text | Tipo (Despesa/Receita/Investimento) |
| valor | numeric | Valor da transação |
| parcela | text | Número da parcela |
| situacao | text | Situação atual |
| data_pagamento | text | Data do pagamento |
| created_at | timestamp | Data de criação |
| updated_at | timestamp | Data de atualização |

## 🎨 Personalização

### Cores
Edite o arquivo `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        500: '#3b82f6', // Sua cor principal
      }
    }
  }
}
```

### Dados
Modifique o arquivo `src/services/supabase.ts` para personalizar a conexão.

## 📱 Responsividade

O dashboard é totalmente responsivo:
- **Desktop** (1200px+)
- **Tablet** (768px - 1199px)
- **Mobile** (320px - 767px)

## 🚀 Deploy

### Vercel
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
# Faça upload da pasta dist
```

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Visualiza o build de produção
- `npm run lint` - Executa o linter

## 📈 Próximas Funcionalidades

- [ ] Autenticação de usuários
- [ ] Tempo real com WebSockets
- [ ] Exportação de relatórios em PDF
- [ ] Filtros avançados
- [ ] Gráficos personalizáveis
- [ ] Notificações push
- [ ] Backup automático

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte:
- Consulte `SUPABASE_SETUP.md` para configuração
- Verifique os logs no console do navegador
- Abra uma issue no GitHub

---

**🎉 Dashboard migrado com sucesso para Cloud Database!** 