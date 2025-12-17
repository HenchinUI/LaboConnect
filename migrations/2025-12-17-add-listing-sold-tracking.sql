-- Migration: Add sold listing tracking
-- Date: 2025-12-17
-- Purpose: Track sold listings, buyer information, and earnings

-- Alter listings table to add sold tracking columns
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS sold_to_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sold_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS listing_status VARCHAR(50) DEFAULT 'active'; -- active, sold, archived

-- Create sales_transactions table to track all sales
CREATE TABLE IF NOT EXISTS public.sales_transactions (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    seller_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    buyer_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    inquiry_id INTEGER REFERENCES public.inquiries(id) ON DELETE SET NULL,
    sale_price DECIMAL(12, 2) NOT NULL,
    sale_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_sales_seller_id ON public.sales_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_sales_buyer_id ON public.sales_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_sales_listing_id ON public.sales_transactions(listing_id);
CREATE INDEX IF NOT EXISTS idx_listings_sold_status ON public.listings(listing_status);
CREATE INDEX IF NOT EXISTS idx_listings_sold_to_user ON public.listings(sold_to_user_id);
