-- Extend properties table with all columns referenced in the application code
-- Based on analysis of app/app/api/properties/[id]/route.ts

-- Add missing columns to properties table
DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS project text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS builder text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS parking int;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS floor int;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS total_floors int;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS facing text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS furnished text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS address text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rera_id text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS tour_url text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS brochure_url text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS floor_plan_images jsonb DEFAULT '[]'::jsonb;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS amenities jsonb DEFAULT '[]'::jsonb;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS listed_at timestamptz DEFAULT now();
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS listing_status text DEFAULT 'active';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS location text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS price numeric;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
EXCEPTION WHEN others THEN NULL; END $$;

-- Add indexes for commonly queried columns
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_locality ON public.properties(locality);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON public.properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_bedrooms ON public.properties(bedrooms);
CREATE INDEX IF NOT EXISTS idx_properties_price_inr ON public.properties(price_inr);
CREATE INDEX IF NOT EXISTS idx_properties_is_verified ON public.properties(is_verified);
CREATE INDEX IF NOT EXISTS idx_properties_listing_status ON public.properties(listing_status);
CREATE INDEX IF NOT EXISTS idx_properties_listed_at ON public.properties(listed_at DESC);

-- Add GIN index for JSONB columns for better search performance
CREATE INDEX IF NOT EXISTS idx_properties_amenities_gin ON public.properties USING gin(amenities);

-- Add constraint for listing_status
DO $$ BEGIN
  ALTER TABLE public.properties ADD CONSTRAINT properties_listing_status_check 
    CHECK (listing_status IN ('active', 'inactive', 'sold', 'rented', 'pending'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Updated at trigger for properties
CREATE OR REPLACE FUNCTION public.handle_properties_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_properties_updated_at ON public.properties;
CREATE TRIGGER on_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_properties_updated_at();

-- Add helpful comments
COMMENT ON COLUMN public.properties.project IS 'Project name or development name';
COMMENT ON COLUMN public.properties.builder IS 'Builder/developer name (denormalized for quick access)';
COMMENT ON COLUMN public.properties.rera_id IS 'Real Estate Regulatory Authority ID';
COMMENT ON COLUMN public.properties.tour_url IS 'URL to virtual tour (360° view, video, etc.)';
COMMENT ON COLUMN public.properties.brochure_url IS 'URL to downloadable property brochure PDF';
COMMENT ON COLUMN public.properties.images IS 'Array of image URLs in JSONB format';
COMMENT ON COLUMN public.properties.floor_plan_images IS 'Array of floor plan image URLs in JSONB format';
COMMENT ON COLUMN public.properties.amenities IS 'Array of amenity names in JSONB format';
COMMENT ON COLUMN public.properties.is_verified IS 'Whether the property listing has been verified by admin';
COMMENT ON COLUMN public.properties.listing_status IS 'Current status of the listing (active, sold, etc.)';
COMMENT ON COLUMN public.properties.location IS 'Combined location string for display';

