-- Script para verificar e corrigir políticas RLS da tabela transactions
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se RLS está habilitado na tabela transactions
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'transactions';

-- 2. Verificar políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'transactions';

-- 3. Verificar se o usuário elislecio@gmail.com tem acesso
DO $$
DECLARE
  user_id_val UUID;
  transacoes_count INTEGER;
BEGIN
  -- Buscar o ID do usuário elislecio@gmail.com
  SELECT id INTO user_id_val FROM auth.users WHERE email = 'elislecio@gmail.com';
  
  IF user_id_val IS NOT NULL THEN
    -- Contar transações deste usuário
    SELECT COUNT(*) INTO transacoes_count FROM transactions WHERE user_id = user_id_val;
    RAISE NOTICE 'Usuário elislecio@gmail.com (ID: %) tem % transações', user_id_val, transacoes_count;
    
    -- Verificar algumas transações
    RAISE NOTICE 'Primeiras 3 transações do usuário:';
    FOR i IN 1..3 LOOP
      DECLARE
        transacao RECORD;
      BEGIN
        SELECT * INTO transacao FROM transactions WHERE user_id = user_id_val LIMIT 1 OFFSET i-1;
        IF FOUND THEN
          RAISE NOTICE 'ID: %, Data: %, Valor: %, Descrição: %', 
            transacao.id, transacao.data, transacao.valor, transacao.descricao;
        END IF;
      END;
    END LOOP;
  ELSE
    RAISE NOTICE '❌ Usuário elislecio@gmail.com não encontrado';
  END IF;
END $$;

-- 4. Verificar total de transações na tabela
SELECT COUNT(*) as total_transacoes FROM transactions;

-- 5. Verificar transações sem user_id (pode ser o problema)
SELECT COUNT(*) as transacoes_sem_user_id FROM transactions WHERE user_id IS NULL;

-- 6. Se houver transações sem user_id, atribuir ao usuário elislecio@gmail.com
DO $$
DECLARE
  user_id_val UUID;
  transacoes_sem_user INTEGER;
BEGIN
  -- Buscar o ID do usuário elislecio@gmail.com
  SELECT id INTO user_id_val FROM auth.users WHERE email = 'elislecio@gmail.com';
  
  IF user_id_val IS NOT NULL THEN
    -- Contar transações sem user_id
    SELECT COUNT(*) INTO transacoes_sem_user FROM transactions WHERE user_id IS NULL;
    
    IF transacoes_sem_user > 0 THEN
      RAISE NOTICE 'Encontradas % transações sem user_id. Atribuindo ao usuário elislecio@gmail.com...', transacoes_sem_user;
      
      -- Atualizar transações sem user_id
      UPDATE transactions 
      SET user_id = user_id_val, updated_at = NOW()
      WHERE user_id IS NULL;
      
      RAISE NOTICE '✅ % transações atualizadas com sucesso', transacoes_sem_user;
    ELSE
      RAISE NOTICE 'Todas as transações já possuem user_id';
    END IF;
  ELSE
    RAISE NOTICE '❌ Usuário elislecio@gmail.com não encontrado';
  END IF;
END $$;

-- 7. Verificar e criar políticas RLS se necessário
DO $$
BEGIN
  -- Verificar se existe política para usuários autenticados
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'transactions' 
    AND policyname = 'users_can_view_own_transactions'
  ) THEN
    RAISE NOTICE 'Criando política RLS para usuários verem suas próprias transações...';
    
    -- Criar política para usuários verem suas próprias transações
    CREATE POLICY "users_can_view_own_transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);
    
    -- Criar política para usuários inserirem suas próprias transações
    CREATE POLICY "users_can_insert_own_transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    -- Criar política para usuários atualizarem suas próprias transações
    CREATE POLICY "users_can_update_own_transactions" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);
    
    -- Criar política para usuários deletarem suas próprias transações
    CREATE POLICY "users_can_delete_own_transactions" ON transactions
    FOR DELETE USING (auth.uid() = user_id);
    
    RAISE NOTICE '✅ Políticas RLS criadas com sucesso';
  ELSE
    RAISE NOTICE 'Políticas RLS já existem';
  END IF;
END $$;

-- 8. Verificar se RLS está habilitado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'transactions' 
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE 'Habilitando RLS na tabela transactions...';
    ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS habilitado com sucesso';
  ELSE
    RAISE NOTICE 'RLS já está habilitado na tabela transactions';
  END IF;
END $$;

-- 9. Teste final - verificar se o usuário consegue ver suas transações
DO $$
DECLARE
  user_id_val UUID;
  transacoes_count INTEGER;
BEGIN
  -- Buscar o ID do usuário elislecio@gmail.com
  SELECT id INTO user_id_val FROM auth.users WHERE email = 'elislecio@gmail.com';
  
  IF user_id_val IS NOT NULL THEN
    -- Contar transações deste usuário
    SELECT COUNT(*) INTO transacoes_count FROM transactions WHERE user_id = user_id_val;
    RAISE NOTICE '✅ Usuário elislecio@gmail.com (ID: %) tem % transações', user_id_val, transacoes_count;
    
    IF transacoes_count > 0 THEN
      RAISE NOTICE '✅ Sistema funcionando corretamente - usuário tem transações';
    ELSE
      RAISE NOTICE '⚠️ Usuário não tem transações - verificar se os dados foram inseridos corretamente';
    END IF;
  ELSE
    RAISE NOTICE '❌ Usuário elislecio@gmail.com não encontrado';
  END IF;
END $$;
