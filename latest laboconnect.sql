--
-- PostgreSQL database dump
--

\restrict 8e9gaR44nSL6pyORLIyNZY5THk2UJMEhzLG30KTjIlmBM4itJdIF6bGNXq3FfA6

-- Dumped from database version 18.1 (Debian 18.1-1.pgdg12+2)
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.verification_requests DROP CONSTRAINT IF EXISTS verification_requests_verified_by_fkey;
ALTER TABLE IF EXISTS ONLY public.verification_requests DROP CONSTRAINT IF EXISTS verification_requests_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sales_transactions DROP CONSTRAINT IF EXISTS sales_transactions_seller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sales_transactions DROP CONSTRAINT IF EXISTS sales_transactions_listing_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sales_transactions DROP CONSTRAINT IF EXISTS sales_transactions_inquiry_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sales_transactions DROP CONSTRAINT IF EXISTS sales_transactions_buyer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.listings DROP CONSTRAINT IF EXISTS listings_sold_to_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.listing_approvals DROP CONSTRAINT IF EXISTS listing_approvals_submitted_by_fkey;
ALTER TABLE IF EXISTS ONLY public.listing_approvals DROP CONSTRAINT IF EXISTS listing_approvals_listing_id_fkey;
ALTER TABLE IF EXISTS ONLY public.listing_approvals DROP CONSTRAINT IF EXISTS listing_approvals_head_admin_approved_by_fkey;
ALTER TABLE IF EXISTS ONLY public.listing_approvals DROP CONSTRAINT IF EXISTS listing_approvals_admin_approved_by_fkey;
ALTER TABLE IF EXISTS ONLY public.user_listings DROP CONSTRAINT IF EXISTS fk_user_listings_user_id_users;
ALTER TABLE IF EXISTS ONLY public.user_listings DROP CONSTRAINT IF EXISTS fk_user_listings_listing_id_listings;
ALTER TABLE IF EXISTS ONLY public.uploads_meta DROP CONSTRAINT IF EXISTS fk_uploads_meta_listing_id_listings;
ALTER TABLE IF EXISTS ONLY public.notification_preferences DROP CONSTRAINT IF EXISTS fk_notification_prefs_user_id_users;
ALTER TABLE IF EXISTS ONLY public.listings DROP CONSTRAINT IF EXISTS fk_listings_owner_id_users;
ALTER TABLE IF EXISTS ONLY public.inquiries DROP CONSTRAINT IF EXISTS fk_inquiries_owner_id_users;
ALTER TABLE IF EXISTS ONLY public.inquiries DROP CONSTRAINT IF EXISTS fk_inquiries_listing_id_listings;
ALTER TABLE IF EXISTS ONLY public.email_logs DROP CONSTRAINT IF EXISTS fk_email_logs_user_id_users;
ALTER TABLE IF EXISTS ONLY public.email_logs DROP CONSTRAINT IF EXISTS fk_email_logs_inquiry_id_inquiries;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_admin_id_fkey;
DROP INDEX IF EXISTS public.idx_verification_requests_user_id;
DROP INDEX IF EXISTS public.idx_verification_requests_status;
DROP INDEX IF EXISTS public.idx_users_verification_code;
DROP INDEX IF EXISTS public.idx_users_user_type;
DROP INDEX IF EXISTS public.idx_users_is_verified;
DROP INDEX IF EXISTS public.idx_users_admin_role;
DROP INDEX IF EXISTS public.idx_sales_seller_id;
DROP INDEX IF EXISTS public.idx_sales_listing_id;
DROP INDEX IF EXISTS public.idx_sales_buyer_id;
DROP INDEX IF EXISTS public.idx_messages_inquiry_id;
DROP INDEX IF EXISTS public.idx_locations_coordinates;
DROP INDEX IF EXISTS public.idx_listings_status;
DROP INDEX IF EXISTS public.idx_listings_sold_to_user;
DROP INDEX IF EXISTS public.idx_listings_sold_status;
DROP INDEX IF EXISTS public.idx_listings_longitude;
DROP INDEX IF EXISTS public.idx_listings_latitude;
DROP INDEX IF EXISTS public.idx_listings_created_at;
DROP INDEX IF EXISTS public.idx_listings_approved;
DROP INDEX IF EXISTS public.idx_listing_approvals_listing_status;
DROP INDEX IF EXISTS public.idx_listing_approvals_listing_id;
DROP INDEX IF EXISTS public.idx_audit_logs_created_at;
DROP INDEX IF EXISTS public.idx_audit_logs_admin_id;
DROP INDEX IF EXISTS public."IDX_session_expire";
ALTER TABLE IF EXISTS ONLY public.verification_requests DROP CONSTRAINT IF EXISTS verification_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.user_listings DROP CONSTRAINT IF EXISTS user_listings_user_id_listing_id_key;
ALTER TABLE IF EXISTS ONLY public.user_listings DROP CONSTRAINT IF EXISTS user_listings_pkey;
ALTER TABLE IF EXISTS ONLY public.uploads_meta DROP CONSTRAINT IF EXISTS uploads_meta_pkey;
ALTER TABLE IF EXISTS ONLY public.session DROP CONSTRAINT IF EXISTS session_pkey;
ALTER TABLE IF EXISTS ONLY public.sales_transactions DROP CONSTRAINT IF EXISTS sales_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_admin_role_permission_key;
ALTER TABLE IF EXISTS ONLY public.notification_preferences DROP CONSTRAINT IF EXISTS notification_preferences_user_id_key;
ALTER TABLE IF EXISTS ONLY public.notification_preferences DROP CONSTRAINT IF EXISTS notification_preferences_pkey;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_pkey;
ALTER TABLE IF EXISTS ONLY public.locations DROP CONSTRAINT IF EXISTS locations_pkey;
ALTER TABLE IF EXISTS ONLY public.listings DROP CONSTRAINT IF EXISTS listings_pkey;
ALTER TABLE IF EXISTS ONLY public.listing_notifications DROP CONSTRAINT IF EXISTS listing_notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.listing_approvals DROP CONSTRAINT IF EXISTS listing_approvals_pkey;
ALTER TABLE IF EXISTS ONLY public.inquiries DROP CONSTRAINT IF EXISTS inquiries_pkey;
ALTER TABLE IF EXISTS ONLY public.email_logs DROP CONSTRAINT IF EXISTS email_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.economic_data DROP CONSTRAINT IF EXISTS economic_data_pkey;
ALTER TABLE IF EXISTS ONLY public.economic_data DROP CONSTRAINT IF EXISTS economic_data_key_key;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.admin_tokens DROP CONSTRAINT IF EXISTS admin_tokens_token_key;
ALTER TABLE IF EXISTS ONLY public.admin_tokens DROP CONSTRAINT IF EXISTS admin_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.admin_roles DROP CONSTRAINT IF EXISTS admin_roles_role_name_key;
ALTER TABLE IF EXISTS ONLY public.admin_roles DROP CONSTRAINT IF EXISTS admin_roles_pkey;
ALTER TABLE IF EXISTS public.verification_requests ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.user_listings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.uploads_meta ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sales_transactions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.role_permissions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.notification_preferences ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.messages ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.locations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.listings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.listing_notifications ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.listing_approvals ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.inquiries ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.email_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.economic_data ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.audit_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.admin_tokens ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.verification_requests_id_seq;
DROP TABLE IF EXISTS public.verification_requests;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.user_listings_id_seq;
DROP TABLE IF EXISTS public.user_listings;
DROP SEQUENCE IF EXISTS public.uploads_meta_id_seq;
DROP TABLE IF EXISTS public.uploads_meta;
DROP TABLE IF EXISTS public.session;
DROP SEQUENCE IF EXISTS public.sales_transactions_id_seq;
DROP TABLE IF EXISTS public.sales_transactions;
DROP SEQUENCE IF EXISTS public.role_permissions_id_seq;
DROP TABLE IF EXISTS public.role_permissions;
DROP SEQUENCE IF EXISTS public.notification_preferences_id_seq;
DROP TABLE IF EXISTS public.notification_preferences;
DROP SEQUENCE IF EXISTS public.messages_id_seq;
DROP TABLE IF EXISTS public.messages;
DROP SEQUENCE IF EXISTS public.locations_id_seq;
DROP TABLE IF EXISTS public.locations;
DROP SEQUENCE IF EXISTS public.listings_id_seq;
DROP TABLE IF EXISTS public.listings;
DROP SEQUENCE IF EXISTS public.listing_notifications_id_seq;
DROP TABLE IF EXISTS public.listing_notifications;
DROP SEQUENCE IF EXISTS public.listing_approvals_id_seq;
DROP TABLE IF EXISTS public.listing_approvals;
DROP SEQUENCE IF EXISTS public.inquiries_id_seq;
DROP TABLE IF EXISTS public.inquiries;
DROP SEQUENCE IF EXISTS public.email_logs_id_seq;
DROP TABLE IF EXISTS public.email_logs;
DROP SEQUENCE IF EXISTS public.economic_data_id_seq;
DROP TABLE IF EXISTS public.economic_data;
DROP SEQUENCE IF EXISTS public.audit_logs_id_seq;
DROP TABLE IF EXISTS public.audit_logs;
DROP SEQUENCE IF EXISTS public.admin_tokens_id_seq;
DROP TABLE IF EXISTS public.admin_tokens;
DROP TABLE IF EXISTS public.admin_roles;
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_roles (
    id integer NOT NULL,
    role_name character varying(50) NOT NULL,
    display_name character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: admin_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_tokens (
    id integer NOT NULL,
    token text NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    expires_at timestamp without time zone,
    used boolean DEFAULT false,
    used_by integer,
    used_at timestamp without time zone
);


--
-- Name: admin_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_tokens_id_seq OWNED BY public.admin_tokens.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    admin_id integer NOT NULL,
    action character varying(100) NOT NULL,
    target_table character varying(50),
    target_id integer,
    old_value text,
    new_value text,
    ip_address character varying(50),
    user_agent text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: economic_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.economic_data (
    id integer NOT NULL,
    key text NOT NULL,
    value text,
    label text,
    icon text,
    updated_at timestamp without time zone DEFAULT now(),
    updated_by integer
);


--
-- Name: economic_data_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.economic_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: economic_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.economic_data_id_seq OWNED BY public.economic_data.id;


--
-- Name: email_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_logs (
    id integer NOT NULL,
    user_id integer,
    inquiry_id integer,
    email_address text,
    subject text,
    status text DEFAULT 'pending'::text,
    sent_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: email_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_logs_id_seq OWNED BY public.email_logs.id;


--
-- Name: inquiries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inquiries (
    id integer NOT NULL,
    listing_id integer,
    contact_number text,
    email text,
    company text,
    message text,
    owner_id integer,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    sender_user_id integer,
    full_name text
);


--
-- Name: inquiries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inquiries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inquiries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inquiries_id_seq OWNED BY public.inquiries.id;


--
-- Name: listing_approvals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listing_approvals (
    id integer NOT NULL,
    listing_id integer NOT NULL,
    listing_status character varying(50) DEFAULT 'submitted'::character varying,
    submitted_at timestamp without time zone DEFAULT now(),
    submitted_by integer NOT NULL,
    admin_approved_at timestamp without time zone,
    admin_approved_by integer,
    admin_notes text,
    head_admin_approved_at timestamp without time zone,
    head_admin_approved_by integer,
    head_admin_notes text,
    rejected_at timestamp without time zone,
    rejection_reason text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: listing_approvals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.listing_approvals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: listing_approvals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.listing_approvals_id_seq OWNED BY public.listing_approvals.id;


--
-- Name: listing_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listing_notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    listing_id integer NOT NULL,
    listing_title text,
    status text,
    reason text,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: listing_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.listing_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: listing_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.listing_notifications_id_seq OWNED BY public.listing_notifications.id;


--
-- Name: listings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listings (
    id integer NOT NULL,
    owner_first_name character varying(100) NOT NULL,
    owner_last_name character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    type character varying(50) NOT NULL,
    size_sqm numeric(10,2),
    price numeric(12,2),
    oct_tct_url character varying(500),
    tax_declaration_url character varying(500),
    doas_url character varying(500),
    government_id_url character varying(500),
    image_url character varying(500),
    approved boolean DEFAULT false,
    status character varying(50) DEFAULT 'pending'::character varying,
    views integer DEFAULT 0,
    inquiries integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    latitude numeric(10,6),
    longitude numeric(10,6),
    owner_id integer,
    rejection_reason text,
    owner_name character varying(255),
    sold_to_user_id integer,
    sold_date timestamp without time zone,
    listing_status character varying(50) DEFAULT 'active'::character varying
);


--
-- Name: listings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.listings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: listings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.listings_id_seq OWNED BY public.listings.id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.locations (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    type character varying(100),
    latitude numeric(10,6) NOT NULL,
    longitude numeric(10,6) NOT NULL,
    price numeric(10,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    inquiry_id integer NOT NULL,
    sender_user_id integer,
    sender_name text,
    sender_email text,
    body text,
    attachment_stored text,
    attachment_original text,
    is_read boolean DEFAULT false,
    deleted boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_preferences (
    id integer NOT NULL,
    user_id integer NOT NULL,
    email_new_inquiry boolean DEFAULT true,
    email_digest boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: notification_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notification_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notification_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notification_preferences_id_seq OWNED BY public.notification_preferences.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    admin_role character varying(50) NOT NULL,
    permission character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- Name: sales_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_transactions (
    id integer NOT NULL,
    listing_id integer NOT NULL,
    seller_id integer NOT NULL,
    buyer_id integer NOT NULL,
    inquiry_id integer,
    sale_price numeric(12,2) NOT NULL,
    sale_date timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: sales_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sales_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sales_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sales_transactions_id_seq OWNED BY public.sales_transactions.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


--
-- Name: uploads_meta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.uploads_meta (
    id integer NOT NULL,
    listing_id integer,
    field_name text,
    stored_filename text,
    original_filename text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: uploads_meta_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.uploads_meta_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: uploads_meta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.uploads_meta_id_seq OWNED BY public.uploads_meta.id;


--
-- Name: user_listings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_listings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    listing_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: user_listings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_listings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_listings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_listings_id_seq OWNED BY public.user_listings.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'user'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    contact_number text,
    bio text,
    profile_picture_url text,
    admin_role character varying(50) DEFAULT NULL::character varying,
    is_verified boolean DEFAULT false,
    verification_status character varying(20) DEFAULT 'unverified'::character varying,
    verified_at timestamp without time zone,
    verified_by integer,
    phone_number character varying(20),
    id_document_url character varying(255),
    id_document_verified boolean DEFAULT false,
    user_type character varying(50) DEFAULT 'business'::character varying,
    email_verified boolean DEFAULT false,
    verification_code character varying(6),
    verification_code_expiry timestamp without time zone
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: verification_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification_requests (
    id integer NOT NULL,
    user_id integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    phone_number character varying(20) NOT NULL,
    id_document_url character varying(255),
    otp_code character varying(6),
    otp_sent_at timestamp without time zone,
    otp_verified_at timestamp without time zone,
    otp_attempts integer DEFAULT 0,
    verified_by integer,
    verified_at timestamp without time zone,
    rejection_reason text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: verification_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.verification_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: verification_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.verification_requests_id_seq OWNED BY public.verification_requests.id;


--
-- Name: admin_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_tokens ALTER COLUMN id SET DEFAULT nextval('public.admin_tokens_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: economic_data id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.economic_data ALTER COLUMN id SET DEFAULT nextval('public.economic_data_id_seq'::regclass);


--
-- Name: email_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs ALTER COLUMN id SET DEFAULT nextval('public.email_logs_id_seq'::regclass);


--
-- Name: inquiries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiries ALTER COLUMN id SET DEFAULT nextval('public.inquiries_id_seq'::regclass);


--
-- Name: listing_approvals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_approvals ALTER COLUMN id SET DEFAULT nextval('public.listing_approvals_id_seq'::regclass);


--
-- Name: listing_notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_notifications ALTER COLUMN id SET DEFAULT nextval('public.listing_notifications_id_seq'::regclass);


--
-- Name: listings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listings ALTER COLUMN id SET DEFAULT nextval('public.listings_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: notification_preferences id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences ALTER COLUMN id SET DEFAULT nextval('public.notification_preferences_id_seq'::regclass);


--
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- Name: sales_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_transactions ALTER COLUMN id SET DEFAULT nextval('public.sales_transactions_id_seq'::regclass);


--
-- Name: uploads_meta id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uploads_meta ALTER COLUMN id SET DEFAULT nextval('public.uploads_meta_id_seq'::regclass);


--
-- Name: user_listings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_listings ALTER COLUMN id SET DEFAULT nextval('public.user_listings_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: verification_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_requests ALTER COLUMN id SET DEFAULT nextval('public.verification_requests_id_seq'::regclass);


--
-- Data for Name: admin_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_roles (id, role_name, display_name, description, created_at) FROM stdin;
1	head_admin	Head Admin	Full system access and final approval authority	2025-12-15 17:54:35.089302
2	listing_admin	Listing Admin	Reviews and approves property listings	2025-12-15 17:54:35.089302
3	verification_admin	Verification Admin	Verifies and validates user identities	2025-12-15 17:54:35.089302
5	system_admin	System Admin	Manages website content and customization	2025-12-15 21:07:38.165619
\.


--
-- Data for Name: admin_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_tokens (id, token, created_by, created_at, expires_at, used, used_by, used_at) FROM stdin;
1	489736bec97349cc025f511f1f426b56c32ba721	10	2025-12-09 11:27:38.129639	\N	f	\N	\N
2	a1dcc1c102b94a34fb6d4e3e46f3cd81f136ebf8	10	2025-12-11 02:42:49.661096	\N	t	25	2025-12-11 02:43:50.23676
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, admin_id, action, target_table, target_id, old_value, new_value, ip_address, user_agent, created_at) FROM stdin;
1	28	created_admin_user	users	29	\N	listing_admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-15 18:24:15.004834
2	28	created_admin_user	users	30	\N	verification_admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-15 18:24:46.698479
3	30	rejected_verification	verification_requests	4	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-15 19:37:23.587164
4	30	rejected_verification	verification_requests	5	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-15 19:37:25.921234
5	30	rejected_verification	verification_requests	6	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-15 19:37:27.018182
6	30	rejected_verification	verification_requests	7	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-15 19:37:28.073256
7	30	rejected_verification	verification_requests	8	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-15 19:37:29.033279
8	30	rejected_verification	verification_requests	9	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-15 19:37:29.970708
9	30	rejected_verification	verification_requests	10	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-15 19:37:30.969517
10	30	rejected_verification	verification_requests	11	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-15 19:37:32.083714
11	30	rejected_verification	verification_requests	12	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-15 19:37:33.121289
12	30	rejected_verification	verification_requests	13	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-15 19:37:34.263934
13	30	rejected_verification	verification_requests	14	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-15 19:37:35.413385
14	30	rejected_verification	verification_requests	15	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-15 19:37:37.001874
15	30	rejected_verification	verification_requests	16	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-15 19:37:40.656049
16	30	approved_verification	verification_requests	18	\N	approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-15 20:39:45.023704
17	28	created_admin_user	users	34	\N	system_admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-15 21:08:35.67424
18	34	updated_index_content	website_content	\N	\N	index.html updated	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-15 21:13:22.701845
19	34	updated_index_content	website_content	\N	\N	index.html updated	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-15 21:27:38.015329
20	30	approved_verification	verification_requests	19	\N	approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-16 20:00:25.094132
21	30	approved_verification	verification_requests	20	\N	approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-16 20:30:25.033275
22	30	approved_verification	verification_requests	20	\N	approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-16 20:30:25.388447
\.


--
-- Data for Name: economic_data; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.economic_data (id, key, value, label, icon, updated_at, updated_by) FROM stdin;
5	business_distribution	[30,45,15,8,2]	Business Distribution by Sector	🏢	2025-12-10 15:49:38.563197	10
1	population	108,319	population		2025-12-10 15:57:06.275845	10
9	businesses	960	businesses		2025-12-10 15:57:06.392657	10
10	business_change	18.08% increase	business_change		2025-12-10 15:57:06.710351	10
2	population_data	[101082,109245,108319,0,0]	Population Growth Trend	📊	2025-12-10 15:58:11.075343	10
\.


--
-- Data for Name: email_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_logs (id, user_id, inquiry_id, email_address, subject, status, sent_at, created_at) FROM stdin;
15	\N	\N	business2@gmail.com	Your Listing was Rejected: business2	pending	\N	2025-12-16 20:49:57.210287
16	\N	\N	business2@gmail.com	Your Listing was Rejected: add	pending	\N	2025-12-16 20:54:55.196051
\.


--
-- Data for Name: inquiries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inquiries (id, listing_id, contact_number, email, company, message, owner_id, is_read, created_at, sender_user_id, full_name) FROM stdin;
\.


--
-- Data for Name: listing_approvals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.listing_approvals (id, listing_id, listing_status, submitted_at, submitted_by, admin_approved_at, admin_approved_by, admin_notes, head_admin_approved_at, head_admin_approved_by, head_admin_notes, rejected_at, rejection_reason, created_at, updated_at) FROM stdin;
1	15	submitted	2025-12-16 21:02:40.693851	33	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-16 21:02:40.693851	2025-12-16 21:02:40.693851
\.


--
-- Data for Name: listing_notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.listing_notifications (id, user_id, listing_id, listing_title, status, reason, is_read, created_at) FROM stdin;
9	22	8	bahay ni juswa	approved	\N	f	2025-12-10 15:58:23.044084
12	22	8	bahay ni juswa	rejected	Violates platform terms and conditions	f	2025-12-10 17:35:43.646414
20	12	11	Residential Lot w/ Title	rejected	Violates platform terms and conditions	f	2025-12-11 02:33:53.403269
21	33	12	business2	approved	\N	f	2025-12-15 20:47:42.44132
22	33	13	add	approved	\N	f	2025-12-16 20:49:49.363194
23	33	12	business2	rejected	Violates platform terms and conditions	f	2025-12-16 20:49:57.088501
24	33	13	add	rejected	Incomplete or missing required documents	f	2025-12-16 20:54:55.071297
\.


--
-- Data for Name: listings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.listings (id, owner_first_name, owner_last_name, title, description, type, size_sqm, price, oct_tct_url, tax_declaration_url, doas_url, government_id_url, image_url, approved, status, views, inquiries, created_at, updated_at, latitude, longitude, owner_id, rejection_reason, owner_name, sold_to_user_id, sold_date, listing_status) FROM stdin;
15	nww	nww	new	aasdsad	For Lease	123.00	100000.00	/uploads/1765918960516-c91iur.jpg	/uploads/1765918960520-u9ry13.jpg	\N	\N	/uploads/1765918960511-v8nhsg.jpg	f	pending	0	0	2025-12-17 05:02:40.615	2025-12-17 05:02:40.615	14.142583	122.809982	33	\N	\N	\N	\N	active
14	business2	business2	business2	12313	For Lease	111.00	100000.00	/uploads/1765918745994-nsxwlc.pdf	/uploads/1765918746013-plgbu0.jpg	\N	\N	/uploads/1765918745986-j1m18i.jpg	f	pending	0	0	2025-12-17 04:59:06.106	2025-12-17 04:59:06.106	14.151734	122.834530	33	\N	\N	\N	\N	active
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.locations (id, title, description, type, latitude, longitude, price, created_at, updated_at) FROM stdin;
1	LABO J&F MALL	\N	Business	14.153368	122.826967	0.00	2025-12-10 17:24:40.916331	2025-12-10 17:24:40.916331
2	Maria Fatima Farm Resort	\N	Resort	14.135556	122.846117	0.00	2025-12-10 20:01:05.030253	2025-12-10 20:01:05.030253
3	MR. DIY LABO	\N	Business	14.155754	122.829463	0.00	2025-12-10 20:02:30.652403	2025-12-10 20:02:30.652403
4	LCC LABO	\N	Business	14.154012	122.829090	0.00	2025-12-10 20:02:54.648282	2025-12-10 20:02:54.648282
5	Villa Asuncion	\N	Resort	14.139489	122.768440	0.00	2025-12-10 20:05:04.024362	2025-12-10 20:05:04.024362
6	HutSpot	\N	Hotel & Restaurant	14.092188	122.786658	0.00	2025-12-10 20:06:28.15826	2025-12-10 20:06:28.15826
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.messages (id, inquiry_id, sender_user_id, sender_name, sender_email, body, attachment_stored, attachment_original, is_read, deleted, created_at) FROM stdin;
\.


--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_preferences (id, user_id, email_new_inquiry, email_digest, created_at) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (id, admin_role, permission, created_at) FROM stdin;
1	head_admin	view_all_listings	2025-12-15 17:54:35.089302
2	head_admin	approve_listings_final	2025-12-15 17:54:35.089302
3	head_admin	reject_listings	2025-12-15 17:54:35.089302
4	head_admin	create_head_admin	2025-12-15 17:54:35.089302
5	head_admin	create_listing_admin	2025-12-15 17:54:35.089302
6	head_admin	create_verification_admin	2025-12-15 17:54:35.089302
7	head_admin	view_all_verifications	2025-12-15 17:54:35.089302
8	head_admin	override_decisions	2025-12-15 17:54:35.089302
9	head_admin	view_audit_logs	2025-12-15 17:54:35.089302
10	head_admin	configure_system	2025-12-15 17:54:35.089302
11	listing_admin	view_submitted_listings	2025-12-15 17:54:35.089302
12	listing_admin	approve_listings_initial	2025-12-15 17:54:35.089302
13	listing_admin	reject_listings	2025-12-15 17:54:35.089302
14	listing_admin	create_listing_admin	2025-12-15 17:54:35.089302
15	listing_admin	add_listing_notes	2025-12-15 17:54:35.089302
16	listing_admin	view_listing_stats	2025-12-15 17:54:35.089302
17	verification_admin	view_verification_queue	2025-12-15 17:54:35.089302
18	verification_admin	verify_user_identity	2025-12-15 17:54:35.089302
19	verification_admin	review_id_documents	2025-12-15 17:54:35.089302
20	verification_admin	send_verification_otp	2025-12-15 17:54:35.089302
21	verification_admin	create_verification_admin	2025-12-15 17:54:35.089302
22	verification_admin	approve_verified_users	2025-12-15 17:54:35.089302
\.


--
-- Data for Name: sales_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales_transactions (id, listing_id, seller_id, buyer_id, inquiry_id, sale_price, sale_date, created_at) FROM stdin;
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session (sid, sess, expire) FROM stdin;
TPj9Co8IlvWfaQF5Q4oiiM_oMN0_WGSd	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T17:49:52.018Z","secure":true,"httpOnly":true,"path":"/"},"user":{"id":10,"username":"admind","email":"admind@gmail.com","role":"admin"}}	2025-12-11 17:49:53
MzVG5dIrrlukUArr-Qh-J36us5z_dB4z	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T17:49:59.311Z","secure":true,"httpOnly":true,"path":"/"},"user":{"id":22,"username":"Godwin Galvez","email":"godwingalvez26@gmail.com","role":"business"}}	2025-12-11 17:50:00
lfOGbT3KYgBjr2GU539VCVWCIcPOQUVw	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T17:50:15.314Z","secure":true,"httpOnly":true,"path":"/"},"user":{"id":10,"username":"admind","email":"admind@gmail.com","role":"admin"}}	2025-12-11 17:50:16
XC-f2vXnmm3Z1iNBDX7bDYAcBgCclG42	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T17:50:31.914Z","secure":true,"httpOnly":true,"path":"/"},"user":{"id":10,"username":"admind","email":"admind@gmail.com","role":"admin"}}	2025-12-11 17:50:32
rG7F9EpIrAz5oViOJaNsPAV6zf1056zE	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T17:51:31.620Z","secure":true,"httpOnly":true,"path":"/"},"user":{"id":12,"username":"user1","email":"user1@gmail.com","role":"business"}}	2025-12-11 17:51:32
VqcmzFb2HqL0qDZjjv3QaeDe6mLpPoD5	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T17:51:33.120Z","secure":true,"httpOnly":true,"path":"/"},"user":{"id":12,"username":"user1","email":"user1@gmail.com","role":"business"}}	2025-12-11 17:51:34
6vMU0_V-A6bQ9eBsBm-PA0osMhOiNgYD	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T17:51:33.422Z","secure":true,"httpOnly":true,"path":"/"},"user":{"id":12,"username":"user1","email":"user1@gmail.com","role":"business"}}	2025-12-11 17:51:34
YhzhMyJ-sj9ajO9O5C2UajWMD0XN8ltB	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T17:51:33.422Z","secure":true,"httpOnly":true,"path":"/"},"user":{"id":12,"username":"user1","email":"user1@gmail.com","role":"business"}}	2025-12-11 17:51:34
JGrGlyYgq0SsoPcAXpkw8jL5bDkZr6LL	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T17:51:34.013Z","secure":true,"httpOnly":true,"path":"/"},"user":{"id":12,"username":"user1","email":"user1@gmail.com","role":"business"}}	2025-12-11 17:51:35
r7zYqVie3IQSpvUjp8sfdKJrIdmVFUCv	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:19:46.536Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:19:47
QMFOoVnqtf9VV8h4FAWJjwe10lBOj8ay	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T17:52:25.121Z","secure":true,"httpOnly":true,"path":"/"},"user":{"id":12,"username":"user1","email":"user1@gmail.com","role":"business"}}	2025-12-11 17:52:26
M7mFBBIA2ASMsr3KY85BnU8YA_wnhCxr	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T17:55:45.301Z","secure":true,"httpOnly":true,"path":"/"},"user":{"id":10,"username":"admind","email":"admind@gmail.com","role":"admin"}}	2025-12-11 17:55:46
G-VujLqPbpsrog91C6v_L2eISyBckeSs	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T17:56:51.398Z","secure":true,"httpOnly":true,"path":"/"},"user":{"id":12,"username":"user1","email":"user1@gmail.com","role":"business"}}	2025-12-11 17:56:52
cMOSRVIlIAUEdRqA1GJzfD47bTnucbQY	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:00:55.655Z","secure":true,"httpOnly":true,"path":"/"},"user":{"id":10,"username":"admind","email":"admind@gmail.com","role":"admin"}}	2025-12-11 18:00:56
2igxf1B_6m5LccRIBof28sdSUsDKYGkF	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:01:09.662Z","secure":true,"httpOnly":true,"path":"/"},"user":{"id":12,"username":"user1","email":"user1@gmail.com","role":"business"}}	2025-12-11 18:01:10
zM_GzRAhQKXGfgdSlZmZWfW5B5_LsCzD	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:01:51.660Z","secure":true,"httpOnly":true,"path":"/"},"user":{"id":12,"username":"user1","email":"user1@gmail.com","role":"business"}}	2025-12-11 18:01:52
GwY0R06sH56DH_HiTE1M5b16Odgkpqxz	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:01:52.663Z","secure":true,"httpOnly":true,"path":"/"},"user":{"id":12,"username":"user1","email":"user1@gmail.com","role":"business"}}	2025-12-11 18:01:53
nMEn7yET-_AIJ8l7iZd0eMSvwF9QJ11T	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:01:52.054Z","secure":true,"httpOnly":true,"path":"/"},"user":{"id":12,"username":"user1","email":"user1@gmail.com","role":"business"}}	2025-12-11 18:01:53
11QOsgFzMpJXYBnr9r0az07GQxT29yPl	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:01:50.961Z","secure":true,"httpOnly":true,"path":"/"},"user":{"id":12,"username":"user1","email":"user1@gmail.com","role":"business"}}	2025-12-11 18:01:51
SbDrQEqNMly_BMT6ABvrhyIEBGpzlH_0	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:12:25.996Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":13,"username":"user2","email":"user2@gmail.com","role":"business"}}	2025-12-11 18:12:26
FfmTluHf-2lRY5_KhWF3TtcrAyhE6Tkj	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:09:50.892Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":10,"username":"admind","email":"admind@gmail.com","role":"admin"}}	2025-12-11 18:09:51
37hPCR5MXk8I_RJpLjzR2YmKE6xedmXN	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:10:16.997Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":10,"username":"admind","email":"admind@gmail.com","role":"admin"}}	2025-12-11 18:10:17
Ryy245AD3M-bklwoM-b3CaYIHEXiMjws	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:10:17.405Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":10,"username":"admind","email":"admind@gmail.com","role":"admin"}}	2025-12-11 18:10:18
VNJIqCR7zO6iG81xMEA9H-zZJXuFRVzg	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:10:40.203Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":12,"username":"user1","email":"user1@gmail.com","role":"business"}}	2025-12-11 18:10:41
GOmJVjuoTjphu770xdPvOg_dPDRZjV74	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:18:53.866Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:18:54
R_n6R8R5H_wruNiqyUByR3WmPqu5OkHd	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:18:54.763Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:18:55
h4_I0aXNTCqJrfzjVgeMuDVjo_HsAPeA	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:19:12.272Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:19:13
POX6U669NOlxWvNecphbqzdAxIs0GACc	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:19:13.345Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:19:14
6O4CgjA6jvVPcol4Llg_qADpe0frvUES	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:19:46.963Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:19:47
UvZqknihPJqraJ7DW5WYT183ZPOTw-uK	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:20:12.671Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:20:13
q5ICWX_du4EnP5-a_Zqe81nNrn7UproI	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:20:13.801Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:20:14
TZ9PxEBhWjI7PGLD_CM_otgPMQX6PW4E	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:20:46.493Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:20:47
Ug1O07AeigKL1NEj5Sui1UmqOt7KXkyO	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:20:47.799Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:20:48
qbELo5k5OFUjsyQl4VxX2zvu7NKcjnfo	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:05.897Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:06
q7KisgJfw_OzKoe3-5TjqqA9Prdwnu6V	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:12.608Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:13
EFgMujEZa0d3tAhMh8w0IJK_hylRid8s	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:14.261Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:15
ySztbj5wlG9Yj0ol6--bdpMg8512HvZj	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:19.776Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:20
ZlqV6nKM2ABQB4ibPHbbJWeeQ9QGnUkX	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:19.918Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:20
lHWIfTTdB8OSQeVahdrxqhNDm94y-8hD	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:19.948Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:20
iT2mxjA-TI0mIXC1mBfMTSMt6pX6zqpY	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:19.975Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:20
S3Lstqw-ZMz5inek8-yDx40uqMjP6nnp	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:20.023Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:21
kDFxr3zcpplRPaR-8M6WUKK1Kh-SwY80	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:20.226Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:21
n2aF0ImKc4Z8EiPccDCXq-TzbmPFNDVG	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:20.550Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:21
Za_DTAtDpiIvu6DShAEIWvAJCWyXq3Sg	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:20.620Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:21
yjO9m2i9ym-wC2WXgPFfqw-5TvaRoM6-	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:20.712Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:21
2tWDTVi6uqsHyRJLh--5_CcKzHKM0-91	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:20.819Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:21
Me3AfC5xwHgXBETL_TRi0lH0XR9vOtLV	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:20.827Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:21
4nUhl-OB4qejRfWsi5MFq8nj8P7EvkFy	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:21.023Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:22
m8Pmq_bC5oQLycnybH0MClw5QCT9Ys4u	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:19.549Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:20
o00ajqEpgOi6M62eBwVjbOH2mQEnO61n	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:21.223Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:22
8SoYncuoYd8Oaiji2Wx48Z8xy0JZ_mMw	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:21.368Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:22
a1YBOrzAexe5mcuJyJ1_kPc4DUHJ1Fw-	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:21.369Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:22
scgsN-ZmV5qc9zY9xgappB8aLYEzC_4G	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:21.592Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:22
mFSexhHNHNcn5q8H2ZVEj1en3OMJ_gF6	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:21.604Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:22
kA6N25f15JsOL3iMq-RReW6AFwvM2iap	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:21.597Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:22
6kxdzbty_a1aTnt56A27NSj7CmYY1R1n	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:21.603Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:22
T-6zBEYeDOHqUGPYybmWrLQID43n5i3K	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:21.665Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:22
mxLYMjpG2E2LR5ogRbmCAxcN5qiCbXoO	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:21.755Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:22
hMY5BRbABSSdLXFJoUuRLw0l5XKqCB2s	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:22.114Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:23
DHjoovXYVz6EdGibPWztitvrb4x6SEnD	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:22.197Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:23
FW7ems9HmnCqPAYzh7WOlt-33zLyYAKp	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:22.288Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:23
Yvgc1QpzHiBDZVJXw9KlZn_FdXoQF-Hn	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:22.514Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:23
rp7AjsbhSnVGByLUpAXo7y5cCsNiFmKr	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:22.520Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:23
GHTmBzhzDzwTYmJUs2jluI62TepoQN4j	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:22.922Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:23
TQOPWKkk295jbh4Aq-LsD5uuN4npUAYS	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:26.399Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":10,"username":"admind","email":"admind@gmail.com","role":"admin"}}	2025-12-11 18:21:27
tTbSOlHgox9y3W3CRuBPodVJCNHhv1rn	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:27.206Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:28
_64vLSBaSqt63xxlPoFpK8Kz4Q8Ef-lp	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:27.352Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:28
WJ__7hXQ3s7K6nvf2UnqjRbChT7S0d7X	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:27.483Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:28
GfPM85cfH37hW7TfZ6i_-5XqYFEbBK5m	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:28.427Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:29
kqvvHypEOV6gJ1cZQnEKTskaeByPKulc	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:46.439Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:47
Jyzp05jJC8UFBSWCmir-EJA0CJqdgSPH	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:21:47.681Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:21:48
7VFs_wJvyavNMxm-FjqCevkzt5ESKHbq	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:22:46.879Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:22:47
3ivwVFGViYgiWR-Z8Qm3wtAhwvikVGJI	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:22:47.064Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:22:48
oYN8lECM8cUvmdC3BzAfK63XX-j_C4_u	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:23:46.630Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:23:47
WP42ltjN5E_TgYH6M3ZyFwLjXX-ITv7W	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:23:47.003Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:23:48
VqYfzvFqAO1qbg2cIW6gQ0k6xQAohqc4	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:24:46.714Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:24:47
r2T-JoeMZraPuBMeTLk1zBFDmfxuMPe_	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:24:46.873Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-12-11 18:24:47
2LNI1Xjji-pj8piP5ZsPZsh5CPJ06D8p	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:26:10.656Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":10,"username":"admind","email":"admind@gmail.com","role":"admin"}}	2025-12-11 18:26:11
d5_M2awtcWxNgv-HQpC60vIacheMCmfZ	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:26:11.113Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":10,"username":"admind","email":"admind@gmail.com","role":"admin"}}	2025-12-11 18:26:12
QreaqZYlhBHpFgqhJ90rCdlvbpbiGl72	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:26:11.113Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":10,"username":"admind","email":"admind@gmail.com","role":"admin"}}	2025-12-11 18:26:12
MSOc-tPAMr-16PcqrfC4HzYNS3sdFP2X	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:26:11.215Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":10,"username":"admind","email":"admind@gmail.com","role":"admin"}}	2025-12-11 18:26:12
a4_N_jfP6njx_sihhouosXpWvWO9-n82	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:26:48.293Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":10,"username":"admind","email":"admind@gmail.com","role":"admin"}}	2025-12-11 18:26:49
OmDTLasDiq2FPsiYeXSECZgZItNkJvdi	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:26:48.918Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":10,"username":"admind","email":"admind@gmail.com","role":"admin"}}	2025-12-11 18:26:49
5Sh-Y8JV4kDQXVIwSwo0s5QSJPhwA3NY	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:26:49.422Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":10,"username":"admind","email":"admind@gmail.com","role":"admin"}}	2025-12-11 18:26:50
MyEyygVEEpQqzIQhQUrKQu9jMQWNDShj	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:26:49.423Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":10,"username":"admind","email":"admind@gmail.com","role":"admin"}}	2025-12-11 18:26:50
2BYC7EXs5-sQwjM9iJAyXqPZkGeX7jEg	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:26:49.423Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":10,"username":"admind","email":"admind@gmail.com","role":"admin"}}	2025-12-11 18:26:50
8errr48Is4m7bGU0LbE3HvxVJvaWkle_	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:26:50.420Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":10,"username":"admind","email":"admind@gmail.com","role":"admin"}}	2025-12-11 18:26:51
pxSPvo_04doCO8p3qSM88ImHyFNLAQ3R	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:26:50.420Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":10,"username":"admind","email":"admind@gmail.com","role":"admin"}}	2025-12-11 18:26:51
lNikdw7nUkV0dvsvLAB4khKRHSLHzmti	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:27:35.263Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":12,"username":"user1","email":"user1@gmail.com","role":"business"}}	2025-12-11 18:27:36
Kfiv8bj77G3HKJjwEAtpOAF_qpaTcnpo	{"cookie":{"originalMaxAge":86400000,"expires":"2025-12-11T18:27:53.466Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":10,"username":"admind","email":"admind@gmail.com","role":"admin"}}	2025-12-11 18:27:54
\.


--
-- Data for Name: uploads_meta; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.uploads_meta (id, listing_id, field_name, stored_filename, original_filename, created_at) FROM stdin;
64	14	image	1765918745986-j1m18i.jpg	548205135_4277317599223717_995612057335324569_n.jpg	2025-12-16 20:59:06.209817
65	14	oct_tct	1765918745994-nsxwlc.pdf	Cancellation-Behavior-Analysis-of-Uber-Users (1).pdf	2025-12-16 20:59:06.25086
66	14	tax_declaration	1765918746013-plgbu0.jpg	548205135_4277317599223717_995612057335324569_n.jpg	2025-12-16 20:59:06.291383
67	15	image	1765918960511-v8nhsg.jpg	548205135_4277317599223717_995612057335324569_n.jpg	2025-12-16 21:02:40.778271
68	15	oct_tct	1765918960516-c91iur.jpg	548205135_4277317599223717_995612057335324569_n.jpg	2025-12-16 21:02:40.823314
69	15	tax_declaration	1765918960520-u9ry13.jpg	548205135_4277317599223717_995612057335324569_n.jpg	2025-12-16 21:02:40.870296
\.


--
-- Data for Name: user_listings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_listings (id, user_id, listing_id, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, email, password, role, created_at, contact_number, bio, profile_picture_url, admin_role, is_verified, verification_status, verified_at, verified_by, phone_number, id_document_url, id_document_verified, user_type, email_verified, verification_code, verification_code_expiry) FROM stdin;
39	Harji	harjimilan4@gmail.com	$2b$10$PVId3UEshkX/xSN7vXh4D.RnCKdM8RX6gqa/f8Wnrwp.1tx.Fk6Vm	investor	2025-12-16 20:01:10.808655	\N	\N	\N	\N	f	unverified	\N	\N	\N	\N	f	investor	f	434245	2025-12-17 04:32:11.598
28	admin	admin@gmail.com	$2b$10$9Qg7EISb3Yc1kJo2E7c7pOYFYj4E8nltnly5ZFKGHSGFliiMte.My	admin	2025-12-15 18:07:58.94496	\N	\N	\N	head_admin	t	unverified	\N	\N	\N	\N	f	business	f	\N	\N
29	listing	listing@gmail.com	$2b$10$jO1vDLYhxmirfmkR25ZUz.qOXQC2IsZxStqLmduY7o0BGXVU7TWYO	admin	2025-12-15 18:24:14.96277	\N	\N	\N	listing_admin	t	unverified	\N	\N	\N	\N	f	business	f	\N	\N
30	verify	verify@gmail.com	$2b$10$YZTtbpni0CXfvbH/noxWRODH7sKwO/kEPG2BGZqnUkyiJfZ673jWG	admin	2025-12-15 18:24:46.656699	\N	\N	\N	verification_admin	t	unverified	\N	\N	\N	\N	f	business	f	\N	\N
31	Business	business@gmail.com	$2b$10$bwgvZ8tUsLlGluZT1Qhc/umtUdTFmYZzBBSKPaKQ4D4q1Lzop79iW	user	2025-12-15 18:34:19.439912	\N	\N	\N	\N	f	unverified	\N	\N	\N	\N	f	business	f	\N	\N
32	Investor	investor@gmail.com	$2b$10$kkYu6eKkI8lJlLyIJpmomORN9PxJxcMEa6yxUwaaNyqbyGJG8OaQ.	user	2025-12-15 18:34:33.685025	\N	\N	\N	\N	f	unverified	\N	\N	\N	\N	f	investor	f	\N	\N
33	Business2	business2@gmail.com	$2b$10$kIL2O23i3coLVLvm54VDYeV.aP0dvrQ30F4XHJvLCJBHIZ/8hsMPW	business	2025-12-15 20:38:38.571132	\N	\N	\N	\N	t	unverified	\N	\N	\N	\N	f	business	f	\N	\N
34	system	system@gmail.com	$2b$10$m.OXGA36ZPKn50NzS90rX.QTO9T4Qte5lJUIZYvLhJJaNr0pmmxDm	admin	2025-12-15 21:08:35.632673	\N	\N	\N	system_admin	t	unverified	\N	\N	\N	\N	f	business	f	\N	\N
35	investor2	investor2@gmail.com	$2b$10$l/yjXcoL0nXrZ.ljivzHruE/nwqEjTRT3HyIdGxTl5/bX3Ek5XpKy	investor	2025-12-15 21:45:05.707138	\N	\N	\N	\N	f	unverified	\N	\N	\N	\N	f	investor	f	\N	\N
36	email	harjiimesh2@gmail.com	$2b$10$XFeBUWdPOoIIUSBvHRE3xePd.hD5g2UCN0ksv1dZCil.0qU0X39gS	business	2025-12-16 19:46:37.595282	\N	\N	\N	\N	f	unverified	\N	\N	\N	\N	f	business	f	665703	2025-12-17 04:16:37.567
37	harji	harji3445@gmail.com	$2b$10$YSdColvoImA0yW9moAxKNeXI8pwTNK3fMuViTDFWOcSgLRtN6QPE.	business	2025-12-16 19:49:32.214012	\N	\N	\N	\N	f	unverified	\N	\N	\N	\N	f	business	f	156849	2025-12-17 04:20:11.79
38	Henjimesh	harjii3445@gmail.com	$2b$10$ZS6MUKQf.aup4LCOM.VHIeL3VwW68/dAW7GtZyDWIBI1BqNL0MJXG	business	2025-12-16 19:55:17.318012	\N	\N	\N	\N	t	unverified	\N	\N	\N	\N	f	business	t	\N	\N
40	harjiimesh5	harjiimesh5@gmail.com	$2b$10$Bs8nShi7OQMFlZj2BqPfqODSzClSF/Ckwz426aYwrHl6EBxQb44HK	investor	2025-12-16 20:06:50.885277	\N	\N	\N	\N	t	unverified	\N	\N	\N	\N	f	investor	t	\N	\N
\.


--
-- Data for Name: verification_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.verification_requests (id, user_id, status, phone_number, id_document_url, otp_code, otp_sent_at, otp_verified_at, otp_attempts, verified_by, verified_at, rejection_reason, created_at, updated_at) FROM stdin;
1	32	otp_sent	09674014644	\N	779105	2025-12-16 02:34:47.444	\N	0	\N	\N	\N	2025-12-15 18:34:48.32236	2025-12-15 18:34:48.32236
2	32	otp_sent	+6309674014644	\N	498569	2025-12-16 02:36:04.422	\N	0	\N	\N	\N	2025-12-15 18:36:05.306314	2025-12-15 18:36:05.306314
3	32	otp_sent	+639674014644	\N	282892	2025-12-16 02:37:12.453	\N	0	\N	\N	\N	2025-12-15 18:37:13.337082	2025-12-15 18:37:13.337082
4	31	rejected	+639674014644	\N	\N	\N	\N	0	\N	\N	\N	2025-12-15 18:58:24.882386	2025-12-15 18:58:24.882386
5	31	rejected	+639674014644	\N	\N	\N	\N	0	\N	\N	\N	2025-12-15 18:58:42.318029	2025-12-15 18:58:42.318029
6	31	rejected	09674014644	\N	\N	\N	\N	0	\N	\N	\N	2025-12-15 19:00:17.381132	2025-12-15 19:00:17.381132
7	31	rejected	+639674014644	\N	\N	\N	\N	0	\N	\N	\N	2025-12-15 19:00:27.122067	2025-12-15 19:00:27.122067
8	31	rejected	+639674014644	\N	\N	\N	\N	0	\N	\N	\N	2025-12-15 19:00:30.259911	2025-12-15 19:00:30.259911
9	31	rejected	+639674014644	\N	\N	\N	\N	0	\N	\N	\N	2025-12-15 19:09:12.277974	2025-12-15 19:09:12.277974
10	31	rejected	09674014644	\N	\N	\N	\N	0	\N	\N	\N	2025-12-15 19:09:43.249344	2025-12-15 19:09:43.249344
11	31	rejected	09674014644	\N	\N	\N	\N	0	\N	\N	\N	2025-12-15 19:20:53.159247	2025-12-15 19:20:53.159247
12	31	rejected	+639674014644	\N	\N	\N	\N	0	\N	\N	\N	2025-12-15 19:21:57.271775	2025-12-15 19:21:57.271775
13	31	rejected	+639674014644	\N	\N	\N	\N	0	\N	\N	\N	2025-12-15 19:24:20.606252	2025-12-15 19:24:20.606252
14	31	rejected	639674014644	\N	\N	\N	\N	0	\N	\N	\N	2025-12-15 19:24:41.924279	2025-12-15 19:24:41.924279
15	31	rejected	09674014644	\N	\N	\N	\N	0	\N	\N	\N	2025-12-15 19:25:08.44699	2025-12-15 19:25:08.44699
16	31	rejected	+63 967 401 4644	\N	\N	\N	\N	0	\N	\N	\N	2025-12-15 19:26:39.901359	2025-12-15 19:26:39.901359
17	31	verified	09674014644	/uploads/1765829653412-9lc3cw.jpg	\N	\N	\N	0	\N	2025-12-15 20:14:42.720848	\N	2025-12-15 20:14:15.896152	2025-12-15 20:14:15.896152
18	33	verified	09674014644	/uploads/1765831145632-k8tpp2.jpg	\N	\N	\N	0	\N	2025-12-15 20:39:44.940338	\N	2025-12-15 20:39:06.562273	2025-12-15 20:39:06.562273
19	38	verified	09674014644	/uploads/1765915141894-5fk68b.jpg	\N	\N	\N	0	\N	2025-12-16 20:00:25.012122	\N	2025-12-16 19:59:01.929198	2025-12-16 19:59:01.929198
20	40	verified	09674014644	/uploads/1765916755540-yjfz0m.jpg	\N	\N	\N	0	\N	2025-12-16 20:30:25.307812	\N	2025-12-16 20:25:56.117648	2025-12-16 20:25:56.117648
\.


--
-- Name: admin_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.admin_tokens_id_seq', 2, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 22, true);


--
-- Name: economic_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.economic_data_id_seq', 11, true);


--
-- Name: email_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.email_logs_id_seq', 16, true);


--
-- Name: inquiries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inquiries_id_seq', 2, true);


--
-- Name: listing_approvals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.listing_approvals_id_seq', 1, true);


--
-- Name: listing_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.listing_notifications_id_seq', 24, true);


--
-- Name: listings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.listings_id_seq', 15, true);


--
-- Name: locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.locations_id_seq', 6, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.messages_id_seq', 6, true);


--
-- Name: notification_preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notification_preferences_id_seq', 1, false);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 44, true);


--
-- Name: sales_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sales_transactions_id_seq', 1, false);


--
-- Name: uploads_meta_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.uploads_meta_id_seq', 69, true);


--
-- Name: user_listings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_listings_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 40, true);


--
-- Name: verification_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.verification_requests_id_seq', 20, true);


--
-- Name: admin_roles admin_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_roles
    ADD CONSTRAINT admin_roles_pkey PRIMARY KEY (id);


--
-- Name: admin_roles admin_roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_roles
    ADD CONSTRAINT admin_roles_role_name_key UNIQUE (role_name);


--
-- Name: admin_tokens admin_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_tokens
    ADD CONSTRAINT admin_tokens_pkey PRIMARY KEY (id);


--
-- Name: admin_tokens admin_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_tokens
    ADD CONSTRAINT admin_tokens_token_key UNIQUE (token);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: economic_data economic_data_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.economic_data
    ADD CONSTRAINT economic_data_key_key UNIQUE (key);


--
-- Name: economic_data economic_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.economic_data
    ADD CONSTRAINT economic_data_pkey PRIMARY KEY (id);


--
-- Name: email_logs email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_pkey PRIMARY KEY (id);


--
-- Name: inquiries inquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_pkey PRIMARY KEY (id);


--
-- Name: listing_approvals listing_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_approvals
    ADD CONSTRAINT listing_approvals_pkey PRIMARY KEY (id);


--
-- Name: listing_notifications listing_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_notifications
    ADD CONSTRAINT listing_notifications_pkey PRIMARY KEY (id);


--
-- Name: listings listings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);


--
-- Name: role_permissions role_permissions_admin_role_permission_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_admin_role_permission_key UNIQUE (admin_role, permission);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: sales_transactions sales_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_transactions
    ADD CONSTRAINT sales_transactions_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: uploads_meta uploads_meta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uploads_meta
    ADD CONSTRAINT uploads_meta_pkey PRIMARY KEY (id);


--
-- Name: user_listings user_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_listings
    ADD CONSTRAINT user_listings_pkey PRIMARY KEY (id);


--
-- Name: user_listings user_listings_user_id_listing_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_listings
    ADD CONSTRAINT user_listings_user_id_listing_id_key UNIQUE (user_id, listing_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: verification_requests verification_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_requests
    ADD CONSTRAINT verification_requests_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: idx_audit_logs_admin_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_admin_id ON public.audit_logs USING btree (admin_id);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: idx_listing_approvals_listing_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listing_approvals_listing_id ON public.listing_approvals USING btree (listing_id);


--
-- Name: idx_listing_approvals_listing_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listing_approvals_listing_status ON public.listing_approvals USING btree (listing_status);


--
-- Name: idx_listings_approved; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_approved ON public.listings USING btree (approved);


--
-- Name: idx_listings_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_created_at ON public.listings USING btree (created_at DESC);


--
-- Name: idx_listings_latitude; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_latitude ON public.listings USING btree (latitude);


--
-- Name: idx_listings_longitude; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_longitude ON public.listings USING btree (longitude);


--
-- Name: idx_listings_sold_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_sold_status ON public.listings USING btree (listing_status);


--
-- Name: idx_listings_sold_to_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_sold_to_user ON public.listings USING btree (sold_to_user_id);


--
-- Name: idx_listings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_status ON public.listings USING btree (status);


--
-- Name: idx_locations_coordinates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_locations_coordinates ON public.locations USING btree (latitude, longitude);


--
-- Name: idx_messages_inquiry_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_inquiry_id ON public.messages USING btree (inquiry_id);


--
-- Name: idx_sales_buyer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_buyer_id ON public.sales_transactions USING btree (buyer_id);


--
-- Name: idx_sales_listing_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_listing_id ON public.sales_transactions USING btree (listing_id);


--
-- Name: idx_sales_seller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_seller_id ON public.sales_transactions USING btree (seller_id);


--
-- Name: idx_users_admin_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_admin_role ON public.users USING btree (admin_role);


--
-- Name: idx_users_is_verified; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_is_verified ON public.users USING btree (is_verified);


--
-- Name: idx_users_user_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_user_type ON public.users USING btree (user_type);


--
-- Name: idx_users_verification_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_verification_code ON public.users USING btree (verification_code) WHERE (verification_code IS NOT NULL);


--
-- Name: idx_verification_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_verification_requests_status ON public.verification_requests USING btree (status);


--
-- Name: idx_verification_requests_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_verification_requests_user_id ON public.verification_requests USING btree (user_id);


--
-- Name: audit_logs audit_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id);


--
-- Name: email_logs fk_email_logs_inquiry_id_inquiries; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT fk_email_logs_inquiry_id_inquiries FOREIGN KEY (inquiry_id) REFERENCES public.inquiries(id);


--
-- Name: email_logs fk_email_logs_user_id_users; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT fk_email_logs_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: inquiries fk_inquiries_listing_id_listings; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT fk_inquiries_listing_id_listings FOREIGN KEY (listing_id) REFERENCES public.listings(id);


--
-- Name: inquiries fk_inquiries_owner_id_users; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT fk_inquiries_owner_id_users FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: listings fk_listings_owner_id_users; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT fk_listings_owner_id_users FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: notification_preferences fk_notification_prefs_user_id_users; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT fk_notification_prefs_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: uploads_meta fk_uploads_meta_listing_id_listings; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uploads_meta
    ADD CONSTRAINT fk_uploads_meta_listing_id_listings FOREIGN KEY (listing_id) REFERENCES public.listings(id);


--
-- Name: user_listings fk_user_listings_listing_id_listings; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_listings
    ADD CONSTRAINT fk_user_listings_listing_id_listings FOREIGN KEY (listing_id) REFERENCES public.listings(id);


--
-- Name: user_listings fk_user_listings_user_id_users; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_listings
    ADD CONSTRAINT fk_user_listings_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: listing_approvals listing_approvals_admin_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_approvals
    ADD CONSTRAINT listing_approvals_admin_approved_by_fkey FOREIGN KEY (admin_approved_by) REFERENCES public.users(id);


--
-- Name: listing_approvals listing_approvals_head_admin_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_approvals
    ADD CONSTRAINT listing_approvals_head_admin_approved_by_fkey FOREIGN KEY (head_admin_approved_by) REFERENCES public.users(id);


--
-- Name: listing_approvals listing_approvals_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_approvals
    ADD CONSTRAINT listing_approvals_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: listing_approvals listing_approvals_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_approvals
    ADD CONSTRAINT listing_approvals_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.users(id);


--
-- Name: listings listings_sold_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_sold_to_user_id_fkey FOREIGN KEY (sold_to_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: sales_transactions sales_transactions_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_transactions
    ADD CONSTRAINT sales_transactions_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sales_transactions sales_transactions_inquiry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_transactions
    ADD CONSTRAINT sales_transactions_inquiry_id_fkey FOREIGN KEY (inquiry_id) REFERENCES public.inquiries(id) ON DELETE SET NULL;


--
-- Name: sales_transactions sales_transactions_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_transactions
    ADD CONSTRAINT sales_transactions_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: sales_transactions sales_transactions_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_transactions
    ADD CONSTRAINT sales_transactions_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: verification_requests verification_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_requests
    ADD CONSTRAINT verification_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: verification_requests verification_requests_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_requests
    ADD CONSTRAINT verification_requests_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: -; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON SEQUENCES TO db_4c25_user;


--
-- Name: DEFAULT PRIVILEGES FOR TYPES; Type: DEFAULT ACL; Schema: -; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TYPES TO db_4c25_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: -; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON FUNCTIONS TO db_4c25_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: -; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TABLES TO db_4c25_user;


--
-- PostgreSQL database dump complete
--

\unrestrict 8e9gaR44nSL6pyORLIyNZY5THk2UJMEhzLG30KTjIlmBM4itJdIF6bGNXq3FfA6

