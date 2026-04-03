-- ============================================================
-- MIGRACIÓN: Pagos con tipo (seña/final) y checkout session
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Agregar columnas a pagos
ALTER TABLE pagos
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'senia' CHECK (tipo IN ('senia', 'final')),
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT UNIQUE;

-- 2. RLS para pagos: clientes ven sus propios pagos
DROP POLICY IF EXISTS "Clientes ven sus pagos" ON pagos;
CREATE POLICY "Clientes ven sus pagos" ON pagos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reservas
      WHERE reservas.id = pagos.reserva_id
        AND reservas.cliente_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins ven todos los pagos" ON pagos;
CREATE POLICY "Admins ven todos los pagos" ON pagos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );

DROP POLICY IF EXISTS "Service role gestiona pagos" ON pagos;
CREATE POLICY "Service role gestiona pagos" ON pagos
  FOR ALL USING (true);
