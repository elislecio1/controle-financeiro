# 🧪 Guia de Teste Rápido

## 🚀 Iniciar o Sistema

1. **Configure o Supabase:**
   ```bash
   # Edite o arquivo .env com suas credenciais
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anonima
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor:**
   ```bash
   npm run dev
   ```

4. **Acesse a aplicação:**
   - Abra: http://localhost:5173
   - Faça login ou registre-se
   - Teste as funcionalidades

## 🧪 Testes Automatizados

### Teste Rápido
```bash
node quick-test.js
```

### Teste Completo
```bash
node test-automation.js
```

## 📋 Checklist de Teste

### ✅ Funcionalidades Básicas
- [ ] Login/Logout
- [ ] Cadastro de transações
- [ ] Edição de transações
- [ ] Exclusão de transações
- [ ] Filtros e busca

### ✅ Funcionalidades Avançadas
- [ ] Notificações
- [ ] Monitoramento
- [ ] IA Financeira
- [ ] Backup
- [ ] Tempo real

## 🐛 Problemas Comuns

### Erro de Conexão com Supabase
- Verifique se as credenciais no .env estão corretas
- Verifique se o projeto Supabase está ativo
- Verifique se as tabelas foram criadas

### Erro de Compilação
- Execute: npm run build
- Verifique se há erros de TypeScript
- Verifique se todas as dependências estão instaladas

### Erro de Permissão
- Verifique se o RLS está configurado
- Verifique se o usuário tem permissões adequadas
- Verifique se as políticas estão corretas

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do console
2. Execute os testes automatizados
3. Consulte a documentação
4. Verifique as configurações

---

**Boa sorte com os testes! 🎉**
