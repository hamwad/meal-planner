-- =============================================================================
-- MEAL PLANNER - SUPABASE SCHEMA (WITHOUT RLS)
-- Simple setup for family meal sharing
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLES
-- =============================================================================

-- Families table
CREATE TABLE IF NOT EXISTS families (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Family members table
CREATE TABLE IF NOT EXISTS family_members (
  family_id uuid REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (family_id, user_id)
);

-- Meals table
CREATE TABLE IF NOT EXISTS meals (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id uuid REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  meal_id text NOT NULL,
  name text NOT NULL,
  default_servings integer NOT NULL,
  ingredients jsonb NOT NULL,
  recipe jsonb,
  tags jsonb,
  image_url text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Calendar meals table
CREATE TABLE IF NOT EXISTS calendar_meals (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id uuid REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  meal_id text NOT NULL,
  date text NOT NULL,
  servings_override integer,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS families_code_idx ON families(code);
CREATE INDEX IF NOT EXISTS meals_family_id_idx ON meals(family_id);
CREATE INDEX IF NOT EXISTS meals_meal_id_idx ON meals(meal_id);
CREATE INDEX IF NOT EXISTS calendar_meals_family_id_idx ON calendar_meals(family_id);
CREATE INDEX IF NOT EXISTS calendar_meals_date_idx ON calendar_meals(date);
CREATE INDEX IF NOT EXISTS family_members_user_id_idx ON family_members(user_id);

-- =============================================================================
-- DISABLE ROW LEVEL SECURITY
-- For simplicity, we're not using RLS. All authenticated users can access all data.
-- Family isolation is handled by the application layer.
-- =============================================================================

ALTER TABLE families DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE meals DISABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_meals DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_meals_updated_at ON meals;
CREATE TRIGGER update_meals_updated_at
  BEFORE UPDATE ON meals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_meals_updated_at ON calendar_meals;
CREATE TRIGGER update_calendar_meals_updated_at
  BEFORE UPDATE ON calendar_meals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- DONE!
-- You should see: "Success. No rows returned"
-- =============================================================================
