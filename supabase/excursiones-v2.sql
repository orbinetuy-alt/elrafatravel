-- ============================================================
-- EXCURSIONES v2 — Rangos de personas en lugar de número exacto
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Agregar columnas de rango
ALTER TABLE paseo_precios_persona
  ADD COLUMN IF NOT EXISTS min_personas INTEGER CHECK (min_personas >= 1),
  ADD COLUMN IF NOT EXISTS max_personas INTEGER CHECK (max_personas >= 1);

-- 2. Hacer num_personas nullable (ya no lo usamos)
ALTER TABLE paseo_precios_persona
  ALTER COLUMN num_personas DROP NOT NULL;

-- 3. Eliminar el unique constraint anterior y crear uno nuevo sobre min_personas
ALTER TABLE paseo_precios_persona
  DROP CONSTRAINT IF EXISTS paseo_precios_persona_paseo_id_num_personas_key;

ALTER TABLE paseo_precios_persona
  ADD CONSTRAINT paseo_precios_persona_paseo_id_min_personas_key
  UNIQUE (paseo_id, min_personas);
