/*
# Add private contact-form rate limiting

1. New Tables
- `contact_rate_limits` stores only a hashed request identifier, window start, count, and update time. It never stores names, email addresses, subjects, or message contents.

2. New Functions
- `consume_contact_rate_limit` atomically increments a short-lived request counter and reports whether the request is within the limit.

3. Security
- Row level security is enabled on the table.
- No browser role can access the table or function.
- The Edge Function's service role is granted only the access needed for server-side rate limiting.
- The function uses a fixed search path and is not callable by anon or authenticated users.

4. Important Notes
- The rate limiter is a privacy-preserving abuse-control measure, not a message archive.
- Counters are retained only as needed for the active rate-limit window and may be cleaned up by a future maintenance job.
*/

CREATE TABLE IF NOT EXISTS public.contact_rate_limits (
  identifier text PRIMARY KEY,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.contact_rate_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.contact_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.consume_contact_rate_limit(
  p_identifier text,
  p_window_seconds integer DEFAULT 600,
  p_max_requests integer DEFAULT 5
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_window timestamptz := now();
  accepted boolean;
BEGIN
  INSERT INTO public.contact_rate_limits (identifier, window_started_at, request_count, updated_at)
  VALUES (p_identifier, current_window, 1, current_window)
  ON CONFLICT (identifier) DO UPDATE
  SET
    window_started_at = CASE
      WHEN EXTRACT(EPOCH FROM (current_window - contact_rate_limits.window_started_at)) >= p_window_seconds THEN current_window
      ELSE contact_rate_limits.window_started_at
    END,
    request_count = CASE
      WHEN EXTRACT(EPOCH FROM (current_window - contact_rate_limits.window_started_at)) >= p_window_seconds THEN 1
      ELSE contact_rate_limits.request_count + 1
    END,
    updated_at = current_window;

  SELECT request_count <= p_max_requests
  INTO accepted
  FROM public.contact_rate_limits
  WHERE identifier = p_identifier;

  RETURN accepted;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_contact_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_contact_rate_limit(text, integer, integer) TO service_role;
