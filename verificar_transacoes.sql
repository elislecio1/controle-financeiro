-- Script para verificar e inserir dados de teste na tabela transactions
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela transactions existe
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transactions') THEN
    RAISE NOTICE '✅ Tabela transactions existe';
  ELSE
    RAISE NOTICE '❌ Tabela transactions não existe';
  END IF;
END $$;

-- 2. Verificar quantas transações existem
SELECT COUNT(*) as total_transacoes FROM transactions;

-- 3. Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
ORDER BY ordinal_position;

-- 4. Verificar se há transações para o usuário elislecio@gmail.com
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
  ELSE
    RAISE NOTICE '❌ Usuário elislecio@gmail.com não encontrado';
  END IF;
END $$;

-- 5. Inserir dados de teste se não houver transações
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
    
    IF transacoes_count = 0 THEN
      RAISE NOTICE 'Inserindo dados de teste para o usuário %', user_id_val;
      
      -- Inserir transações de teste
      INSERT INTO transactions (
        user_id,
        data,
        valor,
        descricao,
        conta,
        categoria,
        forma,
        tipo,
        status,
        vencimento,
        empresa,
        created_at,
        updated_at
      ) VALUES 
      (
        user_id_val,
        '2024-01-15',
        5000.00,
        'Salário',
        'Conta Corrente Principal - Banco do Brasil',
        'Receitas',
        'Transferência',
        'receita',
        'pago',
        '2024-01-15',
        'Empresa ABC',
        NOW(),
        NOW()
      ),
      (
        user_id_val,
        '2024-01-20',
        -1200.00,
        'Aluguel',
        'Conta Corrente Principal - Banco do Brasil',
        'Moradia',
        'PIX',
        'despesa',
        'pago',
        '2024-01-20',
        'Imobiliária XYZ',
        NOW(),
        NOW()
      ),
      (
        user_id_val,
        '2024-01-25',
        -150.00,
        'Conta de Luz',
        'Conta Corrente Principal - Banco do Brasil',
        'Serviços',
        'Boleto',
        'despesa',
        'pendente',
        '2024-01-25',
        'Companhia de Energia',
        NOW(),
        NOW()
      ),
      (
        user_id_val,
        '2024-01-30',
        -300.00,
        'Supermercado',
        'Conta Corrente Principal - Banco do Brasil',
        'Alimentação',
        'Cartão de Crédito',
        'despesa',
        'pago',
        '2024-01-30',
        'Supermercado ABC',
        NOW(),
        NOW()
      ),
      (
        user_id_val,
        '2024-02-01',
        8000.00,
        'Freelance',
        'Conta Poupança - Itaú',
        'Receitas',
        'PIX',
        'receita',
        'pago',
        '2024-02-01',
        'Cliente Freelance',
        NOW(),
        NOW()
      );
      
      RAISE NOTICE '✅ 5 transações de teste inseridas com sucesso';
    ELSE
      RAISE NOTICE 'Usuário já possui % transações, não inserindo dados de teste', transacoes_count;
    END IF;
  ELSE
    RAISE NOTICE '❌ Usuário elislecio@gmail.com não encontrado, não é possível inserir dados de teste';
  END IF;
END $$;

-- 6. Verificar dados inseridos
SELECT 
  id,
  data,
  valor,
  descricao,
  conta,
  categoria,
  tipo,
  status,
  created_at
FROM transactions 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'elislecio@gmail.com')
ORDER BY data DESC;
