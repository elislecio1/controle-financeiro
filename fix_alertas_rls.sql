-- =====================================================
-- CORREÇÃO RLS PARA TABELAS DE ALERTAS
-- =====================================================

-- Habilitar RLS nas tabelas de alertas
ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para as tabelas de alertas
CREATE POLICY "Allow all operations for authenticated users" ON alertas 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON configuracoes_alertas 
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON notificacoes 
FOR ALL USING (auth.role() = 'authenticated');

-- Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('alertas', 'configuracoes_alertas', 'notificacoes');
