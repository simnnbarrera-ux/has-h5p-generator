-- =============================================================================
-- HAS H5P Generator — Esquema Relacional Idempotente (DB-First Persistence)
-- Universidad Autónoma de Occidente (UAO) - Digitatón 2026 (Reto 11 - EQ-36)
-- =============================================================================

-- 1. Tabla de Perfiles Docentes y Cuotas Diarias
CREATE TABLE IF NOT EXISTS public.has_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    faculty TEXT NOT NULL DEFAULT 'Facultad de Ingeniería y Ciencias Básicas',
    program TEXT DEFAULT 'Matemáticas Discretas',
    role TEXT NOT NULL DEFAULT 'professor' CHECK (role IN ('professor', 'admin', 'orientador')),
    daily_quota INTEGER NOT NULL DEFAULT 30,
    preferred_voice TEXT NOT NULL DEFAULT 'es-CO-SalomeNeural',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabla de Proyectos y Cursos H5P / Moodle
CREATE TABLE IF NOT EXISTS public.has_projects (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    title TEXT NOT NULL,
    course_name TEXT NOT NULL DEFAULT 'Matemáticas Discretas',
    module_name TEXT NOT NULL DEFAULT 'Módulo 1: Inducción matemática y recursividad',
    activity_number INTEGER NOT NULL DEFAULT 1,
    template_id TEXT NOT NULL DEFAULT 'fiuao-6-215',
    raw_mockup TEXT,
    project_spec JSONB NOT NULL DEFAULT '{}'::jsonb,
    ph5p_script TEXT,
    moodle_book JSONB DEFAULT '{}'::jsonb,
    audit_report JSONB DEFAULT '[]'::jsonb,
    package_url TEXT,
    slides_count INTEGER NOT NULL DEFAULT 0,
    interactions_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('draft', 'generating', 'ready')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabla de Registro de Uso y Rate-Limiting (Protección de Tokens API)
CREATE TABLE IF NOT EXISTS public.has_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    ip_address TEXT NOT NULL DEFAULT '127.0.0.1',
    action_type TEXT NOT NULL CHECK (action_type IN ('copilot_chat', 'mockup_import', 'tts_audio', 'stt_whisper', 'h5p_build', 'svg_diagram')),
    model_used TEXT,
    tokens_estimated INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para consultas rápidas de Rate-Limiting y Proyectos
CREATE INDEX IF NOT EXISTS idx_has_projects_user_email ON public.has_projects (user_email, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_has_usage_logs_rate_limit ON public.has_usage_logs (user_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_has_usage_logs_ip ON public.has_usage_logs (ip_address, created_at DESC);

-- Semilla inicial: Profesor Diseñador del Reto 11 y Equipo 36
INSERT INTO public.has_profiles (email, full_name, faculty, program, role, daily_quota, preferred_voice)
VALUES
    ('oswaldo.rodriguez@uao.edu.co', 'Prof. Oswaldo Rodríguez Díaz', 'Facultad de Ingeniería y Ciencias Básicas', 'Matemáticas Discretas', 'professor', 50, 'es-CO-GonzaloNeural'),
    ('simnn.barrera@uao.edu.co', 'Simón Barrera Ruíz (EQ-36)', 'Facultad de Ingeniería y Ciencias Básicas', 'Ingeniería Mecatrónica', 'admin', 100, 'es-CO-SalomeNeural'),
    ('hermaioni.delgado@uao.edu.co', 'Hermaioni Delgado Paz (EQ-36)', 'Facultad de Ingeniería y Ciencias Básicas', 'Ingeniería Mecatrónica', 'admin', 100, 'es-CO-SalomeNeural'),
    ('alex.silva@uao.edu.co', 'Alex Yohan Silva Mina (EQ-36)', 'Facultad de Ingeniería y Ciencias Básicas', 'Ingeniería Informática', 'admin', 100, 'es-CO-GonzaloNeural')
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    updated_at = now();
