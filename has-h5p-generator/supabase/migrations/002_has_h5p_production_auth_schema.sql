-- =============================================================================
-- HAS H5P Generator — Migración SQL Completa para Producción (Supabase)
-- Proyecto: HAS H5P Generator | Digitatón UAO 2026 (Reto 11 - EQ-36)
-- Configura: auth.users, has_profiles, has_projects, has_usage_logs, Storage y RLS
-- =============================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 2. Tabla de Perfiles Docentes (public.has_profiles)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.has_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  faculty TEXT NOT NULL DEFAULT 'Facultad de Ingeniería y Ciencias Básicas',
  program TEXT NOT NULL DEFAULT 'Campus Digital UAO',
  role TEXT NOT NULL DEFAULT 'professor' CHECK (role IN ('professor', 'admin', 'orientador')),
  daily_quota INTEGER NOT NULL DEFAULT 50,
  preferred_voice TEXT NOT NULL DEFAULT 'es-CO-SalomeNeural',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_has_profiles_email ON public.has_profiles(email);
CREATE INDEX IF NOT EXISTS idx_has_profiles_auth_user ON public.has_profiles(auth_user_id);

-- -----------------------------------------------------------------------------
-- 3. Tabla de Proyectos y Recursos H5P (public.has_projects)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.has_projects (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  title TEXT NOT NULL,
  course_name TEXT NOT NULL,
  module_name TEXT NOT NULL,
  activity_number INTEGER NOT NULL DEFAULT 1,
  template_id TEXT NOT NULL DEFAULT 'fiuao-6-215',
  raw_mockup TEXT,
  project_spec JSONB NOT NULL,
  ph5p_script TEXT,
  moodle_book JSONB,
  audit_report TEXT[] DEFAULT '{}',
  package_url TEXT,
  slides_count INTEGER NOT NULL DEFAULT 0,
  interactions_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('draft', 'generating', 'ready', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_has_projects_user_email ON public.has_projects(user_email);
CREATE INDEX IF NOT EXISTS idx_has_projects_updated_at ON public.has_projects(updated_at DESC);

-- -----------------------------------------------------------------------------
-- 4. Tabla de Auditoría de Consumo y Rate Limiting (public.has_usage_logs)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.has_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  ip_address TEXT,
  action_type TEXT NOT NULL CHECK (action_type IN ('copilot_chat', 'mockup_import', 'tts_audio', 'stt_whisper', 'h5p_build', 'svg_diagram')),
  model_used TEXT,
  tokens_estimated INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_has_usage_logs_email_created ON public.has_usage_logs(user_email, created_at DESC);

-- -----------------------------------------------------------------------------
-- 5. Trigger Automático: Crear Perfil al Registrarse en auth.users
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.has_profiles (
    auth_user_id,
    email,
    full_name,
    faculty,
    program,
    role,
    daily_quota,
    preferred_voice
  ) VALUES (
    NEW.id,
    LOWER(NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'faculty', 'Facultad de Ingeniería y Ciencias Básicas'),
    COALESCE(NEW.raw_user_meta_data->>'program', 'Campus Digital UAO'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'professor'),
    CASE WHEN COALESCE(NEW.raw_user_meta_data->>'role', '') = 'admin' THEN 100 ELSE 50 END,
    'es-CO-SalomeNeural'
  )
  ON CONFLICT (email) DO UPDATE SET
    auth_user_id = EXCLUDED.auth_user_id,
    full_name = EXCLUDED.full_name,
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- -----------------------------------------------------------------------------
-- 6. Configuración de Seguridad por Filas (Row Level Security - RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.has_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.has_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.has_usage_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para has_profiles
CREATE POLICY "Lectura pública de perfiles"
  ON public.has_profiles FOR SELECT
  USING (true);

CREATE POLICY "Usuarios editan su propio perfil"
  ON public.has_profiles FOR UPDATE
  USING (auth.uid() = auth_user_id OR email = auth.jwt() ->> 'email');

-- Políticas para has_projects
-- A. Permitir lectura pública de los proyectos oficiales del Reto 11 para que los evaluadores puedan ver la demo
CREATE POLICY "Proyectos públicos oficiales Reto 11"
  ON public.has_projects FOR SELECT
  USING (id IN ('matematicas-discretas-act1', 'matematicas-discretas-act0'));

-- B. Usuarios autenticados pueden ver todos sus proyectos personales
CREATE POLICY "Usuarios ven sus propios proyectos"
  ON public.has_projects FOR SELECT
  USING (auth.jwt() ->> 'email' = user_email);

-- C. Usuarios autenticados pueden crear proyectos
CREATE POLICY "Usuarios crean proyectos personales"
  ON public.has_projects FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = user_email OR auth.jwt() IS NULL);

-- D. Usuarios autenticados pueden actualizar sus propios proyectos
CREATE POLICY "Usuarios actualizan sus propios proyectos"
  ON public.has_projects FOR UPDATE
  USING (auth.jwt() ->> 'email' = user_email);

-- Políticas para has_usage_logs
CREATE POLICY "Registro de auditoria para usuarios y servidor"
  ON public.has_usage_logs FOR ALL
  USING (true);

-- -----------------------------------------------------------------------------
-- 7. Configuración de Storage (Bucket: has-h5p-store)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('has-h5p-store', 'has-h5p-store', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Permitir descarga pública de paquetes y plantillas desde Storage
CREATE POLICY "Descarga publica de paquetes H5P"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'has-h5p-store');

-- Permitir subida de paquetes para usuarios autenticados y service-role
CREATE POLICY "Subida de paquetes H5P"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'has-h5p-store');

CREATE POLICY "Actualizacion de paquetes H5P"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'has-h5p-store');

-- -----------------------------------------------------------------------------
-- 8. Datos Semilla: Perfiles de las 4 Cuentas de Prueba (+ Prof. Oswaldo)
-- -----------------------------------------------------------------------------
INSERT INTO public.has_profiles (email, full_name, faculty, program, role, daily_quota, preferred_voice)
VALUES
  ('simon.barrera@uao.edu.co', 'Simón Barrera Ruíz', 'Facultad de Ingeniería y Ciencias Básicas', 'Ingeniería Mecatrónica (EQ-36)', 'admin', 100, 'es-CO-SalomeNeural'),
  ('hermaioni.delgado@uao.edu.co', 'Hermaioni Delgado Paz', 'Facultad de Ingeniería y Ciencias Básicas', 'Ingeniería Mecatrónica (EQ-36)', 'admin', 100, 'es-CO-SalomeNeural'),
  ('alex.silva@uao.edu.co', 'Alex Yohan Silva Mina', 'Facultad de Ingeniería y Ciencias Básicas', 'Ingeniería Informática (EQ-36)', 'admin', 100, 'es-CO-GonzaloNeural'),
  ('demo.docente@uao.edu.co', 'Docente Invitado Demo', 'Facultad de Ingeniería y Ciencias Básicas', 'Campus Digital UAO', 'professor', 50, 'es-CO-SalomeNeural'),
  ('oswaldo.rodriguez@uao.edu.co', 'Prof. Oswaldo Rodríguez Díaz', 'Facultad de Ingeniería y Ciencias Básicas', 'Matemáticas Discretas (Reto 11)', 'professor', 60, 'es-CO-GonzaloNeural')
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  program = EXCLUDED.program,
  role = EXCLUDED.role,
  daily_quota = EXCLUDED.daily_quota;

-- =============================================================================
-- Fin del Script de Migración
-- =============================================================================
