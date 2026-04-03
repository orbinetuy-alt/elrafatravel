-- ============================================================
-- ELRAFATRAVEL — Nuevas tablas para detalle de paseo y reserva
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- -------------------------------------------------------
-- 1. PASEO_IMAGENES (galería de imágenes por paseo)
-- -------------------------------------------------------
CREATE TABLE paseo_imagenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paseo_id UUID NOT NULL REFERENCES paseos(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para obtener imágenes de un paseo ordenadas
CREATE INDEX idx_paseo_imagenes_paseo_orden ON paseo_imagenes(paseo_id, orden);

-- -------------------------------------------------------
-- 2. DIAS_BLOQUEADOS (el admin bloquea días enteros por paseo)
-- -------------------------------------------------------
CREATE TABLE dias_bloqueados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paseo_id UUID NOT NULL REFERENCES paseos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (paseo_id, fecha)
);

-- Índice para consultas rápidas por paseo
CREATE INDEX idx_dias_bloqueados_paseo ON dias_bloqueados(paseo_id);

-- -------------------------------------------------------
-- 3. HORARIOS (plantilla de horarios disponibles por paseo)
--    El admin define qué horarios ofrece cada paseo.
--    Se usan para poblar el dropdown del formulario de reserva.
-- -------------------------------------------------------
CREATE TABLE horarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paseo_id UUID NOT NULL REFERENCES paseos(id) ON DELETE CASCADE,
  hora TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (paseo_id, hora)
);

-- Índice para obtener horarios de un paseo ordenados
CREATE INDEX idx_horarios_paseo ON horarios(paseo_id, hora);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE paseo_imagenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dias_bloqueados ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios ENABLE ROW LEVEL SECURITY;

-- PASEO_IMAGENES (públicas para lectura, solo admin escribe)
CREATE POLICY "Imágenes visibles para todos" ON paseo_imagenes
  FOR SELECT USING (TRUE);
CREATE POLICY "Solo admin gestiona imágenes" ON paseo_imagenes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- DIAS_BLOQUEADOS (públicos para lectura, solo admin escribe)
CREATE POLICY "Días bloqueados visibles para todos" ON dias_bloqueados
  FOR SELECT USING (TRUE);
CREATE POLICY "Solo admin gestiona días bloqueados" ON dias_bloqueados
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- HORARIOS (públicos para lectura, solo admin escribe)
CREATE POLICY "Horarios visibles para todos" ON horarios
  FOR SELECT USING (TRUE);
CREATE POLICY "Solo admin gestiona horarios" ON horarios
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );
