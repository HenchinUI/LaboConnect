-- Merge listing_admin and system_admin into a unified system_admin role
-- This migration combines listing approval and content management capabilities

-- Step 1: Update admin_roles table
-- Remove the old listing_admin role and update system_admin with combined capabilities
DELETE FROM public.admin_roles WHERE role_name = 'listing_admin';

UPDATE public.admin_roles 
SET description = 'Manages system content, approves property listings and success stories'
WHERE role_name = 'system_admin';

-- Step 2: Migrate all listing_admin users to system_admin role
UPDATE public.users 
SET admin_role = 'system_admin'
WHERE admin_role = 'listing_admin';

-- Step 3: Update role_permissions - remove old listing_admin permissions
DELETE FROM public.role_permissions 
WHERE admin_role = 'listing_admin';

-- Step 4: Add merged permissions to system_admin
-- Keep system_admin's existing content management permissions
-- Add listing and success story approval permissions
INSERT INTO public.role_permissions (admin_role, permission) VALUES
('system_admin', 'view_submitted_listings'),
('system_admin', 'approve_listings_initial'),
('system_admin', 'request_listing_revisions'),
('system_admin', 'add_listing_notes'),
('system_admin', 'view_listing_stats'),
('system_admin', 'reject_listings'),
('system_admin', 'approve_success_stories'),
('system_admin', 'reject_success_stories'),
('system_admin', 'edit_index_page'),
('system_admin', 'manage_page_content')
ON CONFLICT DO NOTHING;

-- Step 5: Update success_stories table - rename column to reflect new role
-- Rename listing_admin_notes to system_admin_notes
ALTER TABLE public.success_stories 
RENAME COLUMN listing_admin_notes TO system_admin_notes;

-- Rename approved_by_listing_admin_id to approved_by_system_admin_id
ALTER TABLE public.success_stories 
RENAME COLUMN approved_by_listing_admin_id TO approved_by_system_admin_id;

-- Step 6: Update status names in listing_approvals and success_stories tables
-- Replace 'listing_admin_approved' with 'system_admin_approved'
UPDATE public.listing_approvals 
SET listing_status = 'system_admin_approved'
WHERE listing_status = 'listing_admin_approved';

UPDATE public.success_stories 
SET status = 'system_admin_approved'
WHERE status = 'listing_admin_approved';

-- Step 7: Grant head_admin additional permissions to edit all approved business listings
INSERT INTO public.role_permissions (admin_role, permission) VALUES
('head_admin', 'edit_all_business_listings'),
('head_admin', 'publish_all_listings'),
('head_admin', 'create_system_admin')
ON CONFLICT DO NOTHING;

-- Step 8: Create indexes for better performance with merged role
CREATE INDEX IF NOT EXISTS idx_listing_approvals_system_admin ON public.listing_approvals(listing_status)
WHERE listing_status IN ('system_admin_approved', 'admin_approved');

CREATE INDEX IF NOT EXISTS idx_success_stories_system_admin ON public.success_stories(status)
WHERE status IN ('system_admin_approved', 'published');
