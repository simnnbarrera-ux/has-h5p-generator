-- =============================================================================
-- HAS H5P Generator — Endurecimiento incremental de autenticación y RLS
--
-- Esta migración se ejecuta después de 001_has_h5p_schema.sql y
-- 002_has_h5p_production_auth_schema.sql. Es deliberadamente conservadora:
--   * conserva filas, proyectos, roles y cuotas existentes;
--   * solo rellena auth_user_id cuando todavía es NULL y el email coincide;
--   * deja el acceso de escritura/lectura de Storage en el servidor service-role.
--
-- No se crean RPC de rate limit ni RPC de autenticación en esta migración.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Vinculación opcional de las tablas con auth.users
-- -----------------------------------------------------------------------------
-- Las columnas son nullable para conservar registros legacy cuyo email no exista
-- (todavía) en auth.users. SET NULL evita borrar proyectos o logs si una cuenta
-- de autenticación se elimina posteriormente.
ALTER TABLE public.has_profiles
  ADD COLUMN IF NOT EXISTS auth_user_id UUID
  REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.has_projects
  ADD COLUMN IF NOT EXISTS auth_user_id UUID
  REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.has_usage_logs
  ADD COLUMN IF NOT EXISTS auth_user_id UUID
  REFERENCES auth.users(id) ON DELETE SET NULL;

-- El backfill solo enlaza filas que aún no tienen propietario. Nunca sustituye
-- un vínculo existente ni modifica role, daily_quota u otros datos de negocio.
UPDATE public.has_profiles AS profile
SET auth_user_id = auth_user.id
FROM auth.users AS auth_user
WHERE profile.auth_user_id IS NULL
  AND auth_user.email IS NOT NULL
  AND lower(profile.email) = lower(auth_user.email);

UPDATE public.has_projects AS project
SET auth_user_id = auth_user.id
FROM auth.users AS auth_user
WHERE project.auth_user_id IS NULL
  AND auth_user.email IS NOT NULL
  AND lower(project.user_email) = lower(auth_user.email);

UPDATE public.has_usage_logs AS usage_log
SET auth_user_id = auth_user.id
FROM auth.users AS auth_user
WHERE usage_log.auth_user_id IS NULL
  AND auth_user.email IS NOT NULL
  AND lower(usage_log.user_email) = lower(auth_user.email);

-- Índices para las comprobaciones de ownership y las consultas de uso.
CREATE INDEX IF NOT EXISTS idx_has_profiles_auth_user
  ON public.has_profiles (auth_user_id);

CREATE INDEX IF NOT EXISTS idx_has_projects_auth_user
  ON public.has_projects (auth_user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_has_usage_logs_auth_user
  ON public.has_usage_logs (auth_user_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 2. Trigger de alta: valores de rol y cuota controlados por el servidor
-- -----------------------------------------------------------------------------
-- No se leen role ni daily_quota de raw_user_meta_data. Un perfil nuevo recibe
-- siempre role=professor y la cuota base de 50. Si ya existe una fila (por
-- ejemplo, uno de los administradores semilla), solo se completa un vínculo
-- NULL; nunca se cambia su rol, cuota ni un auth_user_id ya establecido.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- auth.users puede admitir registros sin email; no se puede crear el perfil
  -- requerido por has_profiles.email NOT NULL en ese caso.
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
    lower(NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'faculty', 'Facultad de Ingeniería y Ciencias Básicas'),
    COALESCE(NEW.raw_user_meta_data->>'program', 'Campus Digital UAO'),
    'professor',
    50,
    'es-CO-SalomeNeural'
  )
  ON CONFLICT (email) DO UPDATE
    SET auth_user_id = COALESCE(profile.auth_user_id, EXCLUDED.auth_user_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. RLS: eliminar políticas públicas antiguas y aplicar ownership por UUID
-- -----------------------------------------------------------------------------
-- Se eliminan por nombre las políticas abiertas creadas por 002. También se
-- eliminan los nombres de esta migración para que una segunda ejecución sea
-- completamente idempotente.
DROP POLICY IF EXISTS "Lectura pública de perfiles" ON public.has_profiles;
DROP POLICY IF EXISTS "Usuarios editan su propio perfil" ON public.has_profiles;
DROP POLICY IF EXISTS has_profiles_owner_select ON public.has_profiles;
DROP POLICY IF EXISTS has_profiles_owner_update ON public.has_profiles;

DROP POLICY IF EXISTS "Proyectos públicos oficiales Reto 11" ON public.has_projects;
DROP POLICY IF EXISTS "Usuarios ven sus propios proyectos" ON public.has_projects;
DROP POLICY IF EXISTS "Usuarios crean proyectos personales" ON public.has_projects;
DROP POLICY IF EXISTS "Usuarios actualizan sus propios proyectos" ON public.has_projects;
DROP POLICY IF EXISTS has_projects_owner_select ON public.has_projects;
DROP POLICY IF EXISTS has_projects_owner_insert ON public.has_projects;
DROP POLICY IF EXISTS has_projects_owner_update ON public.has_projects;

DROP POLICY IF EXISTS "Registro de auditoria para usuarios y servidor" ON public.has_usage_logs;

ALTER TABLE public.has_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.has_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.has_usage_logs ENABLE ROW LEVEL SECURITY;

-- No se declara ninguna policy para anon. Las policies explícitas solo aplican
-- a authenticated y comparan siempre auth.uid() con auth_user_id.
-- La aplicación accede a estas tablas solo mediante handlers autenticados con
-- service-role; no se requiere acceso SQL directo desde el navegador.
REVOKE ALL PRIVILEGES ON TABLE public.has_profiles FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.has_projects FROM PUBLIC, anon, authenticated;
CREATE POLICY has_profiles_owner_select
  ON public.has_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY has_profiles_owner_update
  ON public.has_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY has_projects_owner_select
  ON public.has_projects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY has_projects_owner_insert
  ON public.has_projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY has_projects_owner_update
  ON public.has_projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Los logs no tienen ninguna policy para anon ni authenticated. La aplicación
-- los escribe/lee exclusivamente mediante el backend con service-role.
REVOKE ALL PRIVILEGES ON TABLE public.has_usage_logs FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. Storage privado, sin acceso directo de clientes
-- -----------------------------------------------------------------------------
-- El upsert también corrige un bucket creado previamente como público, sin
-- tocar sus objetos ni sus nombres.
INSERT INTO storage.buckets (id, name, public)
VALUES ('has-h5p-store', 'has-h5p-store', false)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

-- Eliminar las policies abiertas de SELECT/INSERT/UPDATE creadas por 002.
-- Service-role no necesita una policy RLS de cliente para operar Storage.
DROP POLICY IF EXISTS "Descarga publica de paquetes H5P" ON storage.objects;
DROP POLICY IF EXISTS "Subida de paquetes H5P" ON storage.objects;
DROP POLICY IF EXISTS "Actualizacion de paquetes H5P" ON storage.objects;

-- Asegura que, sin policies de cliente para este bucket, RLS sea el mecanismo
-- que deniega el acceso directo de anon/authenticated. No se revocan permisos
-- de storage.objects globalmente porque podrían corresponder a otros buckets.
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Fin de la migración 003
-- =============================================================================
