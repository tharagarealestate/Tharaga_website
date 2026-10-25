# 🚀 THARAGA COMPLETE IMPLEMENTATION GUIDE
## 40 Ultra-Detailed Prompts for Production-Ready Platform

**Version**: 2.0 Complete Edition
**Date**: 2025-01-15
**Timeline**: 24-30 months
**Investment**: ₹1.2-1.5 Crore
**Result**: Enterprise-grade, production-ready platform with mobile-first design

---

## 📚 TABLE OF CONTENTS

### **PART 1: BACKEND INFRASTRUCTURE** (Prompts #1-12)
- [Phase 1: Data Infrastructure](#phase-1-data-infrastructure) (Prompts #1-2)
- [Phase 2: Machine Learning](#phase-2-machine-learning) (Prompts #3-6)
- [Phase 3: Blockchain](#phase-3-blockchain) (Prompts #7-8)
- [Phase 4: Voice AI](#phase-4-voice-ai) (Prompt #9)
- [Phase 5: Real-Time Pipeline](#phase-5-real-time-pipeline) (Prompt #10)
- [Phase 6: Advanced Analytics](#phase-6-advanced-analytics) (Prompts #11-12)

### **PART 2: FRONTEND & USER EXPERIENCE** (Prompts #13-18)
- [Phase 7: Voice AI Frontend](#phase-7-voice-ai-frontend) (Prompt #13)
- [Phase 8: Real-Time Dashboards](#phase-8-real-time-dashboards) (Prompt #14)
- [Phase 9: ML Predictions UI](#phase-9-ml-predictions-ui) (Prompt #15)
- [Phase 10: Blockchain Verification UI](#phase-10-blockchain-verification-ui) (Prompt #16)
- [Phase 11: Risk Assessment Visualization](#phase-11-risk-assessment-visualization) (Prompt #17)
- [Phase 12: Property Data Display](#phase-12-property-data-display) (Prompt #18)

### **PART 3: QUALITY & RELIABILITY** (Prompts #19-23)
- [Phase 13: Testing Infrastructure](#phase-13-testing-infrastructure) (Prompts #19-20)
- [Phase 14: DevOps & Deployment](#phase-14-devops-deployment) (Prompts #21-23)

### **PART 4: ADMINISTRATION & MANAGEMENT** (Prompts #24-28)
- [Phase 15: Admin Tools](#phase-15-admin-tools) (Prompts #24-26)
- [Phase 16: Integration & Migration](#phase-16-integration-migration) (Prompts #27-28)

### **PART 5: SECURITY & COMPLIANCE** (Prompts #29-33)
- [Phase 17: Security Hardening](#phase-17-security-hardening) (Prompts #29-30)
- [Phase 18: Documentation](#phase-18-documentation) (Prompts #31-33)

### **PART 6: OPTIMIZATION & ENHANCEMENT** (Prompts #34-40)
- [Phase 19: Performance Optimization](#phase-19-performance-optimization) (Prompts #34-35)
- [Phase 20: Business Workflows](#phase-20-business-workflows) (Prompts #36-38)
- [Phase 21: Mobile Experience](#phase-21-mobile-experience) (Prompts #39-40)

---

## 📊 IMPLEMENTATION OVERVIEW

| Part | Phases | Prompts | Duration | Investment | Priority |
|------|--------|---------|----------|------------|----------|
| **Part 1: Backend** | 1-6 | #1-12 | 12 months | ₹62-86L | 🔴 Critical |
| **Part 2: Frontend** | 7-12 | #13-18 | 6 months | ₹18-24L | 🔴 Critical |
| **Part 3: Quality** | 13-14 | #19-23 | 3 months | ₹12-15L | 🟠 High |
| **Part 4: Admin** | 15-16 | #24-28 | 3 months | ₹10-12L | 🟠 High |
| **Part 5: Security** | 17-18 | #29-33 | 2 months | ₹8-10L | 🔴 Critical |
| **Part 6: Optimization** | 19-21 | #34-40 | 4 months | ₹12-15L | 🟡 Medium |
| **TOTAL** | **21 phases** | **40 prompts** | **30 months** | **₹1.22-1.62Cr** | - |

---

# PART 1: BACKEND INFRASTRUCTURE

---

## PHASE 1: DATA INFRASTRUCTURE

### PROMPT #1: DATABASE SCHEMA EXTENSION (500+ DATA POINTS)

**📍 Reference**: Original implementation in [CURSOR_AI_IMPLEMENTATION_GUIDE.md](CURSOR_AI_IMPLEMENTATION_GUIDE.md)

**🎯 Objective**: Create a comprehensive database migration extending Tharaga's schema from ~25 fields to 500+ data points per property.

**⏱️ Estimated Time**: 2-3 weeks
**👥 Team**: 1 Backend Developer + 1 Database Engineer
**💰 Cost**: ₹3-4 Lakhs

#### Cursor AI Prompt

```prompt
CONTEXT:
You are extending the Tharaga real estate platform's database to support 500+ property data points. The current schema in supabase/migrations/009_extend_properties_table.sql has only ~25 fields.

CURRENT ARCHITECTURE:
- Database: Supabase (PostgreSQL 15)
- ORM: Prisma / Direct SQL
- Current properties table: ~25 fields (id, title, price, bedrooms, bathrooms, city, locality, etc.)

TASK:
Create migration file: `supabase/migrations/026_comprehensive_property_data_with_mobile_optimization.sql`

IMPLEMENTATION REQUIREMENTS:

**1. PROPERTY CORE DATA ENHANCEMENT** (60 fields)

Add to existing `properties` table:

```sql
-- Financial Data (15 fields)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS price_per_sqft NUMERIC(10,2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS maintenance_charges_monthly NUMERIC(10,2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS parking_charges_total NUMERIC(10,2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS club_membership_fee NUMERIC(10,2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS lease_terms TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS stamp_duty_estimate NUMERIC(12,2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS registration_cost_estimate NUMERIC(10,2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS gst_applicable BOOLEAN DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(4,2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS total_cost_estimate NUMERIC(12,2); -- price + stamp duty + registration + GST
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS emi_estimate_monthly NUMERIC(10,2); -- at current interest rates
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS down_payment_required NUMERIC(12,2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS loan_eligibility_amount NUMERIC(12,2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS property_tax_annual NUMERIC(10,2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS insurance_premium_annual NUMERIC(8,2);

-- Legal Compliance (12 fields)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rera_registration_number VARCHAR(50);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rera_certificate_url TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rera_expiry_date DATE;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS oc_certificate BOOLEAN DEFAULT false; -- Occupancy Certificate
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS oc_certificate_url TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS cc_certificate BOOLEAN DEFAULT false; -- Completion Certificate
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS cc_certificate_url TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS approval_authority VARCHAR(100); -- BBMP, BMRDA, etc.
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS approved_plan_url TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS khata_certificate VARCHAR(20); -- A Khata, B Khata
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS khata_certificate_url TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS property_tax_paid_until DATE;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS encumbrance_certificate_url TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS sale_deed_available BOOLEAN DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS poa_required BOOLEAN DEFAULT false; -- Power of Attorney

-- Physical Specifications (18 fields)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS carpet_area_sqft NUMERIC(8,2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS builtup_area_sqft NUMERIC(8,2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS super_buildup_area_sqft NUMERIC(8,2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS plot_area_sqft NUMERIC(10,2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS balcony_count INTEGER DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS balcony_area_sqft NUMERIC(6,2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS common_area_sqft NUMERIC(8,2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS floor_height_ft NUMERIC(4,2) DEFAULT 10.0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS wall_thickness_inches NUMERIC(3,1) DEFAULT 9.0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS construction_year INTEGER;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS possession_date DATE;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS age_of_property_years INTEGER;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS renovation_year INTEGER;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS construction_quality_score NUMERIC(3,1) CHECK (construction_quality_score >= 0 AND construction_quality_score <= 10);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS ceiling_height_ft NUMERIC(4,2) DEFAULT 10.0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS total_floors_in_building INTEGER;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS property_on_floor INTEGER;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS corner_property BOOLEAN DEFAULT false;

-- Utilities & Infrastructure (10 fields)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS water_source VARCHAR(50); -- Corporation, Borewell, Both
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS water_connection_type VARCHAR(50); -- Metered, Flat rate
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS electricity_connection_type VARCHAR(50); -- BESCOM, CESC, etc.
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS gas_pipeline BOOLEAN DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS sewage_connection BOOLEAN DEFAULT true;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS internet_connectivity_type VARCHAR(100); -- Fiber, DSL, Cable
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS backup_power BOOLEAN DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS backup_power_capacity_kva NUMERIC(6,2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS waste_management_type VARCHAR(50); -- In-house STP, Corporation
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS waste_disposal_charges_monthly NUMERIC(6,2);

-- Orientation & Environment (5 fields)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS vastu_compliant BOOLEAN;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS facing_direction VARCHAR(20); -- North, South, East, West, NE, NW, SE, SW
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS sunlight_hours_morning NUMERIC(3,1);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS sunlight_hours_evening NUMERIC(3,1);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS natural_ventilation_score NUMERIC(3,1) CHECK (natural_ventilation_score >= 0 AND natural_ventilation_score <= 10);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS wind_direction VARCHAR(20);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS views_description TEXT; -- Garden view, City view, etc.

-- Building & Project Info (8 fields)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS building_name VARCHAR(200);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS tower_number VARCHAR(20);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS total_towers INTEGER;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS units_per_floor INTEGER;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS total_units_in_project INTEGER;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS project_phase VARCHAR(50); -- Phase 1, Phase 2, etc.
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS builder_reputation_score NUMERIC(3,1) CHECK (builder_reputation_score >= 0 AND builder_reputation_score <= 10);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS project_status VARCHAR(50); -- Under Construction, Ready to Move, Upcoming

-- Mobile Optimization Fields (2 fields for quick display)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS mobile_preview_image_url TEXT; -- Optimized 800x600 image
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS mobile_summary_json JSONB; -- Pre-computed summary for mobile cards
```

**2. CREATE NORMALIZED RELATED TABLES**

```sql
-- ============================================
-- TABLE 1: PROPERTY LOCATION DATA (80 fields)
-- ============================================
CREATE TABLE IF NOT EXISTS public.property_location_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL UNIQUE REFERENCES public.properties(id) ON DELETE CASCADE,

    -- Coordinates (4 fields)
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    accuracy_meters NUMERIC(6,2),
    elevation_meters NUMERIC(6,2),

    -- Administrative (6 fields)
    district VARCHAR(100),
    sub_district VARCHAR(100),
    ward_number VARCHAR(20),
    pin_code VARCHAR(10),
    assembly_constituency VARCHAR(100),
    parliamentary_constituency VARCHAR(100),

    -- Transport Proximity (18 fields) - distances in km, times in minutes
    nearest_metro_station VARCHAR(200),
    metro_distance_km NUMERIC(5,2),
    metro_travel_time_min INTEGER,
    nearest_railway_station VARCHAR(200),
    railway_distance_km NUMERIC(5,2),
    railway_travel_time_min INTEGER,
    nearest_bus_stop VARCHAR(200),
    bus_distance_km NUMERIC(4,2),
    nearest_airport VARCHAR(200),
    airport_distance_km NUMERIC(6,2),
    airport_travel_time_min INTEGER,
    public_transport_frequency_per_hour INTEGER,
    uber_ola_availability_score NUMERIC(3,1) CHECK (uber_ola_availability_score >= 0 AND uber_ola_availability_score <= 10),
    auto_rickshaw_availability_score NUMERIC(3,1),
    metro_stations_within_5km INTEGER DEFAULT 0,
    bus_stops_within_1km INTEGER DEFAULT 0,
    parking_availability_nearby_score NUMERIC(3,1),
    traffic_congestion_index NUMERIC(3,1) CHECK (traffic_congestion_index >= 0 AND traffic_congestion_index <= 10),

    -- Education Proximity (15 fields)
    nearest_primary_school VARCHAR(200),
    primary_school_distance_km NUMERIC(4,2),
    nearest_secondary_school VARCHAR(200),
    secondary_school_distance_km NUMERIC(4,2),
    nearest_international_school VARCHAR(200),
    international_school_distance_km NUMERIC(5,2),
    nearest_university VARCHAR(200),
    university_distance_km NUMERIC(5,2),
    cbse_schools_within_3km INTEGER DEFAULT 0,
    icse_schools_within_3km INTEGER DEFAULT 0,
    ib_schools_within_3km INTEGER DEFAULT 0,
    state_board_schools_within_3km INTEGER DEFAULT 0,
    playschools_within_2km INTEGER DEFAULT 0,
    coaching_centers_within_2km INTEGER DEFAULT 0,
    education_hub_nearby BOOLEAN DEFAULT false,

    -- Healthcare Proximity (12 fields)
    nearest_hospital VARCHAR(200),
    hospital_distance_km NUMERIC(4,2),
    hospital_beds_count INTEGER,
    hospital_specialty_services TEXT[], -- Array of specialties
    nearest_clinic VARCHAR(200),
    clinic_distance_km NUMERIC(4,2),
    nearest_pharmacy VARCHAR(200),
    pharmacy_distance_km NUMERIC(4,2),
    ambulance_response_time_min INTEGER,
    multi_specialty_hospitals_within_5km INTEGER DEFAULT 0,
    24_hour_pharmacies_within_2km INTEGER DEFAULT 0,
    diagnostic_centers_within_3km INTEGER DEFAULT 0,

    -- Commerce & Amenities (12 fields)
    nearest_supermarket VARCHAR(200),
    supermarket_distance_km NUMERIC(4,2),
    nearest_mall VARCHAR(200),
    mall_distance_km NUMERIC(5,2),
    nearest_atm VARCHAR(200),
    atm_distance_km NUMERIC(3,2),
    banks_within_2km INTEGER DEFAULT 0,
    restaurants_within_1km INTEGER DEFAULT 0,
    gyms_within_1km INTEGER DEFAULT 0,
    salons_within_1km INTEGER DEFAULT 0,
    petrol_pumps_within_2km INTEGER DEFAULT 0,
    grocery_stores_within_500m INTEGER DEFAULT 0,

    -- Recreation (8 fields)
    nearest_park VARCHAR(200),
    park_distance_km NUMERIC(4,2),
    park_area_sqft NUMERIC(10,2),
    nearest_sports_complex VARCHAR(200),
    sports_complex_distance_km NUMERIC(5,2),
    movie_theaters_within_5km INTEGER DEFAULT 0,
    cultural_centers_within_5km INTEGER DEFAULT 0,
    entertainment_venues_within_5km INTEGER DEFAULT 0,

    -- Essential Services (5 fields)
    police_station_distance_km NUMERIC(4,2),
    fire_station_distance_km NUMERIC(5,2),
    municipal_office_distance_km NUMERIC(5,2),
    post_office_distance_km NUMERIC(4,2),
    government_offices_within_5km INTEGER DEFAULT 0,

    -- Neighborhood Quality Indicators (10 fields)
    population_density_per_sqkm INTEGER,
    literacy_rate_percent NUMERIC(5,2),
    avg_household_income_inr NUMERIC(10,2),
    crime_rate_per_1000 NUMERIC(5,2),
    air_quality_index_avg NUMERIC(5,1),
    noise_pollution_db_avg NUMERIC(4,1),
    green_cover_percent NUMERIC(5,2),
    cleanliness_score NUMERIC(3,1) CHECK (cleanliness_score >= 0 AND cleanliness_score <= 10),
    safety_perception_score NUMERIC(3,1) CHECK (safety_perception_score >= 0 AND safety_perception_score <= 10),
    walkability_score NUMERIC(3,1) CHECK (walkability_score >= 0 AND walkability_score <= 10),

    -- Mobile Optimization
    location_summary_mobile TEXT, -- Pre-computed: "2.3km from Metro, 5 schools within 3km"

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_property_location_property_id ON public.property_location_data(property_id);
CREATE INDEX idx_property_location_coordinates ON public.property_location_data(latitude, longitude);
CREATE INDEX idx_property_location_pin_code ON public.property_location_data(pin_code);

-- ============================================
-- TABLE 2: PROPERTY INFRASTRUCTURE DATA (70 fields)
-- ============================================
CREATE TABLE IF NOT EXISTS public.property_infrastructure_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL UNIQUE REFERENCES public.properties(id) ON DELETE CASCADE,

    -- Current Road & Connectivity (12 fields)
    road_type VARCHAR(50), -- Main Road, Side Street, Arterial Road
    road_width_ft NUMERIC(5,2),
    street_lighting BOOLEAN DEFAULT true,
    footpath_available BOOLEAN DEFAULT false,
    footpath_width_ft NUMERIC(4,2),
    drainage_system_quality VARCHAR(50), -- Excellent, Good, Poor
    flood_history_last_10_years INTEGER DEFAULT 0,
    waterlogging_prone BOOLEAN DEFAULT false,
    waterlogging_depth_max_ft NUMERIC(4,2),
    monsoon_accessibility_score NUMERIC(3,1) CHECK (monsoon_accessibility_score >= 0 AND monsoon_accessibility_score <= 10),
    road_condition_score NUMERIC(3,1) CHECK (road_condition_score >= 0 AND road_condition_score <= 10),
    traffic_peak_hour_delay_min INTEGER DEFAULT 0,

    -- Public Transport (6 fields)
    public_transport_frequency_per_hour INTEGER,
    bus_routes_count INTEGER DEFAULT 0,
    metro_connectivity BOOLEAN DEFAULT false,
    railway_connectivity BOOLEAN DEFAULT false,
    last_mile_connectivity_score NUMERIC(3,1),
    ride_sharing_availability_score NUMERIC(3,1),

    -- Parking (4 fields)
    parking_availability_score NUMERIC(3,1),
    street_parking_allowed BOOLEAN DEFAULT false,
    paid_parking_required BOOLEAN DEFAULT false,
    parking_rates_per_hour NUMERIC(5,2),

    -- Planned Infrastructure (next 5 years) (25 fields)
    planned_metro_stations_within_3km INTEGER DEFAULT 0,
    planned_metro_lines TEXT[], -- Array of line names/numbers
    metro_completion_year INTEGER,
    metro_impact_on_value_percent NUMERIC(5,2), -- Expected appreciation
    planned_highways_within_5km INTEGER DEFAULT 0,
    highway_completion_year INTEGER,
    planned_flyovers INTEGER DEFAULT 0,
    flyover_completion_year INTEGER,
    planned_underpasses INTEGER DEFAULT 0,
    underpass_completion_year INTEGER,
    planned_bus_rapid_transit BOOLEAN DEFAULT false,
    brt_completion_year INTEGER,
    planned_ring_road_proximity_km NUMERIC(5,2),
    planned_schools INTEGER DEFAULT 0,
    planned_hospitals INTEGER DEFAULT 0,
    planned_malls INTEGER DEFAULT 0,
    planned_it_parks INTEGER DEFAULT 0,
    planned_it_park_companies TEXT[],
    planned_residential_projects_within_2km INTEGER DEFAULT 0,
    planned_commercial_projects_within_2km INTEGER DEFAULT 0,
    smart_city_initiative_active BOOLEAN DEFAULT false,
    smart_city_projects TEXT[], -- Array of project names
    government_infrastructure_projects_count INTEGER DEFAULT 0,
    government_projects_list TEXT[],
    estimated_infrastructure_investment_cr NUMERIC(10,2), -- In crores

    -- Digital Infrastructure (8 fields)
    fiber_optic_availability BOOLEAN DEFAULT false,
    fiber_providers TEXT[], -- Airtel, ACT, Hathway, etc.
    4g_coverage_score NUMERIC(3,1),
    5g_coverage_score NUMERIC(3,1),
    avg_internet_speed_mbps NUMERIC(6,2),
    telecom_providers_count INTEGER DEFAULT 0,
    mobile_network_quality_score NUMERIC(3,1),
    broadband_plans_available_count INTEGER DEFAULT 0,

    -- Utilities Reliability (15 fields)
    water_supply_hours_per_day NUMERIC(4,1),
    water_pressure_quality VARCHAR(50), -- Excellent, Good, Low
    water_quality_tds_ppm NUMERIC(6,1),
    water_treatment_available BOOLEAN DEFAULT false,
    electricity_outage_hours_per_month NUMERIC(5,2),
    electricity_backup_required BOOLEAN DEFAULT true,
    voltage_fluctuation_score NUMERIC(3,1) CHECK (voltage_fluctuation_score >= 0 AND voltage_fluctuation_score <= 10),
    gas_pipeline_planned BOOLEAN DEFAULT false,
    gas_pipeline_completion_year INTEGER,
    solar_panel_feasibility_score NUMERIC(3,1),
    rainwater_harvesting_mandatory BOOLEAN DEFAULT false,
    sewage_treatment_plant_available BOOLEAN DEFAULT false,
    waste_collection_frequency_per_week INTEGER DEFAULT 7,
    composting_facility_available BOOLEAN DEFAULT false,
    e_waste_collection_available BOOLEAN DEFAULT false,

    -- Mobile Optimization
    infrastructure_highlights_mobile TEXT, -- "Metro in 2026, Fiber available, 24x7 water"

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_property_infrastructure_property_id ON public.property_infrastructure_data(property_id);
CREATE INDEX idx_property_infrastructure_metro ON public.property_infrastructure_data(metro_connectivity);

-- Continue in next message due to length...
```

**3. REMAINING TABLES** (Market Data, Risk Data, Demographic Data, Amenities Data)

[Include full SQL for all 6 tables - continuing from infrastructure...]

**4. DATA QUALITY FUNCTIONS**

```sql
-- Function to calculate data completeness score
CREATE OR REPLACE FUNCTION calculate_data_completeness_score(p_property_id UUID)
RETURNS NUMERIC(5,2) AS $$
DECLARE
    total_fields INTEGER := 500;
    filled_fields INTEGER := 0;
    completeness_score NUMERIC(5,2);
BEGIN
    -- Count non-null fields in properties table
    SELECT COUNT(*) INTO filled_fields
    FROM (
        SELECT * FROM public.properties WHERE id = p_property_id
    ) AS prop,
    LATERAL (
        SELECT
            CASE WHEN price_inr IS NOT NULL THEN 1 ELSE 0 END +
            CASE WHEN carpet_area_sqft IS NOT NULL THEN 1 ELSE 0 END +
            -- ... count all 60 core fields
            0 AS count
    ) AS counts;

    -- Add counts from related tables
    -- [logic for location_data, infrastructure_data, etc.]

    completeness_score := (filled_fields::NUMERIC / total_fields::NUMERIC) * 100;
    RETURN ROUND(completeness_score, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate data quality score
CREATE OR REPLACE FUNCTION calculate_data_quality_score(p_property_id UUID)
RETURNS NUMERIC(5,2) AS $$
DECLARE
    quality_score NUMERIC(5,2) := 0;
    validation_checks INTEGER := 0;
    passed_checks INTEGER := 0;
BEGIN
    -- Check 1: Price per sqft is reasonable (₹2000-₹50000)
    validation_checks := validation_checks + 1;
    IF (SELECT price_per_sqft FROM properties WHERE id = p_property_id)
       BETWEEN 2000 AND 50000 THEN
        passed_checks := passed_checks + 1;
    END IF;

    -- Check 2: Carpet area < Builtup area < Super builtup area
    validation_checks := validation_checks + 1;
    IF (SELECT carpet_area_sqft < builtup_area_sqft AND
               builtup_area_sqft < super_buildup_area_sqft
        FROM properties WHERE id = p_property_id) THEN
        passed_checks := passed_checks + 1;
    END IF;

    -- ... Add 20+ validation checks

    quality_score := (passed_checks::NUMERIC / validation_checks::NUMERIC) * 100;
    RETURN ROUND(quality_score, 2);
END;
$$ LANGUAGE plpgsql;
```

**5. MATERIALIZED VIEW FOR PERFORMANCE**

```sql
-- Materialized view for quick mobile data retrieval
CREATE MATERIALIZED VIEW IF NOT EXISTS property_mobile_summary AS
SELECT
    p.id,
    p.title,
    p.price_inr,
    p.bedrooms,
    p.bathrooms,
    p.carpet_area_sqft,
    p.city,
    p.locality,
    p.mobile_preview_image_url,
    p.property_type,
    p.builder_reputation_score,
    l.metro_distance_km,
    l.nearest_metro_station,
    l.location_summary_mobile,
    i.infrastructure_highlights_mobile,
    m.avg_appreciation_3y_percent,
    r.overall_risk_score,
    calculate_data_completeness_score(p.id) as data_completeness,
    calculate_data_quality_score(p.id) as data_quality
FROM public.properties p
LEFT JOIN public.property_location_data l ON p.id = l.property_id
LEFT JOIN public.property_infrastructure_data i ON p.id = i.property_id
LEFT JOIN public.property_market_data m ON p.id = m.property_id
LEFT JOIN public.property_risk_data r ON p.id = r.property_id;

CREATE UNIQUE INDEX ON property_mobile_summary (id);

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_property_mobile_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY property_mobile_summary;
END;
$$ LANGUAGE plpgsql;
```

**6. ROW LEVEL SECURITY (RLS) POLICIES**

```sql
-- Enable RLS on all new tables
ALTER TABLE public.property_location_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_infrastructure_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_risk_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_demographic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_amenities_data ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published properties
CREATE POLICY "Public properties are viewable by everyone"
ON public.property_location_data FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.properties
        WHERE id = property_location_data.property_id
        AND listing_status = 'active'
    )
);

-- Policy: Only authenticated users can see unpublished properties
CREATE POLICY "Authenticated users can view all properties"
ON public.property_location_data FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy: Only builders can update their properties
CREATE POLICY "Builders can update own properties"
ON public.property_location_data FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.properties
        WHERE id = property_location_data.property_id
        AND builder_id = auth.uid()
    )
);

-- Repeat similar policies for all 6 tables...
```

**7. AUTOMATED REFRESH TRIGGERS**

```sql
-- Trigger to auto-update mobile summary when property changes
CREATE OR REPLACE FUNCTION update_property_mobile_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Update mobile_summary_json with key data
    NEW.mobile_summary_json := jsonb_build_object(
        'price_display', '₹' || (NEW.price_inr / 100000)::TEXT || 'L',
        'area_display', NEW.carpet_area_sqft::TEXT || ' sqft',
        'config', NEW.bedrooms::TEXT || ' BHK',
        'location_display', NEW.locality || ', ' || NEW.city,
        'builder_score', NEW.builder_reputation_score,
        'quick_facts', ARRAY[
            'Age: ' || NEW.age_of_property_years::TEXT || ' years',
            'Floor: ' || NEW.property_on_floor::TEXT || '/' || NEW.total_floors_in_building::TEXT,
            CASE WHEN NEW.rera_registration_number IS NOT NULL
                 THEN 'RERA Approved' ELSE 'RERA Pending' END
        ]
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mobile_summary
    BEFORE INSERT OR UPDATE ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION update_property_mobile_summary();
```

**8. MOBILE-OPTIMIZED INDEXES**

```sql
-- Composite indexes for mobile list queries (city + price range)
CREATE INDEX idx_mobile_search_city_price
ON public.properties(city, price_inr)
WHERE listing_status = 'active';

-- Index for "near me" queries (mobile geolocation)
CREATE INDEX idx_mobile_geosearch
ON public.property_location_data
USING GIST (ll_to_earth(latitude, longitude));

-- Index for quick filters (mobile UI: bedrooms, bathrooms, price range)
CREATE INDEX idx_mobile_filters
ON public.properties(bedrooms, bathrooms, price_inr)
WHERE listing_status = 'active';

-- Partial index for featured properties (mobile home screen)
CREATE INDEX idx_mobile_featured
ON public.properties(created_at DESC)
WHERE listing_status = 'active' AND featured = true;
```

**9. COMMIT MIGRATION**

```sql
COMMIT;
```

VALIDATION CHECKLIST:
- [ ] Migration runs without errors
- [ ] All 6 new tables created with correct structure
- [ ] 500+ total queryable fields across all tables
- [ ] All foreign keys properly set with CASCADE delete
- [ ] All indexes created successfully
- [ ] RLS policies active and working
- [ ] Data quality functions return valid scores (0-100)
- [ ] Materialized view created and can be refreshed
- [ ] Mobile optimization fields populated
- [ ] Triggers fire correctly on INSERT/UPDATE

MOBILE-SPECIFIC VALIDATIONS:
- [ ] Mobile summary JSON generated correctly
- [ ] Mobile preview images load fast (<500ms)
- [ ] Geolocation queries return results in <200ms
- [ ] List queries with filters <300ms
- [ ] Mobile summary materialized view refresh <5 seconds

NEXT STEPS:
1. Run migration on staging database first
2. Test all CRUD operations
3. Verify RLS policies with different user roles
4. Benchmark query performance on mobile indexes
5. Test data quality scoring functions with sample data
6. Deploy to production with rollback plan
```

#### Success Criteria
- ✅ All 500+ fields queryable
- ✅ Mobile queries <300ms
- ✅ Data quality scoring functional
- ✅ RLS policies working correctly
- ✅ Zero downtime deployment

---

### PROMPT #2: DATA COLLECTION SERVICE

[Continue with remaining 39 prompts...]

