--
-- PostgreSQL database dump
--

\restrict YZcs6uIdrezGSTf6LdylxjEp4fjPjfW2FDjG78f7HJgc9DKJlrS5RvPDrYvYSJA

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
    first_name text,
    last_name text,
    contact_number text,
    email text,
    company text,
    message text,
    owner_id integer,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    sender_user_id integer
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
    owner_id integer
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
    created_at timestamp without time zone DEFAULT now()
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
-- Name: admin_tokens id; Type: DEFAULT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.admin_tokens ALTER COLUMN id SET DEFAULT nextval('public.admin_tokens_id_seq'::regclass);


--
-- Name: email_logs id; Type: DEFAULT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.email_logs ALTER COLUMN id SET DEFAULT nextval('public.email_logs_id_seq'::regclass);


--
-- Name: inquiries id; Type: DEFAULT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.inquiries ALTER COLUMN id SET DEFAULT nextval('public.inquiries_id_seq'::regclass);


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
-- Name: notification_preferences id; Type: DEFAULT; Schema: public; Owner: db_4c25_user
--

ALTER TABLE ONLY public.notification_preferences ALTER COLUMN id SET DEFAULT nextval('public.notification_preferences_id_seq'::regclass);


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
-- Data for Name: admin_tokens; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.admin_tokens (id, token, created_by, created_at, expires_at, used, used_by, used_at) FROM stdin;
\.


--
-- Data for Name: email_logs; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.email_logs (id, user_id, inquiry_id, email_address, subject, status, sent_at, created_at) FROM stdin;
\.


--
-- Data for Name: inquiries; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.inquiries (id, listing_id, first_name, last_name, contact_number, email, company, message, owner_id, is_read, created_at, sender_user_id) FROM stdin;
\.


--
-- Data for Name: listings; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.listings (id, owner_first_name, owner_last_name, title, description, type, size_sqm, price, oct_tct_url, tax_declaration_url, doas_url, government_id_url, image_url, approved, status, views, inquiries, created_at, updated_at, latitude, longitude, owner_id) FROM stdin;
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.locations (id, title, description, type, latitude, longitude, price, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.messages (id, inquiry_id, sender_user_id, sender_name, sender_email, body, attachment_stored, attachment_original, is_read, deleted, created_at) FROM stdin;
\.


--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.notification_preferences (id, user_id, email_new_inquiry, email_digest, created_at) FROM stdin;
\.


--
-- Data for Name: uploads_meta; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.uploads_meta (id, listing_id, field_name, stored_filename, original_filename, created_at) FROM stdin;
\.


--
-- Data for Name: user_listings; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.user_listings (id, user_id, listing_id, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: db_4c25_user
--

COPY public.users (id, username, email, password, role, created_at) FROM stdin;
1	test	test@gmail.com	123456	business	2025-12-04 21:00:28.518847
2	admin	admin@gmail.com	123456	admin	2025-12-04 21:01:10.748529
9	123	1223@gmail.com	$2b$10$Lhf6sDQDn1EMCDsIQIhBcupVAUGKXR4a11ozZYN5fy9KPhyPXJzkW	business	2025-12-04 21:19:34.972635
10	admind	admind@gmail.com	$2b$10$Co.Rm/J3ONqOT1JMoAHnWOWKRVqex3sh6hZaeo5SxDAS.TKOURnou	admin	2025-12-04 21:20:20.513808
11	dexter	dexter@gmail.com	$2b$10$.NcC.CRPpghvelqi376ew.e9KQC2PPXl96yNk5zF4WtwvkvfIbZxG	business	2025-12-04 21:24:21.073248
12	user1	user1@gmail.com	$2b$10$wSPIQGWwSR79ZQxeY5BGCOelOrHgR1ePLgl728Kt8Asg0s9Smvclm	business	2025-12-06 11:15:25.918824
13	user2	user2@gmail.com	$2b$10$lpaBNhZ9MqpuEMUYzyK2Y.9jWqD/X8mdjz4Z7EJo2TwdxSX6p7SBO	business	2025-12-06 11:15:48.630098
14	user3	user3@gmail.com	$2b$10$..F5n9FObP.TDpp8dosJ2uU94pACy/fiP/zc7c.xZBZeHY7gy3Jh.	business	2025-12-06 11:47:57.103112
15	admmiin	admin2@gmail.com	$2b$10$xG7SJKdd3W67kMnWAARtyOa1./yIRvZBxdNkjk2H0MuXIaCgMFYsC	user	2025-12-08 17:37:32.499638
16	admin3	admin3@gmail.com	$2b$10$VPBTygG3MaO1x5n0f3z2Z.wAq4O2sXv2OThZIJr73bLJmHr9lyJiC	admin	2025-12-08 17:47:44.526847
17	admin4	admin4@gmail.com	$2b$10$b/hNbtE1xpkzrJddFqolReZRpYciPm2.KZVphs6uvkdsAdXkJ5EC.	admin	2025-12-08 17:50:05.690511
18	Dexter	user4@gmail.com	$2b$10$iewGcfT7UuhuLNbbw9E2EutyS1WZrjsdnjgjkKg5amJVOxxpN6doy	business	2025-12-08 17:50:28.467651
\.


--
-- Name: admin_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.admin_tokens_id_seq', 1, false);


--
-- Name: email_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.email_logs_id_seq', 1, false);


--
-- Name: inquiries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.inquiries_id_seq', 1, false);


--
-- Name: listings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.listings_id_seq', 1, false);


--
-- Name: locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.locations_id_seq', 1, false);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.messages_id_seq', 1, false);


--
-- Name: notification_preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.notification_preferences_id_seq', 1, false);


--
-- Name: uploads_meta_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.uploads_meta_id_seq', 1, false);


--
-- Name: user_listings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.user_listings_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: db_4c25_user
--

SELECT pg_catalog.setval('public.users_id_seq', 18, true);


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

\unrestrict YZcs6uIdrezGSTf6LdylxjEp4fjPjfW2FDjG78f7HJgc9DKJlrS5RvPDrYvYSJA

