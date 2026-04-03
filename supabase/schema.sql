-- ============================================================
-- ELRAFATRAVEL — Esquema de base de datos
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- -------------------------------------------------------
-- 1. PROFILES (extiende auth.users de Supabase)
-- -------------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'cliente' CHECK (rol IN ('admin', 'cliente')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para crear el profile automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, nombre, email, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'rol', 'cliente')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- -------------------------------------------------------
-- 2. PASEOS (catálogo de paseos)
-- -------------------------------------------------------
CREATE TABLE paseos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio NUMERIC(10, 2) NOT NULL,
  duracion_minutos INTEGER NOT NULL,
  imagen_url TEXT,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- 3. DISPONIBILIDAD (franjas horarias por paseo y día)
-- -------------------------------------------------------
CREATE TABLE disponibilidad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paseo_id UUID NOT NULL REFERENCES paseos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  bloqueado BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (paseo_id, fecha, hora_inicio)
);

-- -------------------------------------------------------
-- 4. RESERVAS
-- -------------------------------------------------------
CREATE TABLE reservas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  paseo_id UUID NOT NULL REFERENCES paseos(id) ON DELETE CASCADE,
  disponibilidad_id UUID NOT NULL REFERENCES disponibilidad(id) ON DELETE CASCADE,
  num_personas INTEGER NOT NULL CHECK (num_personas >= 1 AND num_personas <= 3),
  notas TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'rechazada', 'cancelada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- 5. PAGOS
-- -------------------------------------------------------
CREATE TABLE pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_id UUID NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  monto NUMERIC(10, 2) NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'eur',
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completado', 'fallido')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- 6. EGRESOS (gastos de la empresa)
-- -------------------------------------------------------
CREATE TABLE egresos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descripcion TEXT NOT NULL,
  monto NUMERIC(10, 2) NOT NULL,
  fecha DATE NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('combustible', 'mantenimiento', 'otros')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Seguridad por filas
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE paseos ENABLE ROW LEVEL SECURITY;
ALTER TABLE disponibilidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE egresos ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Usuarios ven su propio perfil" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins ven todos los perfiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );
CREATE POLICY "Usuarios actualizan su propio perfil" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- PASEOS (públicos para lectura, solo admin escribe)
CREATE POLICY "Paseos visibles para todos" ON paseos
  FOR SELECT USING (TRUE);
CREATE POLICY "Solo admin gestiona paseos" ON paseos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- DISPONIBILIDAD (pública para lectura, solo admin escribe)
CREATE POLICY "Disponibilidad visible para todos" ON disponibilidad
  FOR SELECT USING (TRUE);
CREATE POLICY "Solo admin gestiona disponibilidad" ON disponibilidad
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- RESERVAS
CREATE POLICY "Clientes ven sus reservas" ON reservas
  FOR SELECT USING (auth.uid() = cliente_id);
CREATE POLICY "Admins ven todas las reservas" ON reservas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );
CREATE POLICY "Clientes crean reservas" ON reservas
  FOR INSERT WITH CHECK (auth.uid() = cliente_id);
CREATE POLICY "Admins actualizan reservas" ON reservas
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- PAGOS
CREATE POLICY "Clientes ven sus pagos" ON pagos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM reservas WHERE id = reserva_id AND cliente_id = auth.uid())
  );
CREATE POLICY "Admins ven todos los pagos" ON pagos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- EGRESOS (solo admin)
CREATE POLICY "Solo admin gestiona egresos" ON egresos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );
