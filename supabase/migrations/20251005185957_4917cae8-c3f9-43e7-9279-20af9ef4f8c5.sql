-- Create table for tracking dream points deductions
CREATE TABLE public.dream_points_deductions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dream_points_deductions ENABLE ROW LEVEL SECURITY;

-- Anyone can view for admin stats
CREATE POLICY "Anyone can view deductions"
ON public.dream_points_deductions
FOR SELECT
USING (true);

-- Users can insert own deductions
CREATE POLICY "Users can insert own deductions"
ON public.dream_points_deductions
FOR INSERT
WITH CHECK (auth.uid() = user_id);