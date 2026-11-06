-- =============================================================================
-- HAS H5P Generator — Migración SQL Completa para Producción (Supabase)
-- Proyecto: HAS H5P Generator | Digitatón UAO 2026 (Reto 11 - EQ-35)
-- Configura: auth.users, has_profiles, has_projects, has_usage_logs, Storage y RLS
-- =============================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 2. Tabla de Perfiles de profesores (public.has_profiles)
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

-- 001 puede haber creado ya has_profiles sin esta columna; la añadimos antes del índice.
ALTER TABLE public.has_profiles
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

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
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.has_profiles AS profile (
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
    'professor',
    50,
    'es-CO-SalomeNeural'
  )
  ON CONFLICT (email) DO UPDATE SET
    auth_user_id = COALESCE(profile.auth_user_id, EXCLUDED.auth_user_id),
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

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

-- El navegador nunca accede directamente a estas tablas; todas las operaciones
-- pasan por handlers de servidor que verifican Supabase Auth y usan service-role.
REVOKE ALL PRIVILEGES ON TABLE public.has_profiles FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.has_projects FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.has_usage_logs FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 7. Configuración de Storage (Bucket: has-h5p-store)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('has-h5p-store', 'has-h5p-store', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- No se crean policies de cliente para este bucket privado. El servidor opera
-- exclusivamente con service-role, que no depende de una policy de Storage.

-- -----------------------------------------------------------------------------
-- 8. No se crean cuentas ni perfiles de prueba por defecto.
-- Auth crea perfiles nuevos con role=professor y cuota estándar. Las cuentas
-- administrativas se aprovisionan fuera de banda y nunca con contraseñas semilla.
-- -----------------------------------------------------------------------------

-- =============================================================================
-- Fin del Script de Migración
-- =============================================================================
