-- Add new columns to users table for the role-based admin system
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS admin_role VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS verified_by INTEGER,
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS id_document_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS id_document_verified BOOLEAN DEFAULT FALSE;

-- Create admin_roles table to define role capabilities
CREATE TABLE IF NOT EXISTS public.admin_roles (
    id INTEGER PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert admin roles
INSERT INTO public.admin_roles (id, role_name, display_name, description) VALUES
(1, 'head_admin', 'Head Admin', 'Full system access and final approval authority'),
(2, 'listing_admin', 'Listing Admin', 'Reviews and approves property listings'),
(3, 'verification_admin', 'Verification Admin', 'Verifies and validates user identities'),
(4, 'business', 'Business User', 'Regular user who can submit listings once verified')
ON CONFLICT DO NOTHING;

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id SERIAL PRIMARY KEY,
    admin_role VARCHAR(50) NOT NULL,
    permission VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(admin_role, permission)
);

-- Insert permissions for each role
INSERT INTO public.role_permissions (admin_role, permission) VALUES
-- Head Admin permissions
('head_admin', 'view_all_listings'),
('head_admin', 'approve_listings_final'),
('head_admin', 'reject_listings'),
('head_admin', 'manage_admins'),
('head_admin', 'view_all_verifications'),
('head_admin', 'override_decisions'),
('head_admin', 'view_audit_logs'),
('head_admin', 'generate_reports'),
('head_admin', 'configure_system'),

-- Listing Admin permissions
('listing_admin', 'view_submitted_listings'),
('listing_admin', 'approve_listings_initial'),
('listing_admin', 'request_listing_revisions'),
('listing_admin', 'add_listing_notes'),
('listing_admin', 'view_listing_stats'),

-- Verification Admin permissions
('verification_admin', 'view_verification_queue'),
('verification_admin', 'verify_user_identity'),
('verification_admin', 'review_id_documents'),
('verification_admin', 'send_verification_otp'),
('verification_admin', 'view_verification_history'),
('verification_admin', 'approve_verified_users'),

-- Business User permissions
('business', 'view_own_listings'),
('business', 'submit_listings'),
('business', 'edit_own_profile'),
('business', 'view_own_verification_status')
ON CONFLICT DO NOTHING;

-- Create verification_requests table
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, otp_sent, otp_verified, document_verified, approved, rejected
    phone_number VARCHAR(20) NOT NULL,
    id_document_url VARCHAR(255),
    otp_code VARCHAR(6),
    otp_sent_at TIMESTAMP,
    otp_verified_at TIMESTAMP,
    otp_attempts INTEGER DEFAULT 0,
    verified_by INTEGER REFERENCES public.users(id),
    verified_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create listing_approvals table to track approval workflow
CREATE TABLE IF NOT EXISTS public.listing_approvals (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    listing_status VARCHAR(50) DEFAULT 'submitted', -- submitted, admin_approved, head_admin_pending, published, rejected
    submitted_at TIMESTAMP DEFAULT NOW(),
    submitted_by INTEGER NOT NULL REFERENCES public.users(id),
    admin_approved_at TIMESTAMP,
    admin_approved_by INTEGER REFERENCES public.users(id),
    admin_notes TEXT,
    head_admin_approved_at TIMESTAMP,
    head_admin_approved_by INTEGER REFERENCES public.users(id),
    head_admin_notes TEXT,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create audit_logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES public.users(id),
    action VARCHAR(100) NOT NULL,
    target_table VARCHAR(50),
    target_id INTEGER,
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_admin_role ON public.users(admin_role);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON public.users(is_verified);
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON public.verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_listing_approvals_listing_id ON public.listing_approvals(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_approvals_listing_status ON public.listing_approvals(listing_status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
