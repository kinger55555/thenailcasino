-- Fix search_path for the trigger function
DROP FUNCTION IF EXISTS public.update_story_progress_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_story_progress_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_story_progress_timestamp
BEFORE UPDATE ON public.story_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_story_progress_updated_at();