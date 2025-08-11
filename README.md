# 💰 Sistema de Controle Financeiro

Um sistema completo de controle financeiro pessoal e empresarial desenvolvido com React, TypeScript e Supabase.

## 🚀 Funcionalidades

### 📊 Dashboard Principal
- Visão geral das finanças
- Gráficos e estatísticas
- Filtros por período e categoria
- Resumo de receitas e despesas

### 💳 Gestão de Transações
- Cadastro de receitas e despesas
- Categorização automática
- Suporte a parcelas
- Transferências entre contas
- Histórico completo

### 🏦 Gestão de Contas
- Múltiplas contas bancárias
- Cartões de crédito
- Controle de saldos
- Limites e vencimentos

### 📈 Investimentos
- Acompanhamento de carteira
- Diferentes tipos de investimento
- Cálculo de rentabilidade
- Histórico de operações

### 🎯 Metas e Orçamentos
- Definição de metas financeiras
- Controle de orçamentos
- Acompanhamento de progresso
- Alertas e notificações

## 🛠️ Tecnologias

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build**: Vite
- **Backend**: Supabase (PostgreSQL)
- **Deploy**: Vercel

## 📱 Características

- ✅ Interface responsiva
- ✅ PWA (Progressive Web App)
- ✅ Modo offline com dados mock
- ✅ Autenticação segura
- ✅ Backup automático
- ✅ Exportação de relatórios

## 🚀 Como Usar

### Pré-requisitos
- Node.js 16+
- npm ou yarn
- Conta no Supabase (opcional)

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/controle-financeiro.git
cd controle-financeiro
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp env.example .env
# Edite o arquivo .env com suas credenciais do Supabase
```

4. **Execute em desenvolvimento**
```bash
npm run dev
```

5. **Build para produção**
```bash
npm run build
```

## 🌐 Deploy

### Vercel (Recomendado)
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Netlify
```bash
npm run build
npm run deploy:netlify
```

### GitHub Pages
```bash
npm run deploy:github
```

## 📊 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── modules/        # Módulos específicos
│   └── TransactionForm.tsx
├── services/           # Serviços de API
│   ├── supabase.ts    # Integração Supabase
│   └── localStorage.ts # Fallback local
├── types/              # Definições TypeScript
├── utils/              # Utilitários
└── App.tsx            # Componente principal
```

## 🔧 Configuração do Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Configure as tabelas necessárias
4. Copie as credenciais para o arquivo `.env`

## 📈 Roadmap

- [ ] Integração com APIs bancárias
- [ ] Reconhecimento automático de transações
- [ ] Relatórios avançados
- [ ] App mobile nativo
- [ ] Integração com planilhas
- [ ] Sistema de alertas

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/seu-usuario/controle-financeiro/issues)
- **Documentação**: [Wiki do Projeto](https://github.com/seu-usuario/controle-financeiro/wiki)
- **Email**: seu-email@exemplo.com

## 🙏 Agradecimentos

- Comunidade React
- Equipe Supabase
- Contribuidores do projeto

---

**⭐ Se este projeto te ajudou, deixe uma estrela no GitHub!** 