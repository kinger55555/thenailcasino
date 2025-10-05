-- Create story progress table
CREATE TABLE public.story_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  current_location text NOT NULL DEFAULT 'awakening',
  defeated_bosses text[] DEFAULT '{}',
  unlocked_abilities text[] DEFAULT '{}',
  visited_locations text[] DEFAULT ARRAY['awakening'],
  has_void_heart boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.story_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own story progress"
ON public.story_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own story progress"
ON public.story_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own story progress"
ON public.story_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_story_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_story_progress_timestamp
BEFORE UPDATE ON public.story_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_story_progress_updated_at();