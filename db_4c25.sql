--
-- PostgreSQL database dump
--

\restrict zYPYMJYYyufRzpg4jSKOAcupNa3PAgFWhZi7mf4uXWbPcudncBD6A11AjU3al3w

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: db_4c25_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO db_4c25_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account_notifications; Type: TABLE; Schema: public; Owner: db_4c25_user
--

CREATE TABLE public.account_notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    change_type text NOT NULL,
    change_description text,
    reason text,
    admin_id integer,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.account_notifications OWNER TO db_4c25_user;

--
-- Name: account_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: db_4c25_user
--

CREATE SEQUENCE public.account_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.account_notifications_id_seq OWNER TO db_4c25_user;

--
-- Name: account_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: db_4c25_user
--

ALTER SEQUENCE public.account_notifications_id_seq OWNED BY public.account_notifications.id;


--
-- Name: admin_roles; Type: TABLE; Schema: public; Owner: db_4c25_user
--

CREATE TABLE public.admin_roles (
    id integer NOT NULL,
    role_name character varying(50) NOT NULL,
    display_name character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.admin_roles OWNER TO db_4c25_user;

--
-- Name: admin_tokens; Type: TABLE; Schema: public; Owner: db_4c25_user
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


ALTER TABLE public.admin_tokens OWNER TO db_4c25_user;

--
-- Name: admin_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: db_4c25_user
--

CREATE SEQUENCE public.admin_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_tokens_id_seq OWNER TO db_4c25_user;

--
-- Name: admin_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: db_4c25_user
--

ALTER SEQUENCE public.admin_tokens_id_seq OWNED BY public.admin_tokens.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: db_4c25_user
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


ALTER TABLE public.audit_logs OWNER TO db_4c25_user;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: db_4c25_user
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO db_4c25_user;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: db_4c25_user
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: economic_data; Type: TABLE; Schema: public; Owner: db_4c25_user
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


ALTER TABLE public.economic_data OWNER TO db_4c25_user;

--
-- Name: economic_data_id_seq; Type: SEQUENCE; Schema: public; Owner: db_4c25_user
--

CREATE SEQUENCE public.economic_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.economic_data_id_seq OWNER TO db_4c25_user;

--
-- Name: economic_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: db_4c25_user
--

ALTER SEQUENCE public.economic_data_id_seq OWNED BY public.economic_data.id;


--
-- Name: email_logs; Type: TABLE; Schema: public; Owner: db_4c25_user
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


ALTER TABLE public.email_logs OWNER TO db_4c25_user;

--
-- Name: email_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: db_4c25_user
--

CREATE SEQUENCE public.email_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_logs_id_seq OWNER TO db_4c25_user;

--
-- Name: email_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: db_4c25_user
--

ALTER SEQUENCE public.email_logs_id_seq OWNED BY public.email_logs.id;


--
-- Name: inquiries; Type: TABLE; Schema: public; Owner: db_4c25_user
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


ALTER TABLE public.inquiries OWNER TO db_4c25_user;

--
-- Name: inquiries_id_seq; Type: SEQUENCE; Schema: public; Owner: db_4c25_user
--

CREATE SEQUENCE public.inquiries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inquiries_id_seq OWNER TO db_4c25_user;

--
-- Name: inquiries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: db_4c25_user
--

ALTER SEQUENCE public.inquiries_id_seq OWNED BY public.inquiries.id;


--
-- Name: listing_approvals; Type: TABLE; Schema: public; Owner: db_4c25_user
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


ALTER TABLE public.listing_approvals OWNER TO db_4c25_user;

--
-- Name: listing_approvals_id_seq; Type: SEQUENCE; Schema: public; Owner: db_4c25_user
--

CREATE SEQUENCE public.listing_approvals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.listing_approvals_id_seq OWNER TO db_4c25_user;

--
-- Name: listing_approvals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: db_4c25_user
--

ALTER SEQUENCE public.listing_approvals_id_seq OWNED BY public.listing_approvals.id;


--
-- Name: listing_notifications; Type: TABLE; Schema: public; Owner: db_4c25_user
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


ALTER TABLE public.listing_notifications OWNER TO db_4c25_user;

--
-- Name: listing_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: db_4c25_user
--

CREATE SEQUENCE public.listing_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.listing_notifications_id_seq OWNER TO db_4c25_user;

--
-- Name: listing_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: db_4c25_user
--

ALTER SEQUENCE public.listing_notifications_id_seq OWNED BY public.listing_notifications.id;


--
-- Name: listings; Type: TABLE; Schema: public; Owner: db_4c25_user
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


ALTER TABLE public.listings OWNER TO db_4c25_user;

--
-- Name: listings_id_seq; Type: SEQUENCE; Schema: public; Owner: db_4c25_user
--

CREATE SEQUENCE public.listings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.listings_id_seq OWNER TO db_4c25_user;

--
-- Name: listings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: db_4c25_user
--

ALTER SEQUENCE public.listings_id_seq OWNED BY public.listings.id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: db_4c25_user
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


ALTER TABLE public.locations OWNER TO db_4c25_user;

--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: db_4c25_user
--

CREATE SEQUENCE public.locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.locations_id_seq OWNER TO db_4c25_user;

--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: db_4c25_user
--

ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: db_4c25_user
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


ALTER TABLE public.messages OWNER TO db_4c25_user;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: db_4c25_user
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO db_4c25_user;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: db_4c25_user
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: migration_log; Type: TABLE; Schema: public; Owner: db_4c25_user
--

CREATE TABLE public.migration_log (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    executed_at timestamp without time zone DEFAULT now(),
    status character varying(50) DEFAULT 'completed'::character varying
);


ALTER TABLE public.migration_log OWNER TO db_4c25_user;

--
-- Name: migration_log_id_seq; Type: SEQUENCE; Schema: public; Owner: db_4c25_user
--

CREATE SEQUENCE public.migration_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migration_log_id_seq OWNER TO db_4c25_user;

--
-- Name: migration_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: db_4c25_user
--

ALTER SEQUENCE public.migration_log_id_seq OWNED BY public.migration_log.id;


--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: db_4c25_user
--

CREATE TABLE public.notification_preferences (
    id integer NOT NULL,
    user_id integer NOT NULL,
    email_new_inquiry boolean DEFAULT true,
    email_digest boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notification_preferences OWNER TO db_4c25_user;

--
-- Name: notification_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: db_4c25_user
--

CREATE SEQUENCE public.notification_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_preferences_id_seq OWNER TO db_4c25_user;

--
-- Name: notification_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: db_4c25_user
--

ALTER SEQUENCE public.notification_preferences_id_seq OWNED BY public.notification_preferences.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: db_4c25_user
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    admin_role character varying(50) NOT NULL,
    permission character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.role_permissions OWNER TO db_4c25_user;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: db_4c25_user
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.role_permissions_id_seq OWNER TO db_4c25_user;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: db_4c25_user
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- Name: sales_transactions; Type: TABLE; Schema: public; Owner: db_4c25_user
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


ALTER TABLE public.sales_transactions OWNER TO db_4c25_user;

--
-- Name: sales_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: db_4c25_user
--

CREATE SEQUENCE public.sales_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_transactions_id_seq OWNER TO db_4c25_user;

--
-- Name: sales_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: db_4c25_user
--

ALTER SEQUENCE public.sales_transactions_id_seq OWNED BY public.sales_transactions.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: db_4c25_user
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO db_4c25_user;

--
-- Name: success_stories; Type: TABLE; Schema: public; Owner: db_4c25_user
--

CREATE TABLE public.success_stories (
    id integer NOT NULL,
    investor_id integer NOT NULL,
    listing_id integer NOT NULL,
    image_url text,
    location character varying(255) NOT NULL,
    business_name character varying(255) NOT NULL,
    description text NOT NULL,
    business_type character varying(100) NOT NULL,
    established_year integer,
    key_achievement text,
    contact_email character varying(255),
    status character varying(50) DEFAULT 'pending'::character varying,
    system_admin_notes text,
    head_admin_notes text,
    approved_by_system_admin_id integer,
    approved_by_head_admin_id integer,
    approved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    category character varying(50) DEFAULT 'retail'::character varying
);


ALTER TABLE public.success_stories OWNER TO db_4c25_user;

--
-- Name: success_stories_id_seq; Type: SEQUENCE; Schema: public; Owner: db_4c25_user
--

CREATE SEQUENCE public.success_stories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.success_stories_id_seq OWNER TO db_4c25_user;

--
-- Name: success_stories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: db_4c25_user
--

ALTER SEQUENCE public.success_stories_id_seq OWNED BY public.success_stories.id;


--
-- Name: uploads_meta; Type: TABLE; Schema: public; Owner: db_4c25_user
--

CREATE TABLE public.uploads_meta (
    id integer NOT NULL,
    listing_id integer,
    field_name text,
    stored_filename text,
    original_filename text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.uploads_meta OWNER TO db_4c25_user;

--
-- Name: uploads_meta_id_seq; Type: SEQUENCE; Schema: public; Owner: db_4c25_user
--

CREATE SEQUENCE public.uploads_meta_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.uploads_meta_id_seq OWNER TO db_4c25_user;

--
-- Name: uploads_meta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: db_4c25_user
--

ALTER SEQUENCE public.uploads_meta_id_seq OWNED BY public.uploads_meta.id;


--
-- Name: user_listings; Type: TABLE; Schema: public; Owner: db_4c25_user
--

CREATE TABLE public.user_listings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    listing_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_listings OWNER TO db_4c25_user;

--
-- Name: user_listings_id_seq; Type: SEQUENCE; Schema: public; Owner: db_4c25_user
--

CREATE SEQUENCE public.user_listings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_listings_id_seq OWNER TO db_4c25_user;

--
-- Name: user_listings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: db_4c25_user
--

ALTER SEQUENCE public.user_listings_id_seq OWNED BY public.user_listings.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: db_4c25_user
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


ALTER TABLE public.users OWNER TO db_4c25_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: db_4c25_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO db_4c25_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: db_4c25_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: verification_requests; Type: TABLE; Schema: public; Owner: db_4c25_user
--

CREATE TABLE public.verification_requests (
    id integer NOT NULL,
    user_id integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    phone_number character varying(20),
    id_document_url character varying(255),
    otp_code character varying(6),
    otp_sent_at timestamp without time zone,
    otp_verified_at timestamp without time zone,
    otp_attempts integer DEFAULT 0,
    verified_by integer,
    verified_at timestamp without time zone,
    rejection_reason text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    email character varying(255),
    selfie_photo_url character varying(500)
);


ALTER TABLE public.verification_requests OWNER TO db_4c25_user;

--
-- Name: TABLE verification_requests; Type: COMMENT; Schema: public; Owner: db_4c25_user
--

COMMENT ON TABLE public.verification_requests IS 'Stores user verification requests with documents (selfie + ID) and OTP email verification';


--
-- Name: verification_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: db_4c25_user
--

CREATE SEQUENCE public.verification_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.verification_requests_id_seq OWNER TO db_4c25_user;

--
-- Name: verification_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: db_4c25_user
--

ALTER SEQUENCE public.verification_requests_id_seq OWNED BY public.verification_requests.id;


--
-- Name: account_notifications id; Type: DEFAULT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.account_notifications ALTER COLUMN id SET DEFAULT nextval('public.account_notifications_id_seq'::regclass);


--
-- Name: admin_tokens id; Type: DEFAULT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.admin_tokens ALTER COLUMN id SET DEFAULT nextval('public.admin_tokens_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: economic_data id; Type: DEFAULT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.economic_data ALTER COLUMN id SET DEFAULT nextval('public.economic_data_id_seq'::regclass);


--
-- Name: email_logs id; Type: DEFAULT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.email_logs ALTER COLUMN id SET DEFAULT nextval('public.email_logs_id_seq'::regclass);


--
-- Name: inquiries id; Type: DEFAULT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.inquiries ALTER COLUMN id SET DEFAULT nextval('public.inquiries_id_seq'::regclass);


--
-- Name: listing_approvals id; Type: DEFAULT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.listing_approvals ALTER COLUMN id SET DEFAULT nextval('public.listing_approvals_id_seq'::regclass);


--
-- Name: listing_notifications id; Type: DEFAULT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.listing_notifications ALTER COLUMN id SET DEFAULT nextval('public.listing_notifications_id_seq'::regclass);


--
-- Name: listings id; Type: DEFAULT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.listings ALTER COLUMN id SET DEFAULT nextval('public.listings_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: migration_log id; Type: DEFAULT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.migration_log ALTER COLUMN id SET DEFAULT nextval('public.migration_log_id_seq'::regclass);


--
-- Name: notification_preferences id; Type: DEFAULT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.notification_preferences ALTER COLUMN id SET DEFAULT nextval('public.notification_preferences_id_seq'::regclass);


--
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- Name: sales_transactions id; Type: DEFAULT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.sales_transactions ALTER COLUMN id SET DEFAULT nextval('public.sales_transactions_id_seq'::regclass);


--
-- Name: success_stories id; Type: DEFAULT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.success_stories ALTER COLUMN id SET DEFAULT nextval('public.success_stories_id_seq'::regclass);


--
-- Name: uploads_meta id; Type: DEFAULT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.uploads_meta ALTER COLUMN id SET DEFAULT nextval('public.uploads_meta_id_seq'::regclass);


--
-- Name: user_listings id; Type: DEFAULT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.user_listings ALTER COLUMN id SET DEFAULT nextval('public.user_listings_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: verification_requests id; Type: DEFAULT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.verification_requests ALTER COLUMN id SET DEFAULT nextval('public.verification_requests_id_seq'::regclass);


--
-- Data for Name: account_notifications; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.account_notifications (id, user_id, change_type, change_description, reason, admin_id, is_read, created_at) FROM stdin;
1	40	account_changed	username from harjiimesh52 to harjiimesh523	boring ng name mo	28	f	2025-12-20 19:25:44.367001
2	40	account_changed	username from harjiimesh523 to harjiimesh5233	BORING MO	28	f	2025-12-20 19:27:48.381967
\.


--
-- Data for Name: admin_roles; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.admin_roles (id, role_name, display_name, description, created_at) FROM stdin;
1	head_admin	Head Admin	Full system access and final approval authority	2025-12-15 17:54:35.089302
3	verification_admin	Verification Admin	Verifies and validates user identities	2025-12-15 17:54:35.089302
4	business	Business User	Regular user who can submit listings once verified	2025-12-17 13:07:32.28823
5	system_admin	System Admin	Manages system content, approves property listings and success stories	2025-12-15 21:07:38.165619
\.


--
-- Data for Name: admin_tokens; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.admin_tokens (id, token, created_by, created_at, expires_at, used, used_by, used_at) FROM stdin;
1	489736bec97349cc025f511f1f426b56c32ba721	10	2025-12-09 11:27:38.129639	\N	f	\N	\N
2	a1dcc1c102b94a34fb6d4e3e46f3cd81f136ebf8	10	2025-12-11 02:42:49.661096	\N	t	25	2025-12-11 02:43:50.23676
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
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
23	29	Listing admin_approved	listing_approvals	15	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-16 21:13:52.468675
24	29	Listing admin_approved	listing_approvals	16	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-17 11:53:10.142884
25	28	Listing published	listing_approvals	15	\N	published	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-17 12:00:11.015463
26	28	Listing published	listing_approvals	16	\N	published	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-17 12:00:19.565348
27	29	Listing admin_approved	listing_approvals	17	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-17 12:13:52.527047
28	28	Listing published	listing_approvals	17	\N	published	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-17 12:14:06.242465
29	30	approved_verification	verification_requests	22	\N	approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-17 20:43:47.917265
30	29	Listing admin_approved	listing_approvals	18	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-17 20:47:54.123151
31	28	Listing published	listing_approvals	18	\N	published	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-17 20:49:37.294182
32	29	Listing admin_approved	listing_approvals	19	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-18 18:27:03.990249
33	28	Listing published	listing_approvals	19	\N	published	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-18 18:27:54.462886
34	29	Listing admin_approved	listing_approvals	20	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-18 20:42:00.452414
35	28	Listing published	listing_approvals	20	\N	published	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-18 20:42:40.716892
36	34	updated_index_content	website_content	\N	\N	index.html updated	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-19 02:05:35.951678
37	30	approved_verification	verification_requests	23	\N	approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-19 03:17:08.520353
38	30	approved_verification	verification_requests	24	\N	approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-19 03:19:42.745299
39	28	Listing admin_approved	listing_approvals	19	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 21:35:50.091494
40	28	Listing admin_approved	listing_approvals	18	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 21:35:55.832842
41	28	Listing admin_approved	listing_approvals	19	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 21:36:11.774833
42	28	Listing admin_approved	listing_approvals	18	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 21:36:14.886763
43	28	Listing admin_approved	listing_approvals	19	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 21:37:33.509037
44	28	Listing admin_approved	listing_approvals	18	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 21:37:38.061278
45	28	Listing admin_approved	listing_approvals	19	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 21:38:29.977441
46	28	Listing admin_approved	listing_approvals	18	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 21:38:33.054973
47	28	Listing admin_approved	listing_approvals	19	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 21:38:53.768066
48	29	Listing admin_approved	listing_approvals	23	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 21:41:17.607327
49	29	Listing admin_approved	listing_approvals	24	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 21:41:18.629013
50	28	Listing published	listing_approvals	23	\N	published	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 21:44:26.430376
51	29	Listing admin_approved	listing_approvals	23	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 21:45:13.500131
52	29	Listing admin_approved	listing_approvals	23	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 21:45:17.203689
53	29	Listing rejected	listing_approvals	25	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 21:49:33.450915
54	29	Listing admin_approved	listing_approvals	25	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 21:50:40.222382
55	28	Listing rejected	listing_approvals	25	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 21:51:11.478392
56	28	Listing admin_approved	listing_approvals	25	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 21:53:05.970239
57	28	Listing rejected	listing_approvals	25	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 21:53:09.862799
58	28	Listing admin_approved	listing_approvals	25	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 21:53:16.722956
59	28	Listing rejected	listing_approvals	25	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 21:53:19.990947
60	29	Listing rejected	listing_approvals	26	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 21:54:48.588693
61	29	Listing admin_approved	listing_approvals	26	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 21:54:52.92928
62	28	Listing rejected	listing_approvals	26	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 21:55:13.267331
63	28	Listing admin_approved	listing_approvals	26	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 21:59:08.76428
64	28	Listing rejected	listing_approvals	26	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 21:59:20.508991
65	28	Listing admin_approved	listing_approvals	26	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:00:52.896639
66	28	Listing rejected	listing_approvals	26	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:00:57.579306
67	28	Listing admin_approved	listing_approvals	26	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:01:00.616771
68	28	Listing published	listing_approvals	26	\N	published	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:01:04.586697
69	28	Listing rejected	listing_approvals	26	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:01:08.306795
70	28	Listing admin_approved	listing_approvals	26	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:01:10.296874
71	28	Listing rejected	listing_approvals	26	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:03:19.649807
72	28	Listing admin_approved	listing_approvals	26	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:03:22.000822
73	28	Listing rejected	listing_approvals	26	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:04:53.544511
74	28	Listing admin_approved	listing_approvals	26	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:04:55.888659
75	28	Listing rejected	listing_approvals	26	\N	rejected	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:05:34.020821
76	28	Listing admin_approved	listing_approvals	26	\N	admin_approved	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:05:36.401937
77	29	Listing rejected	listing_approvals	27	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:06:47.317259
78	29	Listing admin_approved	listing_approvals	27	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:06:49.414239
79	29	Listing admin_approved	listing_approvals	27	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:07:30.318089
80	28	Listing rejected	listing_approvals	27	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:07:47.894178
81	28	Listing admin_approved	listing_approvals	27	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:07:49.451059
82	28	Listing published	listing_approvals	27	\N	published	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:08:25.645673
83	28	Listing rejected	listing_approvals	27	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:08:30.889979
84	28	Listing admin_approved	listing_approvals	27	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:08:32.777063
85	28	Listing published	listing_approvals	27	\N	published	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:10:59.705534
86	28	Listing rejected	listing_approvals	27	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:11:04.128924
87	28	Listing admin_approved	listing_approvals	27	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:11:06.260991
88	28	Listing rejected	listing_approvals	27	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:11:15.456575
89	28	Listing admin_approved	listing_approvals	27	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:11:18.063364
90	28	Listing published	listing_approvals	27	\N	published	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:13:27.290232
91	28	Listing rejected	listing_approvals	27	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:13:30.566618
92	28	Listing admin_approved	listing_approvals	27	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:13:32.076131
93	28	Listing published	listing_approvals	27	\N	published	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:15:54.410312
94	28	Listing rejected	listing_approvals	27	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:15:58.277959
95	28	Listing admin_approved	listing_approvals	27	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:16:00.58384
96	28	Listing published	listing_approvals	27	\N	published	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:17:38.526561
97	28	Listing rejected	listing_approvals	27	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:17:42.622177
98	28	Listing admin_approved	listing_approvals	27	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:17:45.143015
99	28	Listing published	listing_approvals	27	\N	published	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:18:35.048335
100	28	Listing rejected	listing_approvals	27	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:18:40.007672
101	28	Listing admin_approved	listing_approvals	27	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:18:41.826364
102	28	Listing published	listing_approvals	27	\N	published	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:19:22.931227
103	28	Listing rejected	listing_approvals	27	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:19:27.397705
104	28	Listing admin_approved	listing_approvals	27	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:20:35.639275
105	28	Listing published	listing_approvals	27	\N	published	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:20:35.855902
106	28	Listing rejected	listing_approvals	27	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:20:41.655505
107	28	Listing admin_approved	listing_approvals	27	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:20:43.625274
108	28	Listing published	listing_approvals	27	\N	published	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:20:43.930631
109	28	Listing rejected	listing_approvals	27	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:20:49.62145
110	29	Listing rejected	listing_approvals	28	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:22:17.579423
111	29	Listing admin_approved	listing_approvals	28	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:22:20.45779
112	28	Listing rejected	listing_approvals	28	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:22:39.729764
113	28	Listing admin_approved	listing_approvals	28	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:22:41.521866
114	28	Listing published	listing_approvals	28	\N	published	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:22:45.877055
115	28	Listing rejected	listing_approvals	28	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:22:49.531591
116	28	Listing admin_approved	listing_approvals	28	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:22:51.512955
117	28	Listing published	listing_approvals	28	\N	published	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:22:51.719891
118	29	Listing rejected	listing_approvals	29	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:54:22.272315
119	29	Listing admin_approved	listing_approvals	29	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 22:54:25.91078
120	29	Listing rejected	listing_approvals	30	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:00:37.173759
121	29	Listing admin_approved	listing_approvals	30	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:01:01.02817
122	29	Listing admin_approved	listing_approvals	31	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:03:42.966458
123	28	Listing rejected	listing_approvals	30	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:06:28.982978
124	28	Listing rejected	listing_approvals	31	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:06:28.982437
125	28	Listing rejected	listing_approvals	29	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:06:28.984722
126	28	Listing admin_approved	listing_approvals	30	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:08:05.430918
127	28	Listing admin_approved	listing_approvals	29	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:08:05.437405
128	28	Listing admin_approved	listing_approvals	31	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:08:05.440075
129	28	Listing published	listing_approvals	29	\N	published	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:08:11.002509
130	28	Listing published	listing_approvals	30	\N	published	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:08:11.003267
131	28	Listing published	listing_approvals	31	\N	published	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:08:11.003436
132	28	Listing rejected	listing_approvals	28	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:08:41.805816
133	28	Listing admin_approved	listing_approvals	28	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:08:53.696023
134	28	Listing published	listing_approvals	28	\N	published	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:08:53.902394
135	28	updated_admin_user	users	34	\N	Role: system_admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:36:27.658854
136	28	updated_admin_user	users	34	\N	Role: verification_admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:36:32.690311
137	28	updated_admin_user	users	34	\N	Role: system_admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:36:39.23538
138	28	updated_admin_user	users	34	\N	Role: system_admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:36:42.717947
139	28	updated_admin_user	users	34	\N	Username: systems, Role: system_admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:37:59.060267
140	30	created_admin_user	users	46	\N	verification_admin	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:43:55.17992
141	30	deleted_verification	verification_requests	16	\N	deleted	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:48:10.052714
142	30	deleted_verification	verification_requests	15	\N	deleted	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:48:14.495319
143	30	deleted_verification	verification_requests	14	\N	deleted	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:48:16.503355
144	30	deleted_verification	verification_requests	13	\N	deleted	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:48:20.187885
145	30	deleted_verification	verification_requests	12	\N	deleted	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:48:22.168448
146	30	deleted_verification	verification_requests	11	\N	deleted	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:48:25.494235
147	30	deleted_verification	verification_requests	10	\N	deleted	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:48:27.655355
148	30	deleted_verification	verification_requests	9	\N	deleted	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:48:29.603771
149	30	deleted_verification	verification_requests	8	\N	deleted	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:48:32.88124
150	30	deleted_verification	verification_requests	7	\N	deleted	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:48:35.197277
151	30	deleted_verification	verification_requests	6	\N	deleted	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:48:37.473324
152	30	deleted_verification	verification_requests	5	\N	deleted	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-19 23:48:40.073483
153	29	Listing admin_approved	listing_approvals	32	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-20 18:44:55.538975
154	28	edited_user_info	users	40	\N	Changed username from harjiimesh5 to harjiimesh52. Reason: it looks uncool	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-20 19:19:05.147938
155	28	edited_user_info	users	40	\N	Changed username from harjiimesh52 to harjiimesh523. Reason: boring ng name mo	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-20 19:25:44.234636
156	28	edited_user_info	users	40	\N	Changed username from harjiimesh523 to harjiimesh5233. Reason: BORING MO	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-20 19:27:48.298551
157	28	Listing rejected	listing_approvals	31	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-20 20:28:59.86606
158	28	Listing admin_approved	listing_approvals	31	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-20 20:29:01.870304
159	28	Listing published	listing_approvals	31	\N	published	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-20 20:29:02.107277
160	28	Listing rejected	listing_approvals	32	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-20 20:29:10.370761
161	28	Listing admin_approved	listing_approvals	32	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-20 20:29:12.171282
162	28	Listing rejected	listing_approvals	31	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-20 20:30:21.710677
163	28	Listing admin_approved	listing_approvals	31	\N	admin_approved	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-20 20:30:26.768624
164	28	Listing published	listing_approvals	31	\N	published	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-20 20:30:26.979154
165	28	deleted_user	users	43	\N	ggg (gg@gmail.com) - Type: business	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-20 20:53:46.427413
166	28	Listing rejected	listing_approvals	31	\N	rejected	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0	2025-12-20 21:07:51.158175
\.


--
-- Data for Name: economic_data; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.economic_data (id, key, value, label, icon, updated_at, updated_by) FROM stdin;
5	business_distribution	[30,45,15,8,2]	Business Distribution by Sector	🏢	2025-12-10 15:49:38.563197	10
1	population	108,319	population		2025-12-10 15:57:06.275845	10
9	businesses	960	businesses		2025-12-10 15:57:06.392657	10
10	business_change	18.08% increase	business_change		2025-12-10 15:57:06.710351	10
2	population_data	[101082,109245,108319,0,0]	Population Growth Trend	📊	2025-12-10 15:58:11.075343	10
\.


--
-- Data for Name: email_logs; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.email_logs (id, user_id, inquiry_id, email_address, subject, status, sent_at, created_at) FROM stdin;
15	\N	\N	business2@gmail.com	Your Listing was Rejected: business2	pending	\N	2025-12-16 20:49:57.210287
16	\N	\N	business2@gmail.com	Your Listing was Rejected: add	pending	\N	2025-12-16 20:54:55.196051
20	\N	\N	business2@gmail.com	Your Listing was Rejected: 123	pending	\N	2025-12-17 20:48:21.377369
21	\N	\N	business2@gmail.com	Your Listing was Rejected: 123	pending	\N	2025-12-17 20:48:24.307452
24	\N	\N	harjimilan4@gmail.com	Your Listing was Rejected: new harji	pending	\N	2025-12-19 21:23:46.47416
25	\N	\N	harjimilan4@gmail.com	Your Listing was Rejected: new harji	pending	\N	2025-12-19 21:23:59.208738
26	\N	\N	harjimilan4@gmail.com	Your Listing was Rejected: new harji	pending	\N	2025-12-19 21:28:11.151716
27	\N	\N	harjimilan4@gmail.com	Your Listing was Rejected: Harjii 2	pending	\N	2025-12-19 21:28:30.58227
28	\N	\N	harjimilan4@gmail.com	Your Listing was Rejected: Harjii 2	pending	\N	2025-12-19 21:31:10.089268
29	\N	\N	harjimilan4@gmail.com	Your Listing was Rejected: Harjii 2	pending	\N	2025-12-19 21:31:23.176462
30	\N	\N	harjimilan4@gmail.com	Your Listing was Rejected: harji New Lot	pending	\N	2025-12-19 21:31:37.671092
31	\N	\N	harjimilan4@gmail.com	Your Listing was Rejected: harji New Lot	pending	\N	2025-12-19 21:31:49.458966
32	\N	\N	harjimilan4@gmail.com	Your Listing was Rejected: Harjii 2	pending	\N	2025-12-19 21:35:44.69094
33	\N	\N	harjimilan4@gmail.com	Your Listing was Rejected: ani	pending	\N	2025-12-19 21:40:39.314564
34	\N	\N	harjimilan4@gmail.com	Your Listing was Rejected: ani	pending	\N	2025-12-19 21:40:45.56899
35	\N	\N	listing@gmail.com	Your Listing was Rejected: Sammple Title	pending	\N	2025-12-19 21:40:58.866351
36	\N	\N	harjimilan4@gmail.com	Your Listing was Rejected: THIS IS THE PROPERTY TITLE	pending	\N	2025-12-19 21:44:30.445267
37	\N	\N	harjimilan4@gmail.com	Your Listing was Rejected: PROPERTY TITLE	pending	\N	2025-12-19 21:44:38.834821
38	\N	\N	harjimilan4@gmail.com	Your Listing was Rejected: Property Title	pending	\N	2025-12-19 21:46:52.916278
39	\N	\N	harjimilan4@gmail.com	Your Listing was Rejected: PROPERTY TITLE	pending	\N	2025-12-19 22:57:48.715071
40	39	8	harjimilan4@gmail.com	New Inquiry: PROPERTY TITLE	pending	\N	2025-12-19 23:09:30.757517
41	39	9	harjimilan4@gmail.com	New Inquiry: PROPERTY TITLE 2	pending	\N	2025-12-19 23:22:51.418689
\.


--
-- Data for Name: inquiries; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.inquiries (id, listing_id, contact_number, email, company, message, owner_id, is_read, created_at, sender_user_id, full_name) FROM stdin;
9	29	639674014644	harjiimesh5@gmail.com	\N	\N	39	f	2025-12-19 23:22:51.080806	40	harjiimesh5
8	28	123123	harjiimesh5@gmail.com	\N	12312	39	f	2025-12-19 23:09:30.550346	40	harjiimesh5
\.


--
-- Data for Name: listing_approvals; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.listing_approvals (id, listing_id, listing_status, submitted_at, submitted_by, admin_approved_at, admin_approved_by, admin_notes, head_admin_approved_at, head_admin_approved_by, head_admin_notes, rejected_at, rejection_reason, created_at, updated_at) FROM stdin;
15	29	published	2025-12-19 22:21:51.968583	39	2025-12-19 23:08:05.3928	28	\N	2025-12-19 23:08:10.959034	28	\N	2025-12-19 23:06:28.939334	Violates platform terms and conditions	2025-12-19 22:21:51.968583	2025-12-19 22:21:51.968583
16	30	published	2025-12-19 23:00:16.491286	39	2025-12-19 23:08:05.384603	28	\N	2025-12-19 23:08:10.959264	28	\N	2025-12-19 23:06:28.940813	Violates platform terms and conditions	2025-12-19 23:00:16.491286	2025-12-19 23:00:16.491286
14	28	published	2025-12-19 22:21:25.68937	39	2025-12-19 23:08:53.654832	28	\N	2025-12-19 23:08:53.861917	28	\N	2025-12-19 23:08:41.763275	Violates platform terms and conditions	2025-12-19 22:21:25.68937	2025-12-19 22:21:25.68937
18	32	admin_approved	2025-12-20 18:44:05.202482	39	2025-12-20 20:29:12.126374	28	\N	\N	\N	\N	2025-12-20 20:29:10.328529	Duplicate listing	2025-12-20 18:44:05.202482	2025-12-20 18:44:05.202482
17	31	rejected	2025-12-19 23:01:48.0351	39	2025-12-20 20:30:26.727157	28	\N	2025-12-20 20:30:26.938303	28	\N	2025-12-20 21:07:51.114425	Property does not meet listing requirements	2025-12-19 23:01:48.0351	2025-12-19 23:01:48.0351
\.


--
-- Data for Name: listing_notifications; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.listing_notifications (id, user_id, listing_id, listing_title, status, reason, is_read, created_at) FROM stdin;
74	39	32	PROPERTY TITLE 3	system_admin_approved	\N	f	2025-12-20 18:44:55.621166
75	39	31	Propery Title	published	\N	f	2025-12-20 20:29:02.197276
76	39	31	Propery Title	published	\N	f	2025-12-20 20:30:27.059102
9	22	8	bahay ni juswa	approved	\N	f	2025-12-10 15:58:23.044084
12	22	8	bahay ni juswa	rejected	Violates platform terms and conditions	f	2025-12-10 17:35:43.646414
20	12	11	Residential Lot w/ Title	rejected	Violates platform terms and conditions	f	2025-12-11 02:33:53.403269
25	33	17	123	rejected	Violates platform terms and conditions	f	2025-12-17 20:48:21.112836
26	33	16	123	rejected	Violates platform terms and conditions	f	2025-12-17 20:48:24.183056
40	29	22	Sammple Title	rejected	Duplicate listing	f	2025-12-19 21:40:58.739579
\.


--
-- Data for Name: listings; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.listings (id, owner_first_name, owner_last_name, title, description, type, size_sqm, price, oct_tct_url, tax_declaration_url, doas_url, government_id_url, image_url, approved, status, views, inquiries, created_at, updated_at, latitude, longitude, owner_id, rejection_reason, owner_name, sold_to_user_id, sold_date, listing_status) FROM stdin;
30	OWNER	NAME	Property Title	desc	For Lease	250.00	25000.00	/uploads/1766185216262-asp9lh.png	/uploads/1766185216275-43u4oh.png	\N	\N	/uploads/1766185216246-pxwdni.png	f	approved	0	0	2025-12-20 07:00:16.414	2025-12-20 07:00:16.414	14.124278	122.819681	39	\N	\N	\N	\N	active
28	OWNER	NAME	PROPERTY TITLE	DESC	For Lease	250.00	25000.00	/uploads/1766182885500-qoxyi7.jpg	/uploads/1766182885505-zcnvow.jpg	\N	\N	/uploads/1766182885492-9bs1qo.jpg	f	approved	0	1	2025-12-20 06:21:25.618	2025-12-19 22:57:48.506279	14.149405	122.814789	39	Violates platform terms and conditions	\N	40	2025-12-20 12:34:28.026877	sold
32	OWNER	NAME	PROPERTY TITLE 3	desc	For Lease	25.00	20000.00	/uploads/1766256241842-p5z01n.png	/uploads/1766256241888-sltlzf.png	\N	\N	/uploads/1766256241791-5pse67.png	f	rejected	0	0	2025-12-21 02:44:02.608	2025-12-21 02:44:02.608	14.155561	122.828350	39	\N	\N	\N	\N	active
14	business2	business2	business2	12313	For Lease	111.00	100000.00	/uploads/1765918745994-nsxwlc.pdf	/uploads/1765918746013-plgbu0.jpg	\N	\N	/uploads/1765918745986-j1m18i.jpg	f	pending	0	0	2025-12-17 04:59:06.106	2025-12-17 04:59:06.106	14.151734	122.834530	33	\N	\N	\N	\N	active
29	OWNER	NAME 2	PROPERTY TITLE 2	DDESC 2 	For Lease	234.00	121212.00	/uploads/1766182911806-trdaz5.png	/uploads/1766182911809-ymiolw.png	\N	\N	/uploads/1766182911794-j5t8a2.png	f	approved	0	1	2025-12-20 06:21:51.902	2025-12-20 06:21:51.902	14.176359	122.837963	39	\N	\N	40	2025-12-20 12:43:48.746479	sold
31	Haydz	Robles	Propery Title	desc	For Lease	222.00	1212.00	/uploads/1766185307872-3srxsl.jpg	/uploads/1766185307877-8byvyq.jpg	\N	\N	/uploads/1766185307859-c000o5.jpg	f	rejected	0	0	2025-12-20 07:01:47.97	2025-12-20 07:01:47.97	14.152067	122.856159	39	\N	\N	\N	\N	active
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
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
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.messages (id, inquiry_id, sender_user_id, sender_name, sender_email, body, attachment_stored, attachment_original, is_read, deleted, created_at) FROM stdin;
10	9	40	harjiimesh5	harjiimesh5@gmail.com	heyyy	\N	\N	f	f	2025-12-20 18:23:42.229278
11	8	40	harjiimesh5	harjiimesh5@gmail.com	heyey 2	\N	\N	f	f	2025-12-20 18:23:47.092289
12	9	39	Harjiimesh4	harjimilan4@gmail.com	heyyy	\N	\N	f	f	2025-12-20 18:24:08.790496
13	8	39	Harjiimesh4	harjimilan4@gmail.com	heyy 2	\N	\N	f	f	2025-12-20 18:24:13.694946
\.


--
-- Data for Name: migration_log; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.migration_log (id, name, executed_at, status) FROM stdin;
1	add_email_verification_columns	2025-12-17 20:34:16.056609	completed
\.


--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.notification_preferences (id, user_id, email_new_inquiry, email_digest, created_at) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
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
17	verification_admin	view_verification_queue	2025-12-15 17:54:35.089302
18	verification_admin	verify_user_identity	2025-12-15 17:54:35.089302
19	verification_admin	review_id_documents	2025-12-15 17:54:35.089302
20	verification_admin	send_verification_otp	2025-12-15 17:54:35.089302
21	verification_admin	create_verification_admin	2025-12-15 17:54:35.089302
22	verification_admin	approve_verified_users	2025-12-15 17:54:35.089302
48	head_admin	manage_admins	2025-12-17 13:07:32.28823
52	head_admin	generate_reports	2025-12-17 13:07:32.28823
63	verification_admin	view_verification_history	2025-12-17 13:07:32.28823
65	business	view_own_listings	2025-12-17 13:07:32.28823
66	business	submit_listings	2025-12-17 13:07:32.28823
67	business	edit_own_profile	2025-12-17 13:07:32.28823
68	business	view_own_verification_status	2025-12-17 13:07:32.28823
189	system_admin	view_submitted_listings	2025-12-19 20:06:02.22754
190	system_admin	approve_listings_initial	2025-12-19 20:06:02.22754
191	system_admin	request_listing_revisions	2025-12-19 20:06:02.22754
192	system_admin	add_listing_notes	2025-12-19 20:06:02.22754
193	system_admin	view_listing_stats	2025-12-19 20:06:02.22754
194	system_admin	reject_listings	2025-12-19 20:06:02.22754
195	system_admin	approve_success_stories	2025-12-19 20:06:02.22754
196	system_admin	reject_success_stories	2025-12-19 20:06:02.22754
197	system_admin	edit_index_page	2025-12-19 20:06:02.22754
198	system_admin	manage_page_content	2025-12-19 20:06:02.22754
199	head_admin	edit_all_business_listings	2025-12-19 20:06:02.22754
200	head_admin	publish_all_listings	2025-12-19 20:06:02.22754
201	head_admin	create_system_admin	2025-12-19 20:06:02.22754
\.


--
-- Data for Name: sales_transactions; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.sales_transactions (id, listing_id, seller_id, buyer_id, inquiry_id, sale_price, sale_date, created_at) FROM stdin;
5	28	39	40	8	25000.00	2025-12-19 23:10:20.304287	2025-12-19 23:10:20.304287
6	29	39	40	9	121212.00	2025-12-19 23:23:20.960849	2025-12-19 23:23:20.960849
7	28	39	40	8	25000.00	2025-12-20 12:34:22.57635	2025-12-20 12:34:22.57635
8	28	39	40	8	25000.00	2025-12-20 12:34:27.981464	2025-12-20 12:34:27.981464
9	29	39	40	9	121212.00	2025-12-20 12:43:48.703871	2025-12-20 12:43:48.703871
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
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
-- Data for Name: success_stories; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.success_stories (id, investor_id, listing_id, image_url, location, business_name, description, business_type, established_year, key_achievement, contact_email, status, system_admin_notes, head_admin_notes, approved_by_system_admin_id, approved_by_head_admin_id, approved_at, created_at, updated_at, category) FROM stdin;
10	40	28	/uploads/1766253354593-rrq47t.jpg	labo	NEWONE	desc	Café	2025	123	harjiimesh5@gmail.com	published			29	28	2025-12-20 17:57:07.930237	2025-12-20 17:55:58.580253	2025-12-20 17:57:07.930237	resort
9	40	29	/uploads/1766252798886-5seu7x.jpg	labo	BUKOJUICE	desc	Café	2022	123	harjiimesh5@gmail.com	published			29	28	2025-12-20 20:30:46.361298	2025-12-20 17:46:43.41139	2025-12-20 20:30:46.361298	resort
\.


--
-- Data for Name: uploads_meta; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.uploads_meta (id, listing_id, field_name, stored_filename, original_filename, created_at) FROM stdin;
64	14	image	1765918745986-j1m18i.jpg	548205135_4277317599223717_995612057335324569_n.jpg	2025-12-16 20:59:06.209817
65	14	oct_tct	1765918745994-nsxwlc.pdf	Cancellation-Behavior-Analysis-of-Uber-Users (1).pdf	2025-12-16 20:59:06.25086
66	14	tax_declaration	1765918746013-plgbu0.jpg	548205135_4277317599223717_995612057335324569_n.jpg	2025-12-16 20:59:06.291383
106	28	image	1766182885492-9bs1qo.jpg	548205135_4277317599223717_995612057335324569_n.jpg	2025-12-19 22:21:25.769371
107	28	oct_tct	1766182885500-qoxyi7.jpg	548205135_4277317599223717_995612057335324569_n.jpg	2025-12-19 22:21:25.812311
108	28	tax_declaration	1766182885505-zcnvow.jpg	548205135_4277317599223717_995612057335324569_n.jpg	2025-12-19 22:21:25.853608
109	29	image	1766182911794-j5t8a2.png	Property 2.png	2025-12-19 22:21:52.056884
110	29	oct_tct	1766182911806-trdaz5.png	Property 2.png	2025-12-19 22:21:52.098801
111	29	tax_declaration	1766182911809-ymiolw.png	Property 2.png	2025-12-19 22:21:52.140354
112	30	image	1766185216246-pxwdni.png	Property 2.png	2025-12-19 23:00:16.580283
113	30	oct_tct	1766185216262-asp9lh.png	Property 2.png	2025-12-19 23:00:16.623285
114	30	tax_declaration	1766185216275-43u4oh.png	Property 2.png	2025-12-19 23:00:16.665889
115	31	image	1766185307859-c000o5.jpg	597157658_1910681699876375_9073262341688385699_n.jpg	2025-12-19 23:01:48.117826
116	31	oct_tct	1766185307872-3srxsl.jpg	597157658_1910681699876375_9073262341688385699_n.jpg	2025-12-19 23:01:48.159592
117	31	tax_declaration	1766185307877-8byvyq.jpg	597157658_1910681699876375_9073262341688385699_n.jpg	2025-12-19 23:01:48.200567
118	32	image	1766256241791-5pse67.png	Property 1.png	2025-12-20 18:44:05.288285
119	32	oct_tct	1766256241842-p5z01n.png	Property 1.png	2025-12-20 18:44:05.340572
120	32	tax_declaration	1766256241888-sltlzf.png	Property 1.png	2025-12-20 18:44:05.382169
\.


--
-- Data for Name: user_listings; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.user_listings (id, user_id, listing_id, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.users (id, username, email, password, role, created_at, contact_number, bio, profile_picture_url, admin_role, is_verified, verification_status, verified_at, verified_by, phone_number, id_document_url, id_document_verified, user_type, email_verified, verification_code, verification_code_expiry) FROM stdin;
45	Gwy	gwynethcaballero107@gmail.com	$2b$10$RjhhHB6Miss3gh.RyIGTx.VgqY1uFwGWLS7pkU1zXZFgSOlIss9PW	investor	2025-12-19 02:51:37.392009	\N	\N	\N	\N	f	unverified	\N	\N	\N	\N	f	investor	t	\N	\N
36	email	harjiimesh2@gmail.com	$2b$10$XFeBUWdPOoIIUSBvHRE3xePd.hD5g2UCN0ksv1dZCil.0qU0X39gS	business	2025-12-16 19:46:37.595282	\N	\N	\N	\N	t	unverified	\N	\N	\N	\N	f	business	f	665703	2025-12-17 04:16:37.567
44	Dexter	dextervalencia33@gmail.com	$2b$10$DSQFrDHNFca3JEr/FEw9/uP8BF.8z7QK790JxhZWeph9eMkeOKQZe	business	2025-12-19 02:34:28.091942	\N	\N	\N	\N	t	unverified	\N	\N	\N	\N	f	business	t	\N	\N
29	listing	listing@gmail.com	$2b$10$jO1vDLYhxmirfmkR25ZUz.qOXQC2IsZxStqLmduY7o0BGXVU7TWYO	admin	2025-12-15 18:24:14.96277	\N	\N	\N	system_admin	t	unverified	\N	\N	\N	\N	f	business	f	\N	\N
34	systems	systems@gmail.com	$2b$10$N3nhXIokGWSJ7g8AJy5FOeYSwGb4aIhkvA.wn5OtOUvD2rwd2aHkW	admin	2025-12-15 21:08:35.632673	\N	\N	\N	system_admin	t	unverified	\N	\N	\N	\N	f	business	f	\N	\N
46	Harjii Verify	harjiimeshverify@gmail.com	$2b$10$WyBFh/0DIDHhT8QtAwU..uL0YNJQpASCA34mlTzCxg7yvlFGHX7VW	admin	2025-12-19 23:43:55.137448	\N	\N	\N	verification_admin	t	unverified	\N	\N	\N	\N	f	business	f	\N	\N
47	Dexie Lei	dextervalencia77@gmail.com	$2b$10$JaA82krL6vr/R2wenUS7aOgtF23FDSlrHsL45aqPxRBxBPGLxiini	investor	2025-12-20 13:07:44.991891	+63 920 581 0250	Ah eh ah eh	/uploads/1766246506407-1d1njr.jpg	\N	f	unverified	\N	\N	\N	\N	f	investor	t	\N	\N
40	harjiimesh5233	harjiimesh5@gmail.com	$2b$10$Bs8nShi7OQMFlZj2BqPfqODSzClSF/Ckwz426aYwrHl6EBxQb44HK	investor	2025-12-16 20:06:50.885277	\N	\N	\N	\N	t	unverified	\N	\N	\N	\N	f	investor	t	\N	\N
28	admin	admin@gmail.com	$2b$10$9Qg7EISb3Yc1kJo2E7c7pOYFYj4E8nltnly5ZFKGHSGFliiMte.My	admin	2025-12-15 18:07:58.94496	\N	\N	\N	head_admin	t	unverified	\N	\N	\N	\N	f	business	f	\N	\N
30	verify	verify@gmail.com	$2b$10$YZTtbpni0CXfvbH/noxWRODH7sKwO/kEPG2BGZqnUkyiJfZ673jWG	admin	2025-12-15 18:24:46.656699	\N	\N	\N	verification_admin	t	unverified	\N	\N	\N	\N	f	business	f	\N	\N
31	Business	business@gmail.com	$2b$10$bwgvZ8tUsLlGluZT1Qhc/umtUdTFmYZzBBSKPaKQ4D4q1Lzop79iW	user	2025-12-15 18:34:19.439912	\N	\N	\N	\N	f	unverified	\N	\N	\N	\N	f	business	f	\N	\N
32	Investor	investor@gmail.com	$2b$10$kkYu6eKkI8lJlLyIJpmomORN9PxJxcMEa6yxUwaaNyqbyGJG8OaQ.	user	2025-12-15 18:34:33.685025	\N	\N	\N	\N	f	unverified	\N	\N	\N	\N	f	investor	f	\N	\N
33	Business2	business2@gmail.com	$2b$10$kIL2O23i3coLVLvm54VDYeV.aP0dvrQ30F4XHJvLCJBHIZ/8hsMPW	business	2025-12-15 20:38:38.571132	\N	\N	\N	\N	t	unverified	\N	\N	\N	\N	f	business	f	\N	\N
35	investor2	investor2@gmail.com	$2b$10$l/yjXcoL0nXrZ.ljivzHruE/nwqEjTRT3HyIdGxTl5/bX3Ek5XpKy	investor	2025-12-15 21:45:05.707138	\N	\N	\N	\N	f	unverified	\N	\N	\N	\N	f	investor	f	\N	\N
37	harji	harji3445@gmail.com	$2b$10$YSdColvoImA0yW9moAxKNeXI8pwTNK3fMuViTDFWOcSgLRtN6QPE.	business	2025-12-16 19:49:32.214012	\N	\N	\N	\N	f	unverified	\N	\N	\N	\N	f	business	f	156849	2025-12-17 04:20:11.79
38	Henjimesh	harjii3445@gmail.com	$2b$10$ZS6MUKQf.aup4LCOM.VHIeL3VwW68/dAW7GtZyDWIBI1BqNL0MJXG	business	2025-12-16 19:55:17.318012	\N	\N	\N	\N	t	unverified	\N	\N	\N	\N	f	business	t	\N	\N
39	Harjiimesh4	harjimilan4@gmail.com	$2b$10$XHUvDF229blcVRhZIkuhteqGsCG0VsRXyOyvr5EP9hDCwuH3DrxKa	business	2025-12-16 20:01:10.808655	\N	\N	\N	\N	t	unverified	\N	\N	\N	\N	f	business	t	\N	\N
41	Harjiimesh Milan	whyanothertoo@gmail.com	$2b$10$Dsm4Y1cTo6UXEbs1dhICsOChvTfbFbStBFaZ03o8VWPF83QR3D9GG	investor	2025-12-17 21:50:48.601241	\N	\N	\N	\N	f	unverified	\N	\N	\N	\N	f	investor	f	875349	2025-12-17 22:34:54.22
42	Admin Sample	hagupitsalenjohnjester@gmail.com	$2b$10$Y7ziBwC7EKGog6J7AhT3aeP/leHQiYNGpluTwdiKKSJfhQfg6pZpG	business	2025-12-19 02:32:29.790931	\N	\N	\N	\N	f	unverified	\N	\N	\N	\N	f	business	f	752887	2025-12-19 03:03:22.504
\.


--
-- Data for Name: verification_requests; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.verification_requests (id, user_id, status, phone_number, id_document_url, otp_code, otp_sent_at, otp_verified_at, otp_attempts, verified_by, verified_at, rejection_reason, created_at, updated_at, email, selfie_photo_url) FROM stdin;
1	32	otp_sent	09674014644	\N	779105	2025-12-16 02:34:47.444	\N	0	\N	\N	\N	2025-12-15 18:34:48.32236	2025-12-15 18:34:48.32236	\N	\N
2	32	otp_sent	+6309674014644	\N	498569	2025-12-16 02:36:04.422	\N	0	\N	\N	\N	2025-12-15 18:36:05.306314	2025-12-15 18:36:05.306314	\N	\N
3	32	otp_sent	+639674014644	\N	282892	2025-12-16 02:37:12.453	\N	0	\N	\N	\N	2025-12-15 18:37:13.337082	2025-12-15 18:37:13.337082	\N	\N
4	31	rejected	+639674014644	\N	\N	\N	\N	0	\N	\N	\N	2025-12-15 18:58:24.882386	2025-12-15 18:58:24.882386	\N	\N
17	31	verified	09674014644	/uploads/1765829653412-9lc3cw.jpg	\N	\N	\N	0	\N	2025-12-15 20:14:42.720848	\N	2025-12-15 20:14:15.896152	2025-12-15 20:14:15.896152	\N	\N
18	33	verified	09674014644	/uploads/1765831145632-k8tpp2.jpg	\N	\N	\N	0	\N	2025-12-15 20:39:44.940338	\N	2025-12-15 20:39:06.562273	2025-12-15 20:39:06.562273	\N	\N
19	38	verified	09674014644	/uploads/1765915141894-5fk68b.jpg	\N	\N	\N	0	\N	2025-12-16 20:00:25.012122	\N	2025-12-16 19:59:01.929198	2025-12-16 19:59:01.929198	\N	\N
20	40	verified	09674014644	/uploads/1765916755540-yjfz0m.jpg	\N	\N	\N	0	\N	2025-12-16 20:30:25.307812	\N	2025-12-16 20:25:56.117648	2025-12-16 20:25:56.117648	\N	\N
22	39	verified	\N	/uploads/1766003850056-fbqa16	\N	\N	\N	0	\N	2025-12-17 20:43:47.82343	\N	2025-12-17 20:37:30.989069	2025-12-17 20:37:31.032015	harjimilan4@gmail.com	/uploads/1766003850055-les5ui
23	36	verified	\N	/uploads/1766092562294-rrwuup	\N	\N	\N	0	\N	2025-12-19 03:17:08.510755	\N	2025-12-18 21:16:03.100081	2025-12-18 21:16:03.144778	harjiimesh2@gmail.com	/uploads/1766092562293-2gxuf1
24	44	verified	\N	/uploads/1766114348092-g0zg7j.png	\N	\N	\N	0	\N	2025-12-19 03:19:42.733306	\N	2025-12-19 03:19:08.192585	2025-12-19 03:19:08.198195	dextervalencia33@gmail.com	/uploads/1766114347800-axbvot.png
25	47	pending_admin_review	\N	/uploads/1766240932795-7coq20.jpg	\N	\N	\N	0	\N	\N	\N	2025-12-20 14:28:54.358956	2025-12-20 14:28:54.366628	dextervalencia77@gmail.com	/uploads/1766240932661-gh0hvz.jpg
\.


--
-- Name: account_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.account_notifications_id_seq', 2, true);


--
-- Name: admin_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.admin_tokens_id_seq', 2, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 166, true);


--
-- Name: economic_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.economic_data_id_seq', 11, true);


--
-- Name: email_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.email_logs_id_seq', 41, true);


--
-- Name: inquiries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.inquiries_id_seq', 9, true);


--
-- Name: listing_approvals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.listing_approvals_id_seq', 18, true);


--
-- Name: listing_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.listing_notifications_id_seq', 76, true);


--
-- Name: listings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.listings_id_seq', 32, true);


--
-- Name: locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.locations_id_seq', 6, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.messages_id_seq', 13, true);


--
-- Name: migration_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.migration_log_id_seq', 4, true);


--
-- Name: notification_preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.notification_preferences_id_seq', 1, false);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 201, true);


--
-- Name: sales_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.sales_transactions_id_seq', 9, true);


--
-- Name: success_stories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.success_stories_id_seq', 10, true);


--
-- Name: uploads_meta_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.uploads_meta_id_seq', 120, true);


--
-- Name: user_listings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.user_listings_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.users_id_seq', 47, true);


--
-- Name: verification_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.verification_requests_id_seq', 25, true);


--
-- Name: account_notifications account_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.account_notifications
    ADD CONSTRAINT account_notifications_pkey PRIMARY KEY (id);


--
-- Name: admin_roles admin_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.admin_roles
    ADD CONSTRAINT admin_roles_pkey PRIMARY KEY (id);


--
-- Name: admin_roles admin_roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.admin_roles
    ADD CONSTRAINT admin_roles_role_name_key UNIQUE (role_name);


--
-- Name: admin_tokens admin_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.admin_tokens
    ADD CONSTRAINT admin_tokens_pkey PRIMARY KEY (id);


--
-- Name: admin_tokens admin_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.admin_tokens
    ADD CONSTRAINT admin_tokens_token_key UNIQUE (token);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: economic_data economic_data_key_key; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.economic_data
    ADD CONSTRAINT economic_data_key_key UNIQUE (key);


--
-- Name: economic_data economic_data_pkey; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.economic_data
    ADD CONSTRAINT economic_data_pkey PRIMARY KEY (id);


--
-- Name: email_logs email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_pkey PRIMARY KEY (id);


--
-- Name: inquiries inquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_pkey PRIMARY KEY (id);


--
-- Name: listing_approvals listing_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.listing_approvals
    ADD CONSTRAINT listing_approvals_pkey PRIMARY KEY (id);


--
-- Name: listing_notifications listing_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.listing_notifications
    ADD CONSTRAINT listing_notifications_pkey PRIMARY KEY (id);


--
-- Name: listings listings_pkey; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: migration_log migration_log_name_key; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.migration_log
    ADD CONSTRAINT migration_log_name_key UNIQUE (name);


--
-- Name: migration_log migration_log_pkey; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.migration_log
    ADD CONSTRAINT migration_log_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);


--
-- Name: role_permissions role_permissions_admin_role_permission_key; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_admin_role_permission_key UNIQUE (admin_role, permission);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: sales_transactions sales_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.sales_transactions
    ADD CONSTRAINT sales_transactions_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: success_stories success_stories_pkey; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.success_stories
    ADD CONSTRAINT success_stories_pkey PRIMARY KEY (id);


--
-- Name: uploads_meta uploads_meta_pkey; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.uploads_meta
    ADD CONSTRAINT uploads_meta_pkey PRIMARY KEY (id);


--
-- Name: user_listings user_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.user_listings
    ADD CONSTRAINT user_listings_pkey PRIMARY KEY (id);


--
-- Name: user_listings user_listings_user_id_listing_id_key; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.user_listings
    ADD CONSTRAINT user_listings_user_id_listing_id_key UNIQUE (user_id, listing_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: verification_requests verification_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.verification_requests
    ADD CONSTRAINT verification_requests_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: idx_audit_logs_admin_id; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_audit_logs_admin_id ON public.audit_logs USING btree (admin_id);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: idx_listing_approvals_listing_id; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_listing_approvals_listing_id ON public.listing_approvals USING btree (listing_id);


--
-- Name: idx_listing_approvals_listing_status; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_listing_approvals_listing_status ON public.listing_approvals USING btree (listing_status);


--
-- Name: idx_listing_approvals_system_admin; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_listing_approvals_system_admin ON public.listing_approvals USING btree (listing_status) WHERE ((listing_status)::text = ANY ((ARRAY['system_admin_approved'::character varying, 'admin_approved'::character varying])::text[]));


--
-- Name: idx_listings_approved; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_listings_approved ON public.listings USING btree (approved);


--
-- Name: idx_listings_created_at; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_listings_created_at ON public.listings USING btree (created_at DESC);


--
-- Name: idx_listings_latitude; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_listings_latitude ON public.listings USING btree (latitude);


--
-- Name: idx_listings_longitude; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_listings_longitude ON public.listings USING btree (longitude);


--
-- Name: idx_listings_sold_status; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_listings_sold_status ON public.listings USING btree (listing_status);


--
-- Name: idx_listings_sold_to_user; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_listings_sold_to_user ON public.listings USING btree (sold_to_user_id);


--
-- Name: idx_listings_status; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_listings_status ON public.listings USING btree (status);


--
-- Name: idx_locations_coordinates; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_locations_coordinates ON public.locations USING btree (latitude, longitude);


--
-- Name: idx_messages_inquiry_id; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_messages_inquiry_id ON public.messages USING btree (inquiry_id);


--
-- Name: idx_migration_log_name; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_migration_log_name ON public.migration_log USING btree (name);


--
-- Name: idx_sales_buyer_id; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_sales_buyer_id ON public.sales_transactions USING btree (buyer_id);


--
-- Name: idx_sales_listing_id; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_sales_listing_id ON public.sales_transactions USING btree (listing_id);


--
-- Name: idx_sales_seller_id; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_sales_seller_id ON public.sales_transactions USING btree (seller_id);


--
-- Name: idx_success_stories_category; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_success_stories_category ON public.success_stories USING btree (category);


--
-- Name: idx_success_stories_created_at; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_success_stories_created_at ON public.success_stories USING btree (created_at DESC);


--
-- Name: idx_success_stories_investor_id; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_success_stories_investor_id ON public.success_stories USING btree (investor_id);


--
-- Name: idx_success_stories_listing_id; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_success_stories_listing_id ON public.success_stories USING btree (listing_id);


--
-- Name: idx_success_stories_status; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_success_stories_status ON public.success_stories USING btree (status);


--
-- Name: idx_success_stories_system_admin; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_success_stories_system_admin ON public.success_stories USING btree (status) WHERE ((status)::text = ANY ((ARRAY['system_admin_approved'::character varying, 'published'::character varying])::text[]));


--
-- Name: idx_users_admin_role; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_users_admin_role ON public.users USING btree (admin_role);


--
-- Name: idx_users_is_verified; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_users_is_verified ON public.users USING btree (is_verified);


--
-- Name: idx_users_user_type; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_users_user_type ON public.users USING btree (user_type);


--
-- Name: idx_users_verification_code; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_users_verification_code ON public.users USING btree (verification_code) WHERE (verification_code IS NOT NULL);


--
-- Name: idx_verification_email; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_verification_email ON public.verification_requests USING btree (email);


--
-- Name: idx_verification_requests_status; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_verification_requests_status ON public.verification_requests USING btree (status);


--
-- Name: idx_verification_requests_user_id; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_verification_requests_user_id ON public.verification_requests USING btree (user_id);


--
-- Name: idx_verification_selfie; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_verification_selfie ON public.verification_requests USING btree (selfie_photo_url);


--
-- Name: idx_verification_selfie_photo; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_verification_selfie_photo ON public.verification_requests USING btree (selfie_photo_url);


--
-- Name: idx_verification_status; Type: INDEX; Schema: public; Owner: db_4c25_user
--

CREATE INDEX idx_verification_status ON public.verification_requests USING btree (status);


--
-- Name: account_notifications account_notifications_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.account_notifications
    ADD CONSTRAINT account_notifications_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id);


--
-- Name: account_notifications account_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.account_notifications
    ADD CONSTRAINT account_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id);


--
-- Name: email_logs fk_email_logs_inquiry_id_inquiries; Type: FK CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT fk_email_logs_inquiry_id_inquiries FOREIGN KEY (inquiry_id) REFERENCES public.inquiries(id);


--
-- Name: email_logs fk_email_logs_user_id_users; Type: FK CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT fk_email_logs_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: inquiries fk_inquiries_listing_id_listings; Type: FK CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT fk_inquiries_listing_id_listings FOREIGN KEY (listing_id) REFERENCES public.listings(id);


--
-- Name: inquiries fk_inquiries_owner_id_users; Type: FK CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT fk_inquiries_owner_id_users FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: listings fk_listings_owner_id_users; Type: FK CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT fk_listings_owner_id_users FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: notification_preferences fk_notification_prefs_user_id_users; Type: FK CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT fk_notification_prefs_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: uploads_meta fk_uploads_meta_listing_id_listings; Type: FK CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.uploads_meta
    ADD CONSTRAINT fk_uploads_meta_listing_id_listings FOREIGN KEY (listing_id) REFERENCES public.listings(id);


--
-- Name: user_listings fk_user_listings_listing_id_listings; Type: FK CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.user_listings
    ADD CONSTRAINT fk_user_listings_listing_id_listings FOREIGN KEY (listing_id) REFERENCES public.listings(id);


--
-- Name: user_listings fk_user_listings_user_id_users; Type: FK CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.user_listings
    ADD CONSTRAINT fk_user_listings_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: listing_approvals listing_approvals_admin_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.listing_approvals
    ADD CONSTRAINT listing_approvals_admin_approved_by_fkey FOREIGN KEY (admin_approved_by) REFERENCES public.users(id);


--
-- Name: listing_approvals listing_approvals_head_admin_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.listing_approvals
    ADD CONSTRAINT listing_approvals_head_admin_approved_by_fkey FOREIGN KEY (head_admin_approved_by) REFERENCES public.users(id);


--
-- Name: listing_approvals listing_approvals_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.listing_approvals
    ADD CONSTRAINT listing_approvals_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: listing_approvals listing_approvals_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.listing_approvals
    ADD CONSTRAINT listing_approvals_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.users(id);


--
-- Name: listings listings_sold_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_sold_to_user_id_fkey FOREIGN KEY (sold_to_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: sales_transactions sales_transactions_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.sales_transactions
    ADD CONSTRAINT sales_transactions_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sales_transactions sales_transactions_inquiry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.sales_transactions
    ADD CONSTRAINT sales_transactions_inquiry_id_fkey FOREIGN KEY (inquiry_id) REFERENCES public.inquiries(id) ON DELETE SET NULL;


--
-- Name: sales_transactions sales_transactions_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.sales_transactions
    ADD CONSTRAINT sales_transactions_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: sales_transactions sales_transactions_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.sales_transactions
    ADD CONSTRAINT sales_transactions_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: success_stories success_stories_approved_by_head_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.success_stories
    ADD CONSTRAINT success_stories_approved_by_head_admin_id_fkey FOREIGN KEY (approved_by_head_admin_id) REFERENCES public.users(id);


--
-- Name: success_stories success_stories_approved_by_listing_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.success_stories
    ADD CONSTRAINT success_stories_approved_by_listing_admin_id_fkey FOREIGN KEY (approved_by_system_admin_id) REFERENCES public.users(id);


--
-- Name: success_stories success_stories_investor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.success_stories
    ADD CONSTRAINT success_stories_investor_id_fkey FOREIGN KEY (investor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: success_stories success_stories_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.success_stories
    ADD CONSTRAINT success_stories_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: verification_requests verification_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.verification_requests
    ADD CONSTRAINT verification_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: verification_requests verification_requests_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.verification_requests
    ADD CONSTRAINT verification_requests_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON SEQUENCES TO db_4c25_user;


--
-- Name: DEFAULT PRIVILEGES FOR TYPES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TYPES TO db_4c25_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON FUNCTIONS TO db_4c25_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TABLES TO db_4c25_user;


--
-- PostgreSQL database dump complete
--

\unrestrict zYPYMJYYyufRzpg4jSKOAcupNa3PAgFWhZi7mf4uXWbPcudncBD6A11AjU3al3w

