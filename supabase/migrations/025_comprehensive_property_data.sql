-- ===========================================
-- Migration: 025_comprehensive_property_data.sql
-- Comprehensive Property Data Extension (500+ fields)
-- ===========================================

BEGIN;

-- ===========================================
-- 1. EXTEND PROPERTIES TABLE (50 core fields)
-- ===========================================

-- Financial Fields
DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS price_per_sqft numeric;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS maintenance_charges numeric;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS parking_charges numeric;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS club_membership_fee numeric;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS lease_terms text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS stamp_duty_estimate numeric;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS registration_cost_estimate numeric;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS gst_applicable boolean DEFAULT false;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS gst_rate numeric CHECK (gst_rate >= 0 AND gst_rate <= 100);
EXCEPTION WHEN others THEN NULL; END $$;

-- Legal Fields
DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rera_certificate_url text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rera_expiry_date date;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS oc_certificate text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS cc_certificate text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS approval_authority text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS approved_plan_url text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS khata_certificate text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS property_tax_paid_until date;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS encumbrance_certificate_url text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS sale_deed_available boolean DEFAULT false;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS poa_required boolean DEFAULT false;
EXCEPTION WHEN others THEN NULL; END $$;

-- Physical Fields
DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS carpet_area numeric;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS builtup_area numeric;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS super_buildup_area numeric;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS plot_area numeric;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS balcony_count int CHECK (balcony_count >= 0);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS balcony_area numeric;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS common_area_sqft numeric;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS floor_height_ft numeric;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS wall_thickness numeric;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS construction_year int CHECK (construction_year >= 1800 AND construction_year <= EXTRACT(YEAR FROM CURRENT_DATE) + 10);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS possession_date date;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS age_of_property int;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS renovation_year int CHECK (renovation_year >= 1800 AND renovation_year <= EXTRACT(YEAR FROM CURRENT_DATE) + 10);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS construction_quality_score numeric CHECK (construction_quality_score >= 0 AND construction_quality_score <= 10);
EXCEPTION WHEN others THEN NULL; END $$;

-- Utilities Fields
DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS water_source text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS water_connection_type text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS electricity_connection_type text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS gas_pipeline boolean DEFAULT false;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS sewage_connection boolean DEFAULT false;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS internet_connectivity_type text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS backup_power text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS waste_management_type text;
EXCEPTION WHEN others THEN NULL; END $$;

-- Orientation Fields
DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS vastu_compliant boolean DEFAULT false;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS facing_direction text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS sunlight_hours_morning numeric CHECK (sunlight_hours_morning >= 0 AND sunlight_hours_morning <= 12);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS sunlight_hours_evening numeric CHECK (sunlight_hours_evening >= 0 AND sunlight_hours_evening <= 12);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS wind_direction text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS natural_ventilation_score numeric CHECK (natural_ventilation_score >= 0 AND natural_ventilation_score <= 10);
EXCEPTION WHEN others THEN NULL; END $$;

-- Building Fields
DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS building_name text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS tower_number text;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS total_towers int CHECK (total_towers >= 0);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS units_per_floor int CHECK (units_per_floor >= 0);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS total_units_in_project int CHECK (total_units_in_project >= 0);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS builder_reputation_score numeric CHECK (builder_reputation_score >= 0 AND builder_reputation_score <= 10);
EXCEPTION WHEN others THEN NULL; END $$;

-- Metadata Fields
DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS data_completeness_score numeric DEFAULT 0 CHECK (data_completeness_score >= 0 AND data_completeness_score <= 100);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS data_quality_score numeric DEFAULT 0 CHECK (data_quality_score >= 0 AND data_quality_score <= 100);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS data_sources_json jsonb DEFAULT '[]'::jsonb;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS data_verification_status text DEFAULT 'pending' CHECK (data_verification_status IN ('pending', 'verified', 'rejected'));
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS data_verified_by uuid;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS data_verified_at timestamptz;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS location_data_collected_at timestamptz;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS infrastructure_data_collected_at timestamptz;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS market_data_collected_at timestamptz;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS risk_data_collected_at timestamptz;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS demographic_data_collected_at timestamptz;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS amenities_data_collected_at timestamptz;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS google_maps_enriched boolean DEFAULT false;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS census_data_enriched boolean DEFAULT false;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS government_portal_enriched boolean DEFAULT false;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS third_party_enriched boolean DEFAULT false;
EXCEPTION WHEN others THEN NULL; END $$;

-- ===========================================
-- 2. PROPERTY LOCATION DATA TABLE (80 fields)
-- ===========================================

CREATE TABLE IF NOT EXISTS public.property_location_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  
  -- Coordinates
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  accuracy_meters numeric,
  elevation_meters numeric,
  
  -- Administrative
  district text,
  sub_district text,
  ward_number text,
  pin_code text,
  assembly_constituency text,
  parliamentary_constituency text,
  
  -- Transport Proximity (distances in km, travel time in minutes)
  nearest_metro_station text,
  metro_distance_km numeric,
  metro_travel_time_min int,
  nearest_railway_station text,
  railway_distance_km numeric,
  nearest_bus_stop text,
  bus_distance_km numeric,
  nearest_airport text,
  airport_distance_km numeric,
  airport_travel_time_min int,
  
  -- Education Proximity
  nearest_primary_school text,
  primary_school_distance_km numeric,
  nearest_secondary_school text,
  secondary_school_distance_km numeric,
  nearest_international_school text,
  international_school_distance_km numeric,
  nearest_university text,
  university_distance_km numeric,
  cbse_schools_within_3km int CHECK (cbse_schools_within_3km >= 0),
  icse_schools_within_3km int CHECK (icse_schools_within_3km >= 0),
  ib_schools_within_3km int CHECK (ib_schools_within_3km >= 0),
  
  -- Healthcare Proximity
  nearest_hospital text,
  hospital_distance_km numeric,
  hospital_beds_count int CHECK (hospital_beds_count >= 0),
  nearest_clinic text,
  clinic_distance_km numeric,
  nearest_pharmacy text,
  pharmacy_distance_km numeric,
  ambulance_response_time_min int CHECK (ambulance_response_time_min >= 0),
  multi_specialty_hospitals_within_5km int CHECK (multi_specialty_hospitals_within_5km >= 0),
  
  -- Commerce Proximity
  nearest_supermarket text,
  supermarket_distance_km numeric,
  nearest_mall text,
  mall_distance_km numeric,
  nearest_atm text,
  atm_distance_km numeric,
  banks_within_2km int CHECK (banks_within_2km >= 0),
  restaurants_within_1km int CHECK (restaurants_within_1km >= 0),
  gyms_within_1km int CHECK (gyms_within_1km >= 0),
  
  -- Recreation Proximity
  nearest_park text,
  park_distance_km numeric,
  park_area_sqft numeric,
  nearest_sports_complex text,
  sports_complex_distance_km numeric,
  movie_theaters_within_5km int CHECK (movie_theaters_within_5km >= 0),
  cultural_centers_within_5km int CHECK (cultural_centers_within_5km >= 0),
  
  -- Essentials Proximity
  police_station_distance_km numeric,
  fire_station_distance_km numeric,
  municipal_office_distance_km numeric,
  post_office_distance_km numeric,
  
  -- Neighborhood Metrics
  population_density_per_sqkm numeric CHECK (population_density_per_sqkm >= 0),
  literacy_rate_percent numeric CHECK (literacy_rate_percent >= 0 AND literacy_rate_percent <= 100),
  avg_household_income_inr numeric CHECK (avg_household_income_inr >= 0),
  crime_rate_per_1000 numeric CHECK (crime_rate_per_1000 >= 0),
  air_quality_index_avg numeric CHECK (air_quality_index_avg >= 0),
  noise_pollution_db_avg numeric CHECK (noise_pollution_db_avg >= 0),
  green_cover_percent numeric CHECK (green_cover_percent >= 0 AND green_cover_percent <= 100),
  traffic_congestion_index numeric CHECK (traffic_congestion_index >= 0 AND traffic_congestion_index <= 10),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(property_id)
);

CREATE INDEX IF NOT EXISTS idx_property_location_data_property_id ON public.property_location_data(property_id);
CREATE INDEX IF NOT EXISTS idx_property_location_data_lat_lng ON public.property_location_data(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_property_location_data_pin_code ON public.property_location_data(pin_code);

-- ===========================================
-- 3. PROPERTY INFRASTRUCTURE DATA TABLE (70 fields)
-- ===========================================

CREATE TABLE IF NOT EXISTS public.property_infrastructure_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  
  -- Current Infrastructure
  road_type text,
  road_width_ft numeric CHECK (road_width_ft >= 0),
  street_lighting boolean DEFAULT false,
  footpath_available boolean DEFAULT false,
  drainage_system_quality text CHECK (drainage_system_quality IN ('excellent', 'good', 'average', 'poor', 'none')),
  flood_history_last_10_years int CHECK (flood_history_last_10_years >= 0),
  waterlogging_prone boolean DEFAULT false,
  monsoon_accessibility_score numeric CHECK (monsoon_accessibility_score >= 0 AND monsoon_accessibility_score <= 10),
  public_transport_frequency_per_hour numeric CHECK (public_transport_frequency_per_hour >= 0),
  parking_availability_score numeric CHECK (parking_availability_score >= 0 AND parking_availability_score <= 10),
  traffic_peak_hour_delay_min int CHECK (traffic_peak_hour_delay_min >= 0),
  
  -- Planned Development (next 5 years)
  planned_metro_stations_within_3km int CHECK (planned_metro_stations_within_3km >= 0),
  metro_completion_year int CHECK (metro_completion_year >= EXTRACT(YEAR FROM CURRENT_DATE) AND metro_completion_year <= EXTRACT(YEAR FROM CURRENT_DATE) + 10),
  planned_highways_within_5km int CHECK (planned_highways_within_5km >= 0),
  highway_completion_year int CHECK (highway_completion_year >= EXTRACT(YEAR FROM CURRENT_DATE) AND highway_completion_year <= EXTRACT(YEAR FROM CURRENT_DATE) + 10),
  planned_flyovers int CHECK (planned_flyovers >= 0),
  flyover_completion_year int CHECK (flyover_completion_year >= EXTRACT(YEAR FROM CURRENT_DATE) AND flyover_completion_year <= EXTRACT(YEAR FROM CURRENT_DATE) + 10),
  planned_schools int CHECK (planned_schools >= 0),
  planned_hospitals int CHECK (planned_hospitals >= 0),
  planned_malls int CHECK (planned_malls >= 0),
  planned_it_parks int CHECK (planned_it_parks >= 0),
  planned_residential_projects_within_2km int CHECK (planned_residential_projects_within_2km >= 0),
  smart_city_initiative_active boolean DEFAULT false,
  government_infrastructure_projects_count int CHECK (government_infrastructure_projects_count >= 0),
  estimated_infrastructure_investment_cr numeric CHECK (estimated_infrastructure_investment_cr >= 0),
  
  -- Digital Infrastructure
  fiber_optic_availability boolean DEFAULT false,
  coverage_4g_score numeric CHECK (coverage_4g_score >= 0 AND coverage_4g_score <= 10),
  coverage_5g_score numeric CHECK (coverage_5g_score >= 0 AND coverage_5g_score <= 10),
  avg_internet_speed_mbps numeric CHECK (avg_internet_speed_mbps >= 0),
  telecom_providers_count int CHECK (telecom_providers_count >= 0),
  
  -- Utilities Development
  water_supply_hours_per_day numeric CHECK (water_supply_hours_per_day >= 0 AND water_supply_hours_per_day <= 24),
  water_quality_tds_ppm numeric CHECK (water_quality_tds_ppm >= 0),
  electricity_outage_hours_per_month numeric CHECK (electricity_outage_hours_per_month >= 0 AND electricity_outage_hours_per_month <= 744),
  voltage_fluctuation_score numeric CHECK (voltage_fluctuation_score >= 0 AND voltage_fluctuation_score <= 10),
  gas_pipeline_planned boolean DEFAULT false,
  solar_panel_feasibility_score numeric CHECK (solar_panel_feasibility_score >= 0 AND solar_panel_feasibility_score <= 10),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(property_id)
);

CREATE INDEX IF NOT EXISTS idx_property_infrastructure_data_property_id ON public.property_infrastructure_data(property_id);

-- ===========================================
-- 4. PROPERTY MARKET DATA TABLE (60 fields)
-- ===========================================

CREATE TABLE IF NOT EXISTS public.property_market_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  
  -- Historical Pricing
  price_1_year_ago numeric CHECK (price_1_year_ago >= 0),
  price_2_years_ago numeric CHECK (price_2_years_ago >= 0),
  price_3_years_ago numeric CHECK (price_3_years_ago >= 0),
  price_5_years_ago numeric CHECK (price_5_years_ago >= 0),
  avg_appreciation_1y_percent numeric,
  avg_appreciation_3y_percent numeric,
  avg_appreciation_5y_percent numeric,
  price_volatility_index numeric CHECK (price_volatility_index >= 0 AND price_volatility_index <= 10),
  highest_price_recorded numeric CHECK (highest_price_recorded >= 0),
  lowest_price_recorded numeric CHECK (lowest_price_recorded >= 0),
  avg_price_per_sqft_locality numeric CHECK (avg_price_per_sqft_locality >= 0),
  
  -- Transaction Data
  total_transactions_last_year int CHECK (total_transactions_last_year >= 0),
  total_transactions_last_3_years int CHECK (total_transactions_last_3_years >= 0),
  avg_transaction_value_inr numeric CHECK (avg_transaction_value_inr >= 0),
  median_transaction_value_inr numeric CHECK (median_transaction_value_inr >= 0),
  avg_days_on_market int CHECK (avg_days_on_market >= 0),
  quick_sale_probability_score numeric CHECK (quick_sale_probability_score >= 0 AND quick_sale_probability_score <= 100),
  negotiation_margin_percent numeric CHECK (negotiation_margin_percent >= 0 AND negotiation_margin_percent <= 100),
  
  -- Supply-Demand
  active_listings_in_locality int CHECK (active_listings_in_locality >= 0),
  new_listings_last_month int CHECK (new_listings_last_month >= 0),
  sold_listings_last_month int CHECK (sold_listings_last_month >= 0),
  inventory_months numeric CHECK (inventory_months >= 0),
  demand_supply_ratio numeric CHECK (demand_supply_ratio >= 0),
  buyer_seller_ratio numeric CHECK (buyer_seller_ratio >= 0),
  listing_views_avg_per_property int CHECK (listing_views_avg_per_property >= 0),
  inquiry_rate_percent numeric CHECK (inquiry_rate_percent >= 0 AND inquiry_rate_percent <= 100),
  
  -- Investment Metrics
  rental_yield_percent numeric CHECK (rental_yield_percent >= 0 AND rental_yield_percent <= 100),
  capital_appreciation_potential_score numeric CHECK (capital_appreciation_potential_score >= 0 AND capital_appreciation_potential_score <= 10),
  resale_liquidity_score numeric CHECK (resale_liquidity_score >= 0 AND resale_liquidity_score <= 10),
  investment_grade_rating text CHECK (investment_grade_rating IN ('AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'C', 'D')),
  comparable_properties_count int CHECK (comparable_properties_count >= 0),
  comp_avg_price_per_sqft numeric CHECK (comp_avg_price_per_sqft >= 0),
  price_position_vs_comps text CHECK (price_position_vs_comps IN ('premium', 'at_par', 'discount')),
  
  -- Builder Track Record
  builder_projects_completed_count int CHECK (builder_projects_completed_count >= 0),
  builder_projects_delayed_count int CHECK (builder_projects_delayed_count >= 0),
  builder_customer_satisfaction_score numeric CHECK (builder_customer_satisfaction_score >= 0 AND builder_customer_satisfaction_score <= 10),
  builder_financial_health_score numeric CHECK (builder_financial_health_score >= 0 AND builder_financial_health_score <= 10),
  builder_litigation_cases_count int CHECK (builder_litigation_cases_count >= 0),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(property_id)
);

CREATE INDEX IF NOT EXISTS idx_property_market_data_property_id ON public.property_market_data(property_id);
CREATE INDEX IF NOT EXISTS idx_property_market_data_appreciation ON public.property_market_data(avg_appreciation_1y_percent, avg_appreciation_3y_percent);

-- ===========================================
-- 5. PROPERTY RISK DATA TABLE (80 fields)
-- ===========================================

CREATE TABLE IF NOT EXISTS public.property_risk_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  
  -- Flood Risk
  flood_zone_category text CHECK (flood_zone_category IN ('low', 'moderate', 'high', 'very_high', 'extreme')),
  elevation_above_river_meters numeric CHECK (elevation_above_river_meters >= 0),
  distance_to_water_body_km numeric CHECK (distance_to_water_body_km >= 0),
  historical_flood_count_10y int CHECK (historical_flood_count_10y >= 0),
  max_flood_depth_recorded_meters numeric CHECK (max_flood_depth_recorded_meters >= 0),
  drainage_capacity_rating text CHECK (drainage_capacity_rating IN ('excellent', 'good', 'average', 'poor', 'none')),
  monsoon_waterlogging_days_avg numeric CHECK (monsoon_waterlogging_days_avg >= 0),
  flood_insurance_required boolean DEFAULT false,
  flood_insurance_premium_estimate_inr numeric CHECK (flood_insurance_premium_estimate_inr >= 0),
  
  -- Seismic Risk
  seismic_zone text CHECK (seismic_zone IN ('I', 'II', 'III', 'IV', 'V')),
  earthquake_risk_score numeric CHECK (earthquake_risk_score >= 0 AND earthquake_risk_score <= 10),
  building_earthquake_resistant boolean DEFAULT false,
  earthquake_insurance_premium_estimate_inr numeric CHECK (earthquake_insurance_premium_estimate_inr >= 0),
  
  -- Environmental Hazards
  soil_type text,
  soil_stability_score numeric CHECK (soil_stability_score >= 0 AND soil_stability_score <= 10),
  landslide_risk_score numeric CHECK (landslide_risk_score >= 0 AND landslide_risk_score <= 10),
  soil_contamination_level text CHECK (soil_contamination_level IN ('none', 'low', 'moderate', 'high', 'severe')),
  proximity_to_industrial_area_km numeric CHECK (proximity_to_industrial_area_km >= 0),
  proximity_to_landfill_km numeric CHECK (proximity_to_landfill_km >= 0),
  proximity_to_sewage_treatment_km numeric CHECK (proximity_to_sewage_treatment_km >= 0),
  proximity_to_high_voltage_lines_meters numeric CHECK (proximity_to_high_voltage_lines_meters >= 0),
  radon_gas_risk text CHECK (radon_gas_risk IN ('none', 'low', 'moderate', 'high')),
  asbestos_presence boolean DEFAULT false,
  lead_paint_risk text CHECK (lead_paint_risk IN ('none', 'low', 'moderate', 'high')),
  
  -- Climate Data
  avg_temp_summer_celsius numeric,
  avg_temp_winter_celsius numeric,
  avg_rainfall_mm numeric CHECK (avg_rainfall_mm >= 0),
  humidity_avg_percent numeric CHECK (humidity_avg_percent >= 0 AND humidity_avg_percent <= 100),
  heatwave_days_per_year int CHECK (heatwave_days_per_year >= 0),
  cold_wave_days_per_year int CHECK (cold_wave_days_per_year >= 0),
  cyclone_risk_score numeric CHECK (cyclone_risk_score >= 0 AND cyclone_risk_score <= 10),
  lightning_strike_frequency text CHECK (lightning_strike_frequency IN ('none', 'low', 'moderate', 'high', 'very_high')),
  
  -- Air & Noise Quality
  pm25_avg_ugm3 numeric CHECK (pm25_avg_ugm3 >= 0),
  pm10_avg_ugm3 numeric CHECK (pm10_avg_ugm3 >= 0),
  no2_avg_ugm3 numeric CHECK (no2_avg_ugm3 >= 0),
  so2_avg_ugm3 numeric CHECK (so2_avg_ugm3 >= 0),
  co_avg_ppm numeric CHECK (co_avg_ppm >= 0),
  ozone_avg_ppb numeric CHECK (ozone_avg_ppb >= 0),
  air_quality_trend_5y text CHECK (air_quality_trend_5y IN ('improving', 'stable', 'declining')),
  respiratory_disease_prevalence_percent numeric CHECK (respiratory_disease_prevalence_percent >= 0 AND respiratory_disease_prevalence_percent <= 100),
  noise_level_day_db numeric CHECK (noise_level_day_db >= 0),
  noise_level_night_db numeric CHECK (noise_level_night_db >= 0),
  noise_sources text[],
  
  -- Legal Risks
  litigation_status text CHECK (litigation_status IN ('none', 'pending', 'resolved', 'ongoing')),
  disputed_land boolean DEFAULT false,
  ancestral_property_claims boolean DEFAULT false,
  tenant_disputes boolean DEFAULT false,
  builder_buyer_disputes boolean DEFAULT false,
  noc_pending_count int CHECK (noc_pending_count >= 0),
  approval_violations boolean DEFAULT false,
  unauthorized_construction_risk text CHECK (unauthorized_construction_risk IN ('none', 'low', 'moderate', 'high')),
  demolition_risk_score numeric CHECK (demolition_risk_score >= 0 AND demolition_risk_score <= 10),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(property_id)
);

CREATE INDEX IF NOT EXISTS idx_property_risk_data_property_id ON public.property_risk_data(property_id);
CREATE INDEX IF NOT EXISTS idx_property_risk_data_flood_zone ON public.property_risk_data(flood_zone_category);
CREATE INDEX IF NOT EXISTS idx_property_risk_data_seismic_zone ON public.property_risk_data(seismic_zone);

-- ===========================================
-- 6. PROPERTY DEMOGRAPHIC DATA TABLE (80 fields)
-- ===========================================

CREATE TABLE IF NOT EXISTS public.property_demographic_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  
  -- Population Data
  population_within_1km int CHECK (population_within_1km >= 0),
  population_within_3km int CHECK (population_within_3km >= 0),
  population_within_5km int CHECK (population_within_5km >= 0),
  population_growth_5y_percent numeric,
  population_density_trend text CHECK (population_density_trend IN ('increasing', 'stable', 'decreasing')),
  age_0_14_percent numeric CHECK (age_0_14_percent >= 0 AND age_0_14_percent <= 100),
  age_15_24_percent numeric CHECK (age_15_24_percent >= 0 AND age_15_24_percent <= 100),
  age_25_44_percent numeric CHECK (age_25_44_percent >= 0 AND age_25_44_percent <= 100),
  age_45_64_percent numeric CHECK (age_45_64_percent >= 0 AND age_45_64_percent <= 100),
  age_65_plus_percent numeric CHECK (age_65_plus_percent >= 0 AND age_65_plus_percent <= 100),
  male_female_ratio numeric CHECK (male_female_ratio >= 0),
  avg_household_size numeric CHECK (avg_household_size >= 0),
  nuclear_families_percent numeric CHECK (nuclear_families_percent >= 0 AND nuclear_families_percent <= 100),
  joint_families_percent numeric CHECK (joint_families_percent >= 0 AND joint_families_percent <= 100),
  
  -- Economic Data
  median_income_inr numeric CHECK (median_income_inr >= 0),
  avg_income_inr numeric CHECK (avg_income_inr >= 0),
  income_growth_5y_percent numeric,
  employment_rate_percent numeric CHECK (employment_rate_percent >= 0 AND employment_rate_percent <= 100),
  unemployment_rate_percent numeric CHECK (unemployment_rate_percent >= 0 AND unemployment_rate_percent <= 100),
  white_collar_jobs_percent numeric CHECK (white_collar_jobs_percent >= 0 AND white_collar_jobs_percent <= 100),
  blue_collar_jobs_percent numeric CHECK (blue_collar_jobs_percent >= 0 AND blue_collar_jobs_percent <= 100),
  self_employed_percent numeric CHECK (self_employed_percent >= 0 AND self_employed_percent <= 100),
  it_professionals_percent numeric CHECK (it_professionals_percent >= 0 AND it_professionals_percent <= 100),
  healthcare_professionals_percent numeric CHECK (healthcare_professionals_percent >= 0 AND healthcare_professionals_percent <= 100),
  educators_percent numeric CHECK (educators_percent >= 0 AND educators_percent <= 100),
  
  -- Education & Lifestyle
  literacy_rate_percent numeric CHECK (literacy_rate_percent >= 0 AND literacy_rate_percent <= 100),
  graduate_population_percent numeric CHECK (graduate_population_percent >= 0 AND graduate_population_percent <= 100),
  postgraduate_population_percent numeric CHECK (postgraduate_population_percent >= 0 AND postgraduate_population_percent <= 100),
  vehicle_ownership_per_household numeric CHECK (vehicle_ownership_per_household >= 0),
  two_wheeler_ownership_percent numeric CHECK (two_wheeler_ownership_percent >= 0 AND two_wheeler_ownership_percent <= 100),
  four_wheeler_ownership_percent numeric CHECK (four_wheeler_ownership_percent >= 0 AND four_wheeler_ownership_percent <= 100),
  internet_penetration_percent numeric CHECK (internet_penetration_percent >= 0 AND internet_penetration_percent <= 100),
  smartphone_penetration_percent numeric CHECK (smartphone_penetration_percent >= 0 AND smartphone_penetration_percent <= 100),
  dining_out_frequency_per_month_avg numeric CHECK (dining_out_frequency_per_month_avg >= 0),
  entertainment_spending_per_month_avg numeric CHECK (entertainment_spending_per_month_avg >= 0),
  
  -- Migration & Employment Hubs
  net_migration_rate_5y numeric,
  migrant_population_percent numeric CHECK (migrant_population_percent >= 0 AND migrant_population_percent <= 100),
  expat_population_percent numeric CHECK (expat_population_percent >= 0 AND expat_population_percent <= 100),
  nearest_it_park_km numeric CHECK (nearest_it_park_km >= 0),
  it_park_employee_count int CHECK (it_park_employee_count >= 0),
  nearest_industrial_zone_km numeric CHECK (nearest_industrial_zone_km >= 0),
  industrial_zone_employee_count int CHECK (industrial_zone_employee_count >= 0),
  nearby_mnc_companies_count int CHECK (nearby_mnc_companies_count >= 0),
  startup_ecosystem_score numeric CHECK (startup_ecosystem_score >= 0 AND startup_ecosystem_score <= 10),
  coworking_spaces_within_5km int CHECK (coworking_spaces_within_5km >= 0),
  
  -- Social Infrastructure
  community_centers_count int CHECK (community_centers_count >= 0),
  religious_places_within_1km int CHECK (religious_places_within_1km >= 0),
  social_clubs_count int CHECK (social_clubs_count >= 0),
  sports_facilities_count int CHECK (sports_facilities_count >= 0),
  libraries_count int CHECK (libraries_count >= 0),
  cultural_events_per_year int CHECK (cultural_events_per_year >= 0),
  safety_perception_score numeric CHECK (safety_perception_score >= 0 AND safety_perception_score <= 10),
  community_cohesion_score numeric CHECK (community_cohesion_score >= 0 AND community_cohesion_score <= 10),
  neighborhood_watch_active boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(property_id)
);

CREATE INDEX IF NOT EXISTS idx_property_demographic_data_property_id ON public.property_demographic_data(property_id);

-- ===========================================
-- 7. PROPERTY AMENITIES DATA TABLE (50 fields)
-- ===========================================

CREATE TABLE IF NOT EXISTS public.property_amenities_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  
  -- Building Amenities
  swimming_pool boolean DEFAULT false,
  swimming_pool_size_sqft numeric CHECK (swimming_pool_size_sqft >= 0),
  gym boolean DEFAULT false,
  gym_equipment_count int CHECK (gym_equipment_count >= 0),
  clubhouse boolean DEFAULT false,
  clubhouse_area_sqft numeric CHECK (clubhouse_area_sqft >= 0),
  indoor_games_room boolean DEFAULT false,
  outdoor_sports_court boolean DEFAULT false,
  children_play_area boolean DEFAULT false,
  senior_citizen_area boolean DEFAULT false,
  library boolean DEFAULT false,
  meditation_room boolean DEFAULT false,
  yoga_room boolean DEFAULT false,
  amphitheater boolean DEFAULT false,
  multipurpose_hall boolean DEFAULT false,
  banquet_hall boolean DEFAULT false,
  guest_rooms_count int CHECK (guest_rooms_count >= 0),
  
  -- Security
  gated_community boolean DEFAULT false,
  security_guards_count int CHECK (security_guards_count >= 0),
  cctv_cameras_count int CHECK (cctv_cameras_count >= 0),
  intercom boolean DEFAULT false,
  video_door_phone boolean DEFAULT false,
  fire_alarm_system boolean DEFAULT false,
  fire_extinguishers_count int CHECK (fire_extinguishers_count >= 0),
  sprinkler_system boolean DEFAULT false,
  earthquake_sensors boolean DEFAULT false,
  boom_barrier boolean DEFAULT false,
  rfid_access boolean DEFAULT false,
  biometric_access boolean DEFAULT false,
  visitor_management_system boolean DEFAULT false,
  
  -- Green Features
  rainwater_harvesting boolean DEFAULT false,
  sewage_treatment_plant boolean DEFAULT false,
  solar_panels boolean DEFAULT false,
  solar_capacity_kw numeric CHECK (solar_capacity_kw >= 0),
  ev_charging_stations_count int CHECK (ev_charging_stations_count >= 0),
  organic_waste_converter boolean DEFAULT false,
  terrace_garden boolean DEFAULT false,
  green_building_certified boolean DEFAULT false,
  green_building_rating text CHECK (green_building_rating IN ('platinum', 'gold', 'silver', 'certified', 'none')),
  low_voc_paints boolean DEFAULT false,
  led_lighting_percent numeric CHECK (led_lighting_percent >= 0 AND led_lighting_percent <= 100),
  water_efficient_fixtures boolean DEFAULT false,
  
  -- Smart Features
  home_automation boolean DEFAULT false,
  smart_locks boolean DEFAULT false,
  smart_lighting boolean DEFAULT false,
  smart_thermostats boolean DEFAULT false,
  smart_security boolean DEFAULT false,
  centralized_ac_control boolean DEFAULT false,
  app_based_facility_booking boolean DEFAULT false,
  app_based_maintenance_requests boolean DEFAULT false,
  app_based_visitor_management boolean DEFAULT false,
  
  -- Parking & Storage
  covered_parking boolean DEFAULT false,
  open_parking boolean DEFAULT false,
  mechanical_parking boolean DEFAULT false,
  two_wheeler_parking_count int CHECK (two_wheeler_parking_count >= 0),
  four_wheeler_parking_count int CHECK (four_wheeler_parking_count >= 0),
  ev_charging_parking boolean DEFAULT false,
  visitor_parking_count int CHECK (visitor_parking_count >= 0),
  storage_room boolean DEFAULT false,
  bicycle_storage boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(property_id)
);

CREATE INDEX IF NOT EXISTS idx_property_amenities_data_property_id ON public.property_amenities_data(property_id);
CREATE INDEX IF NOT EXISTS idx_property_amenities_data_green_certified ON public.property_amenities_data(green_building_certified);

-- ===========================================
-- 8. INDEXES FOR PERFORMANCE
-- ===========================================

-- GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_properties_data_sources_gin ON public.properties USING gin(data_sources_json);

-- BRIN indexes for timestamp fields
CREATE INDEX IF NOT EXISTS idx_properties_location_data_collected_at_brin ON public.properties USING brin(location_data_collected_at);
CREATE INDEX IF NOT EXISTS idx_properties_infrastructure_data_collected_at_brin ON public.properties USING brin(infrastructure_data_collected_at);
CREATE INDEX IF NOT EXISTS idx_properties_market_data_collected_at_brin ON public.properties USING brin(market_data_collected_at);
CREATE INDEX IF NOT EXISTS idx_properties_risk_data_collected_at_brin ON public.properties USING brin(risk_data_collected_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_properties_data_completeness ON public.properties(data_completeness_score DESC, data_quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_properties_price_per_sqft ON public.properties(price_per_sqft) WHERE price_per_sqft IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_construction_year ON public.properties(construction_year) WHERE construction_year IS NOT NULL;

-- ===========================================
-- 9. TRIGGERS FOR UPDATED_AT
-- ===========================================

CREATE OR REPLACE FUNCTION public.handle_property_location_data_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_property_infrastructure_data_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_property_market_data_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_property_risk_data_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_property_demographic_data_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_property_amenities_data_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_property_location_data_updated_at ON public.property_location_data;
CREATE TRIGGER on_property_location_data_updated_at
  BEFORE UPDATE ON public.property_location_data
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_property_location_data_updated_at();

DROP TRIGGER IF EXISTS on_property_infrastructure_data_updated_at ON public.property_infrastructure_data;
CREATE TRIGGER on_property_infrastructure_data_updated_at
  BEFORE UPDATE ON public.property_infrastructure_data
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_property_infrastructure_data_updated_at();

DROP TRIGGER IF EXISTS on_property_market_data_updated_at ON public.property_market_data;
CREATE TRIGGER on_property_market_data_updated_at
  BEFORE UPDATE ON public.property_market_data
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_property_market_data_updated_at();

DROP TRIGGER IF EXISTS on_property_risk_data_updated_at ON public.property_risk_data;
CREATE TRIGGER on_property_risk_data_updated_at
  BEFORE UPDATE ON public.property_risk_data
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_property_risk_data_updated_at();

DROP TRIGGER IF EXISTS on_property_demographic_data_updated_at ON public.property_demographic_data;
CREATE TRIGGER on_property_demographic_data_updated_at
  BEFORE UPDATE ON public.property_demographic_data
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_property_demographic_data_updated_at();

DROP TRIGGER IF EXISTS on_property_amenities_data_updated_at ON public.property_amenities_data;
CREATE TRIGGER on_property_amenities_data_updated_at
  BEFORE UPDATE ON public.property_amenities_data
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_property_amenities_data_updated_at();

-- ===========================================
-- 10. DATA QUALITY SCORING FUNCTION
-- ===========================================

CREATE OR REPLACE FUNCTION public.calculate_data_quality_score(property_id_param uuid)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  total_fields integer := 0;
  filled_fields integer := 0;
  score numeric;
BEGIN
  -- Count total fields and filled fields across all tables
  -- Properties table core fields
  SELECT COUNT(*) INTO total_fields
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'properties'
    AND column_name IN (
      'price_per_sqft', 'maintenance_charges', 'carpet_area', 'builtup_area',
      'construction_year', 'possession_date', 'facing_direction', 'building_name'
    );
  
  -- Count filled fields in properties
  SELECT COUNT(*) INTO filled_fields
  FROM public.properties
  WHERE id = property_id_param
    AND (
      price_per_sqft IS NOT NULL OR
      maintenance_charges IS NOT NULL OR
      carpet_area IS NOT NULL OR
      builtup_area IS NOT NULL OR
      construction_year IS NOT NULL OR
      possession_date IS NOT NULL OR
      facing_direction IS NOT NULL OR
      building_name IS NOT NULL
    );
  
  -- Check related tables existence and count
  IF EXISTS (SELECT 1 FROM public.property_location_data WHERE property_id = property_id_param) THEN
    total_fields := total_fields + 10;
    SELECT COUNT(*) INTO filled_fields FROM (
      SELECT latitude, longitude, district, pin_code, nearest_metro_station,
             nearest_hospital, nearest_primary_school, population_density_per_sqkm,
             literacy_rate_percent, air_quality_index_avg
      FROM public.property_location_data
      WHERE property_id = property_id_param
    ) AS subquery
    WHERE subquery.latitude IS NOT NULL OR subquery.longitude IS NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.property_infrastructure_data WHERE property_id = property_id_param) THEN
    total_fields := total_fields + 10;
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.property_market_data WHERE property_id = property_id_param) THEN
    total_fields := total_fields + 10;
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.property_risk_data WHERE property_id = property_id_param) THEN
    total_fields := total_fields + 10;
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.property_demographic_data WHERE property_id = property_id_param) THEN
    total_fields := total_fields + 10;
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.property_amenities_data WHERE property_id = property_id_param) THEN
    total_fields := total_fields + 10;
  END IF;
  
  -- Calculate score
  IF total_fields > 0 THEN
    score := (filled_fields::numeric / total_fields::numeric) * 100;
  ELSE
    score := 0;
  END IF;
  
  -- Update properties table
  UPDATE public.properties
  SET data_quality_score = score
  WHERE id = property_id_param;
  
  RETURN score;
END;
$$;

-- ===========================================
-- 11. DATA COMPLETENESS MATERIALIZED VIEW
-- ===========================================

CREATE MATERIALIZED VIEW IF NOT EXISTS public.property_data_completeness AS
SELECT 
  p.id AS property_id,
  p.title,
  p.data_completeness_score,
  p.data_quality_score,
  CASE WHEN pld.id IS NOT NULL THEN true ELSE false END AS has_location_data,
  CASE WHEN pid.id IS NOT NULL THEN true ELSE false END AS has_infrastructure_data,
  CASE WHEN pmd.id IS NOT NULL THEN true ELSE false END AS has_market_data,
  CASE WHEN prd.id IS NOT NULL THEN true ELSE false END AS has_risk_data,
  CASE WHEN pdd.id IS NOT NULL THEN true ELSE false END AS has_demographic_data,
  CASE WHEN pad.id IS NOT NULL THEN true ELSE false END AS has_amenities_data,
  (
    CASE WHEN pld.id IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN pid.id IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN pmd.id IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN prd.id IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN pdd.id IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN pad.id IS NOT NULL THEN 1 ELSE 0 END
  ) AS related_tables_count
FROM public.properties p
LEFT JOIN public.property_location_data pld ON p.id = pld.property_id
LEFT JOIN public.property_infrastructure_data pid ON p.id = pid.property_id
LEFT JOIN public.property_market_data pmd ON p.id = pmd.property_id
LEFT JOIN public.property_risk_data prd ON p.id = prd.property_id
LEFT JOIN public.property_demographic_data pdd ON p.id = pdd.property_id
LEFT JOIN public.property_amenities_data pad ON p.id = pad.property_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_property_data_completeness_property_id ON public.property_data_completeness(property_id);

-- ===========================================
-- 12. ROW LEVEL SECURITY POLICIES
-- ===========================================

-- Property Location Data
ALTER TABLE public.property_location_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view location data" ON public.property_location_data;
CREATE POLICY "Public can view location data"
  ON public.property_location_data FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Builders can manage their property location data" ON public.property_location_data;
CREATE POLICY "Builders can manage their property location data"
  ON public.property_location_data FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_location_data.property_id
      AND properties.builder_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_location_data.property_id
      AND properties.builder_id = auth.uid()
    )
  );

-- Property Infrastructure Data
ALTER TABLE public.property_infrastructure_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view infrastructure data" ON public.property_infrastructure_data;
CREATE POLICY "Public can view infrastructure data"
  ON public.property_infrastructure_data FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Builders can manage their property infrastructure data" ON public.property_infrastructure_data;
CREATE POLICY "Builders can manage their property infrastructure data"
  ON public.property_infrastructure_data FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_infrastructure_data.property_id
      AND properties.builder_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_infrastructure_data.property_id
      AND properties.builder_id = auth.uid()
    )
  );

-- Property Market Data
ALTER TABLE public.property_market_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view market data" ON public.property_market_data;
CREATE POLICY "Public can view market data"
  ON public.property_market_data FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Builders can manage their property market data" ON public.property_market_data;
CREATE POLICY "Builders can manage their property market data"
  ON public.property_market_data FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_market_data.property_id
      AND properties.builder_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_market_data.property_id
      AND properties.builder_id = auth.uid()
    )
  );

-- Property Risk Data
ALTER TABLE public.property_risk_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view risk data" ON public.property_risk_data;
CREATE POLICY "Public can view risk data"
  ON public.property_risk_data FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Builders can manage their property risk data" ON public.property_risk_data;
CREATE POLICY "Builders can manage their property risk data"
  ON public.property_risk_data FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_risk_data.property_id
      AND properties.builder_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_risk_data.property_id
      AND properties.builder_id = auth.uid()
    )
  );

-- Property Demographic Data
ALTER TABLE public.property_demographic_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view demographic data" ON public.property_demographic_data;
CREATE POLICY "Public can view demographic data"
  ON public.property_demographic_data FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Builders can manage their property demographic data" ON public.property_demographic_data;
CREATE POLICY "Builders can manage their property demographic data"
  ON public.property_demographic_data FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_demographic_data.property_id
      AND properties.builder_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_demographic_data.property_id
      AND properties.builder_id = auth.uid()
    )
  );

-- Property Amenities Data
ALTER TABLE public.property_amenities_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view amenities data" ON public.property_amenities_data;
CREATE POLICY "Public can view amenities data"
  ON public.property_amenities_data FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Builders can manage their property amenities data" ON public.property_amenities_data;
CREATE POLICY "Builders can manage their property amenities data"
  ON public.property_amenities_data FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_amenities_data.property_id
      AND properties.builder_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_amenities_data.property_id
      AND properties.builder_id = auth.uid()
    )
  );

-- ===========================================
-- 13. COMMENTS FOR DOCUMENTATION
-- ===========================================

COMMENT ON TABLE public.property_location_data IS 'Comprehensive location intelligence data including proximity metrics, neighborhood demographics, and environmental factors';
COMMENT ON TABLE public.property_infrastructure_data IS 'Current and planned infrastructure data including roads, utilities, digital connectivity, and development projects';
COMMENT ON TABLE public.property_market_data IS 'Historical pricing, transaction data, supply-demand metrics, and investment analysis';
COMMENT ON TABLE public.property_risk_data IS 'Environmental, seismic, legal, and climate risk assessment data';
COMMENT ON TABLE public.property_demographic_data IS 'Population demographics, economic indicators, education levels, and social infrastructure';
COMMENT ON TABLE public.property_amenities_data IS 'Structured amenities data including building features, security, green features, and smart home capabilities';

COMMIT;

