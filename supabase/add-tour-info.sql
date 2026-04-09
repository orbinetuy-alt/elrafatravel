-- Agregar campos editables para la sección "Tour Information" del detalle de paseo
ALTER TABLE paseos
  ADD COLUMN IF NOT EXISTS ubicacion TEXT DEFAULT 'Lisboa, Portugal',
  ADD COLUMN IF NOT EXISTS modalidad TEXT DEFAULT 'Paseo privado con guía';
