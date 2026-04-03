-- ============================================================
-- PASEO_DURACIONES — Opciones de duración y precio por paseo
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Crear la tabla
CREATE TABLE paseo_duraciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paseo_id UUID NOT NULL REFERENCES paseos(id) ON DELETE CASCADE,
  etiqueta TEXT NOT NULL,          -- Ej: "1 hora", "1h 30min", "2 horas"
  duracion_minutos INTEGER NOT NULL CHECK (duracion_minutos > 0),
  precio NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. RLS
ALTER TABLE paseo_duraciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Duraciones visibles para todos" ON paseo_duraciones
  FOR SELECT USING (TRUE);

CREATE POLICY "Solo admin gestiona duraciones" ON paseo_duraciones
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- 3. Agregar duracion_id a reservas (nullable para no romper reservas existentes)
ALTER TABLE reservas
  ADD COLUMN IF NOT EXISTS duracion_id UUID REFERENCES paseo_duraciones(id) ON DELETE SET NULL;

-- 4. (Opcional) Hacer precio y duracion_minutos en paseos nullable
--    ya que ahora viven en paseo_duraciones
ALTER TABLE paseos
  ALTER COLUMN precio DROP NOT NULL,
  ALTER COLUMN duracion_minutos DROP NOT NULL;
