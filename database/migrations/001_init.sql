CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text,
  name text NOT NULL DEFAULT '',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS historical_events(
  id text PRIMARY KEY,
  slug text UNIQUE,
  title text NOT NULL,
  short_description text NOT NULL DEFAULT '',
  full_description text NOT NULL DEFAULT '',
  date_start date,
  date_end date,
  date_precision text NOT NULL DEFAULT 'unknown',
  date_confidence real NOT NULL DEFAULT .5,
  location geography(Point,4326),
  geometry geometry(Geometry,4326),
  location_radius_m integer,
  location_precision text NOT NULL DEFAULT 'unknown',
  location_confidence real NOT NULL DEFAULT .5,
  historical_place_name text NOT NULL DEFAULT '',
  modern_place_name text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  region text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  categories text[] NOT NULL DEFAULT '{}',
  importance_score real NOT NULL DEFAULT .5,
  confidence_score real NOT NULL DEFAULT .5,
  persons jsonb NOT NULL DEFAULT '[]',
  organizations jsonb NOT NULL DEFAULT '[]',
  places jsonb NOT NULL DEFAULT '[]',
  media jsonb NOT NULL DEFAULT '[]',
  sources jsonb NOT NULL DEFAULT '[]',
  significance text NOT NULL DEFAULT '',
  source_fingerprint text,
  verification_status text NOT NULL DEFAULT 'unreviewed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS historical_events_location_gix ON historical_events USING gist(location);
CREATE INDEX IF NOT EXISTS historical_events_geometry_gix ON historical_events USING gist(geometry);
CREATE INDEX IF NOT EXISTS historical_events_date_idx ON historical_events(date_start,date_end);
CREATE INDEX IF NOT EXISTS historical_events_categories_gin ON historical_events USING gin(categories);

CREATE TABLE IF NOT EXISTS event_sources(
  id bigserial PRIMARY KEY,
  event_id text REFERENCES historical_events(id) ON DELETE CASCADE,
  source_name text NOT NULL,
  source_url text NOT NULL,
  publisher text,
  source_tier text,
  license text,
  retrieved_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id,source_url)
);

CREATE TABLE IF NOT EXISTS bookmarks(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  state jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collections(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS annotations(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  geometry geometry(Geometry,4326) NOT NULL,
  content text NOT NULL DEFAULT '',
  valid_from date,
  valid_to date,
  visibility text NOT NULL DEFAULT 'private',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ingestion_runs(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  status text NOT NULL,
  cursor text,
  stats jsonb NOT NULL DEFAULT '{}',
  error text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
