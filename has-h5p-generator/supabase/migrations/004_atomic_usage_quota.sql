-- Atomic, server-only quota reservation for all cost-bearing endpoints.
-- Apply after 003_harden_auth_rls_storage.sql.

CREATE OR REPLACE FUNCTION public.consume_has_usage_quota(
  p_auth_user_id UUID,
  p_user_email TEXT,
  p_ip_address TEXT,
  p_action_type TEXT,
  p_model_used TEXT,
  p_tokens_estimated INTEGER,
  p_daily_quota INTEGER,
  p_minute_limit INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_day_start TIMESTAMPTZ;
  v_day_count INTEGER := 0;
  v_minute_count INTEGER := 0;
  v_daily_quota INTEGER := GREATEST(1, LEAST(COALESCE(p_daily_quota, 30), 1000));
  v_minute_limit INTEGER := GREATEST(1, LEAST(COALESCE(p_minute_limit, 10), 60));
BEGIN
  IF p_auth_user_id IS NULL OR p_user_email IS NULL OR length(trim(p_user_email)) = 0 THEN
    RAISE EXCEPTION 'authenticated user id and email are required';
  END IF;
  IF p_action_type NOT IN ('copilot_chat', 'mockup_import', 'tts_audio', 'stt_whisper', 'h5p_build', 'svg_diagram') THEN
    RAISE EXCEPTION 'unsupported usage action';
  END IF;

  v_day_start := date_trunc('day', v_now AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  -- Serialize reservations per user to prevent concurrent requests bypassing quota.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_auth_user_id::text, 0));

  SELECT
    count(*) FILTER (WHERE created_at >= v_day_start)::INTEGER,
    count(*) FILTER (WHERE created_at >= v_now - interval '1 minute')::INTEGER
  INTO v_day_count, v_minute_count
  FROM public.has_usage_logs
  WHERE auth_user_id = p_auth_user_id
    AND created_at >= LEAST(v_day_start, v_now - interval '1 minute');

  IF v_minute_count >= v_minute_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining_today', GREATEST(0, v_daily_quota - v_day_count),
      'used_last_minute', v_minute_count,
      'daily_quota', v_daily_quota,
      'reason', format('Límite por minuto alcanzado (%s peticiones). Espera un momento.', v_minute_limit)
    );
  END IF;

  IF v_day_count >= v_daily_quota THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining_today', 0,
      'used_last_minute', v_minute_count,
      'daily_quota', v_daily_quota,
      'reason', format('Has alcanzado tu cuota diaria de %s solicitudes.', v_daily_quota)
    );
  END IF;

  INSERT INTO public.has_usage_logs (
    auth_user_id,
    user_email,
    ip_address,
    action_type,
    model_used,
    tokens_estimated,
    created_at
  ) VALUES (
    p_auth_user_id,
    lower(trim(p_user_email)),
    left(COALESCE(NULLIF(trim(p_ip_address), ''), 'unknown'), 80),
    p_action_type,
    left(COALESCE(NULLIF(trim(p_model_used), ''), 'unknown'), 120),
    GREATEST(0, LEAST(COALESCE(p_tokens_estimated, 0), 100000)),
    v_now
  );

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining_today', GREATEST(0, v_daily_quota - v_day_count - 1),
    'used_last_minute', v_minute_count + 1,
    'daily_quota', v_daily_quota,
    'reason', NULL
  );
END;
$$;

REVOKE ALL ON FUNCTION public.consume_has_usage_quota(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_has_usage_quota(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER) TO service_role;
