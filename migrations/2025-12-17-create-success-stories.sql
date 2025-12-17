-- Create success_stories table for investor success case studies
CREATE TABLE IF NOT EXISTS public.success_stories (
  id SERIAL PRIMARY KEY,
  investor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  image_url TEXT,
  location VARCHAR(255) NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  business_type VARCHAR(100) NOT NULL,
  established_year INTEGER,
  key_achievement TEXT,
  contact_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending, listing_admin_approved, approved, rejected
  listing_admin_notes TEXT,
  head_admin_notes TEXT,
  approved_by_listing_admin_id INTEGER REFERENCES users(id),
  approved_by_head_admin_id INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_success_stories_investor_id ON public.success_stories(investor_id);
CREATE INDEX idx_success_stories_listing_id ON public.success_stories(listing_id);
CREATE INDEX idx_success_stories_status ON public.success_stories(status);
CREATE INDEX idx_success_stories_created_at ON public.success_stories(created_at DESC);
