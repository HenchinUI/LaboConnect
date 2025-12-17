-- Add category field to success_stories table
ALTER TABLE public.success_stories ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'retail';

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_success_stories_category ON public.success_stories(category);
