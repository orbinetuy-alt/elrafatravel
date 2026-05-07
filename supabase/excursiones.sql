-- ============================================================
-- EXCURSIONES — Soporte para paseos con precio por persona
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Tipo de paseo en la tabla paseos
ALTER TABLE paseos
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'tuk_tuk'
  CHECK (tipo IN ('tuk_tuk', 'excursion'));

-- 2. Hora de salida fija (sólo para excursiones)
ALTER TABLE paseos
  ADD COLUMN IF NOT EXISTS hora_salida TEXT;  -- formato HH:MM, ej: '08:00'

-- 3. Tabla de precios por número de personas (excursiones)
CREATE TABLE IF NOT EXISTS paseo_precios_persona (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paseo_id     UUID NOT NULL REFERENCES paseos(id) ON DELETE CASCADE,
  num_personas INTEGER NOT NULL CHECK (num_personas >= 1),
  precio       NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
  UNIQUE (paseo_id, num_personas),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. RLS para paseo_precios_persona
ALTER TABLE paseo_precios_persona ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Precios persona visibles para todos" ON paseo_precios_persona
  FOR SELECT USING (TRUE);

CREATE POLICY "Solo admin gestiona precios persona" ON paseo_precios_persona
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- 5. Referencia en reservas al precio por persona elegido (nullable)
ALTER TABLE reservas
  ADD COLUMN IF NOT EXISTS precio_persona_id UUID
  REFERENCES paseo_precios_persona(id) ON DELETE SET NULL;
