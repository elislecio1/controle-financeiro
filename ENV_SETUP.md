# Configuração das Variáveis de Ambiente

## 📋 Arquivo .env

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
# URL do projeto Supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# Chave pública anônima do Supabase
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 🔧 Como Obter os Valores

### 1. Acesse o Dashboard do Supabase

1. Vá para https://supabase.com
2. Faça login na sua conta
3. Selecione seu projeto

### 2. Obtenha as Credenciais

1. No dashboard, vá para **Settings** > **API**
2. Copie os seguintes valores:
   - **Project URL**: Use como `VITE_SUPABASE_URL`
   - **anon public**: Use como `VITE_SUPABASE_ANON_KEY`

### 3. Exemplo de Valores

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNzQ5NjAwMCwiZXhwIjoxOTUzMDcyMDAwfQ.example
```

## ⚠️ Importante

- **NUNCA** compartilhe suas chaves do Supabase
- **NUNCA** commite o arquivo `.env` no Git
- Use sempre a **anon public** key, não a service role
- Mantenha o arquivo `.env` seguro

## 🔍 Verificação

Após configurar o `.env`:

1. Reinicie o servidor de desenvolvimento: `npm run dev`
2. Teste a conexão na aplicação
3. Verifique se não há erros no console 