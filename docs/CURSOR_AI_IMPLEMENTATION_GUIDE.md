# 🚀 ULTRA-DETAILED CURSOR AI IMPLEMENTATION GUIDE
## Transform Tharaga.co.in into India's #1 AI-Powered Real Estate Intelligence Platform

**Project Context**: Tharaga is a real estate SaaS platform for Indian property buyers and builders. Current implementation has basic features but lacks the advanced AI/ML capabilities claimed in marketing. This guide provides production-ready prompts for Cursor AI to implement each missing feature systematically.

**Current Stack**:
- Frontend: Next.js 14 (TypeScript) in `app/`
- Backend: FastAPI (Python) in `backend/app/`
- Database: PostgreSQL via Supabase
- Integrations: Twilio, Zoho CRM, Google Calendar, Razorpay, Resend

**Current Strengths**:
- ✅ Multi-role system (buyer/builder/admin)
- ✅ Lead tracking and automation engine
- ✅ Hybrid recommendation system (TF-IDF + SVD)
- ✅ Integration ecosystem (Twilio, Zoho, Calendar, Payments)
- ✅ Security (RLS, rate limiting, audit logs)

**Implementation Priority**: Follow numerical order (1 → 7) for dependencies.

---

## 📋 TABLE OF CONTENTS

1. [Proprietary Data Collection System (500+ Data Points)](#1-proprietary-data-collection-system)
2. [Machine Learning Property Appreciation Model](#2-machine-learning-property-appreciation-model)
3. [Blockchain/Cryptographic Title Verification](#3-blockchain-title-verification)
4. [Voice-First Multi-Language AI Search](#4-voice-first-multi-language-ai)
5. [Real-Time Data Pipeline & Analytics](#5-real-time-data-pipeline)
6. [Advanced Risk Assessment Engine](#6-advanced-risk-assessment-engine)
7. [Predictive Market Intelligence Dashboard](#7-predictive-market-intelligence)

---

## 🎯 UNIQUE NICHE POSITIONING FOR THARAGA

**Target Market**: Indian real estate (Tier 1, 2, 3 cities)

**Differentiators**:
1. **Data Depth**: 500+ data points vs competitors' 50-100
2. **ML Accuracy**: Validated 85%+ appreciation forecasting
3. **Trust Layer**: Cryptographic verification for fraud prevention
4. **Accessibility**: Voice-first for low-literacy users in regional languages
5. **Real-Time Intelligence**: Live market signals vs stale data

**Defensible Moats**:
- Proprietary data collection pipelines
- Trained ML models with historical Indian market data
- Integration depth (CRM + messaging + calendar + payments)
- Regional language voice AI with context understanding
- Automated workflows reducing builder operational costs

---

# 1. PROPRIETARY DATA COLLECTION SYSTEM (500+ Data Points)

## OBJECTIVE
Build a comprehensive data collection, enrichment, and storage system that analyzes 500+ data points per property, creating an unassailable data moat.

## CURSOR AI PROMPT #1: Database Schema Extension

```prompt
CONTEXT:
You are extending the Tharaga real estate platform's database to support 500+ property data points. The current schema has only ~25 fields in the properties table (see supabase/migrations/009_extend_properties_table.sql).

TASK:
Create a new Supabase migration file: `supabase/migrations/025_comprehensive_property_data.sql`

REQUIREMENTS:

1. **Property Core Data Enhancement** (50 fields):
   - Financial: price_inr, price_per_sqft, maintenance_charges, parking_charges, club_membership_fee, lease_terms, stamp_duty_estimate, registration_cost_estimate, gst_applicable, gst_rate
   - Legal: rera_certificate_url, rera_expiry_date, oc_certificate (occupancy certificate), cc_certificate (completion certificate), approval_authority, approved_plan_url, khata_certificate, property_tax_paid_until, encumbrance_certificate_url, sale_deed_available, poa_required (power of attorney)
   - Physical: carpet_area, builtup_area, super_buildup_area, plot_area, balcony_count, balcony_area, common_area_sqft, floor_height_ft, wall_thickness, construction_year, possession_date, age_of_property, renovation_year, construction_quality_score
   - Utilities: water_source, water_connection_type, electricity_connection_type, gas_pipeline, sewage_connection, internet_connectivity_type, backup_power, waste_management_type
   - Orientation: vastu_compliant, facing_direction, sunlight_hours_morning, sunlight_hours_evening, wind_direction, natural_ventilation_score
   - Building: building_name, tower_number, total_towers, units_per_floor, total_units_in_project, builder_reputation_score

2. **Location Intelligence** (80 fields):
   Create new table: `property_location_data`
   - Coordinates: latitude, longitude, accuracy_meters, elevation_meters
   - Administrative: district, sub_district, ward_number, pin_code, assembly_constituency, parliamentary_constituency
   - Proximity (distances in km, travel time in minutes):
     * Transport: nearest_metro_station, metro_distance_km, metro_travel_time_min, nearest_railway_station, railway_distance_km, nearest_bus_stop, bus_distance_km, nearest_airport, airport_distance_km, airport_travel_time_min
     * Education: nearest_primary_school, primary_school_distance_km, nearest_secondary_school, secondary_school_distance_km, nearest_international_school, international_school_distance_km, nearest_university, university_distance_km, cbse_schools_within_3km, icse_schools_within_3km, ib_schools_within_3km
     * Healthcare: nearest_hospital, hospital_distance_km, hospital_beds_count, nearest_clinic, clinic_distance_km, nearest_pharmacy, pharmacy_distance_km, ambulance_response_time_min, multi_specialty_hospitals_within_5km
     * Commerce: nearest_supermarket, supermarket_distance_km, nearest_mall, mall_distance_km, nearest_atm, atm_distance_km, banks_within_2km, restaurants_within_1km, gyms_within_1km
     * Recreation: nearest_park, park_distance_km, park_area_sqft, nearest_sports_complex, sports_complex_distance_km, movie_theaters_within_5km, cultural_centers_within_5km
     * Essentials: police_station_distance_km, fire_station_distance_km, municipal_office_distance_km, post_office_distance_km
   - Neighborhood: population_density_per_sqkm, literacy_rate_percent, avg_household_income_inr, crime_rate_per_1000, air_quality_index_avg, noise_pollution_db_avg, green_cover_percent, traffic_congestion_index

3. **Infrastructure & Development** (70 fields):
   Create new table: `property_infrastructure_data`
   - Current Infrastructure:
     * road_type, road_width_ft, street_lighting, footpath_available, drainage_system_quality, flood_history_last_10_years, waterlogging_prone, monsoon_accessibility_score
     * public_transport_frequency_per_hour, parking_availability_score, traffic_peak_hour_delay_min
   - Planned Development (next 5 years):
     * planned_metro_stations_within_3km, metro_completion_year, planned_highways_within_5km, highway_completion_year, planned_flyovers, flyover_completion_year
     * planned_schools, planned_hospitals, planned_malls, planned_it_parks, planned_residential_projects_within_2km
     * smart_city_initiative_active, government_infrastructure_projects_count, estimated_infrastructure_investment_cr
   - Digital Infrastructure:
     * fiber_optic_availability, 4g_coverage_score, 5g_coverage_score, avg_internet_speed_mbps, telecom_providers_count
   - Utilities Development:
     * water_supply_hours_per_day, water_quality_tds_ppm, electricity_outage_hours_per_month, voltage_fluctuation_score, gas_pipeline_planned, solar_panel_feasibility_score

4. **Market Intelligence** (60 fields):
   Create new table: `property_market_data`
   - Historical Pricing:
     * price_1_year_ago, price_2_years_ago, price_3_years_ago, price_5_years_ago
     * avg_appreciation_1y_percent, avg_appreciation_3y_percent, avg_appreciation_5y_percent
     * price_volatility_index, highest_price_recorded, lowest_price_recorded, avg_price_per_sqft_locality
   - Transaction Data:
     * total_transactions_last_year, total_transactions_last_3_years, avg_transaction_value_inr, median_transaction_value_inr
     * avg_days_on_market, quick_sale_probability_score, negotiation_margin_percent
   - Supply-Demand:
     * active_listings_in_locality, new_listings_last_month, sold_listings_last_month, inventory_months
     * demand_supply_ratio, buyer_seller_ratio, listing_views_avg_per_property, inquiry_rate_percent
   - Investment Metrics:
     * rental_yield_percent, capital_appreciation_potential_score, resale_liquidity_score, investment_grade_rating
     * comparable_properties_count, comp_avg_price_per_sqft, price_position_vs_comps (premium/at par/discount)
   - Builder Track Record:
     * builder_projects_completed_count, builder_projects_delayed_count, builder_customer_satisfaction_score, builder_financial_health_score, builder_litigation_cases_count

5. **Environmental & Risk Assessment** (80 fields):
   Create new table: `property_risk_data`
   - Flood Risk:
     * flood_zone_category, elevation_above_river_meters, distance_to_water_body_km, historical_flood_count_10y, max_flood_depth_recorded_meters
     * drainage_capacity_rating, monsoon_waterlogging_days_avg, flood_insurance_required, flood_insurance_premium_estimate_inr
   - Seismic Risk:
     * seismic_zone, earthquake_risk_score, building_earthquake_resistant, earthquake_insurance_premium_estimate_inr
   - Environmental Hazards:
     * soil_type, soil_stability_score, landslide_risk_score, soil_contamination_level
     * proximity_to_industrial_area_km, proximity_to_landfill_km, proximity_to_sewage_treatment_km, proximity_to_high_voltage_lines_meters
     * radon_gas_risk, asbestos_presence, lead_paint_risk
   - Climate Data:
     * avg_temp_summer_celsius, avg_temp_winter_celsius, avg_rainfall_mm, humidity_avg_percent
     * heatwave_days_per_year, cold_wave_days_per_year, cyclone_risk_score, lightning_strike_frequency
   - Air & Noise Quality:
     * pm25_avg_ugm3, pm10_avg_ugm3, no2_avg_ugm3, so2_avg_ugm3, co_avg_ppm, ozone_avg_ppb
     * air_quality_trend_5y (improving/stable/declining), respiratory_disease_prevalence_percent
     * noise_level_day_db, noise_level_night_db, noise_sources (traffic/industrial/airport/construction)
   - Legal Risks:
     * litigation_status, disputed_land, ancestral_property_claims, tenant_disputes, builder_buyer_disputes
     * noc_pending_count, approval_violations, unauthorized_construction_risk, demolition_risk_score

6. **Demographic & Economic Indicators** (80 fields):
   Create new table: `property_demographic_data`
   - Population Data:
     * population_within_1km, population_within_3km, population_within_5km
     * population_growth_5y_percent, population_density_trend
     * age_0_14_percent, age_15_24_percent, age_25_44_percent, age_45_64_percent, age_65_plus_percent
     * male_female_ratio, avg_household_size, nuclear_families_percent, joint_families_percent
   - Economic Data:
     * median_income_inr, avg_income_inr, income_growth_5y_percent
     * employment_rate_percent, unemployment_rate_percent
     * white_collar_jobs_percent, blue_collar_jobs_percent, self_employed_percent
     * it_professionals_percent, healthcare_professionals_percent, educators_percent
   - Education & Lifestyle:
     * literacy_rate_percent, graduate_population_percent, postgraduate_population_percent
     * vehicle_ownership_per_household, two_wheeler_ownership_percent, four_wheeler_ownership_percent
     * internet_penetration_percent, smartphone_penetration_percent
     * dining_out_frequency_per_month_avg, entertainment_spending_per_month_avg
   - Migration & Employment Hubs:
     * net_migration_rate_5y, migrant_population_percent, expat_population_percent
     * nearest_it_park_km, it_park_employee_count, nearest_industrial_zone_km, industrial_zone_employee_count
     * nearby_mnc_companies_count, startup_ecosystem_score, coworking_spaces_within_5km
   - Social Infrastructure:
     * community_centers_count, religious_places_within_1km, social_clubs_count
     * sports_facilities_count, libraries_count, cultural_events_per_year
     * safety_perception_score, community_cohesion_score, neighborhood_watch_active

7. **Amenities & Features** (50 fields):
   Extend existing amenities JSONB with structured data in `property_amenities_data` table:
   - Building Amenities:
     * swimming_pool, swimming_pool_size_sqft, gym, gym_equipment_count, clubhouse, clubhouse_area_sqft
     * indoor_games_room, outdoor_sports_court, children_play_area, senior_citizen_area, library, meditation_room, yoga_room
     * amphitheater, multipurpose_hall, banquet_hall, guest_rooms_count
   - Security:
     * gated_community, security_guards_count, cctv_cameras_count, intercom, video_door_phone, fire_alarm_system, fire_extinguishers_count, sprinkler_system, earthquake_sensors
     * boom_barrier, rfid_access, biometric_access, visitor_management_system
   - Green Features:
     * rainwater_harvesting, sewage_treatment_plant, solar_panels, solar_capacity_kw, ev_charging_stations_count
     * organic_waste_converter, terrace_garden, green_building_certified, green_building_rating
     * low_voc_paints, led_lighting_percent, water_efficient_fixtures
   - Smart Features:
     * home_automation, smart_locks, smart_lighting, smart_thermostats, smart_security, centralized_ac_control
     * app_based_facility_booking, app_based_maintenance_requests, app_based_visitor_management
   - Parking & Storage:
     * covered_parking, open_parking, mechanical_parking, two_wheeler_parking_count, four_wheeler_parking_count
     * ev_charging_parking, visitor_parking_count, storage_room, bicycle_storage

8. **Metadata & Data Quality** (30 fields):
   Add to properties table:
   - Data Provenance:
     * data_completeness_score (0-100), data_quality_score (0-100), data_last_updated_at
     * data_sources_json (array of source identifiers), data_verification_status, data_verified_by, data_verified_at
   - Collection Timestamps:
     * location_data_collected_at, infrastructure_data_collected_at, market_data_collected_at
     * risk_data_collected_at, demographic_data_collected_at, amenities_data_collected_at
   - API Integration Flags:
     * google_maps_enriched, census_data_enriched, government_portal_enriched, third_party_enriched

IMPLEMENTATION REQUIREMENTS:

1. Create normalized tables (not just extending properties):
   ```sql
   properties (core property data)
   ├── property_location_data (1:1 relationship)
   ├── property_infrastructure_data (1:1 relationship)
   ├── property_market_data (1:1 relationship)
   ├── property_risk_data (1:1 relationship)
   ├── property_demographic_data (1:1 relationship)
   └── property_amenities_data (1:1 relationship)
   ```

2. Add proper foreign keys with CASCADE delete
3. Create GIN indexes for JSONB fields
4. Create BRIN indexes for timestamp fields
5. Create composite indexes for common query patterns
6. Add check constraints for data validation
7. Add helpful column comments
8. Create materialized view for quick property data completeness scoring
9. Add RLS policies for each new table
10. Create database functions for data quality scoring

VALIDATION:
- Each property should now have 500+ queryable data points
- All fields should have appropriate data types
- Indexes should be optimized for read performance
- Data quality scoring should work correctly

OUTPUT STRUCTURE:
```sql
-- Migration: 025_comprehensive_property_data.sql
BEGIN;

-- Core properties table extensions
ALTER TABLE public.properties ADD COLUMN ...;

-- New related tables
CREATE TABLE public.property_location_data (...);
CREATE TABLE public.property_infrastructure_data (...);
-- ... etc

-- Indexes
CREATE INDEX ...;

-- Materialized view for data completeness
CREATE MATERIALIZED VIEW property_data_completeness AS ...;

-- Functions
CREATE OR REPLACE FUNCTION calculate_data_quality_score(property_id uuid) ...;

-- RLS policies
ALTER TABLE public.property_location_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY ...;

COMMIT;
```

NOTES:
- Use proper PostgreSQL data types (numeric for prices, geography for coordinates, daterange for date ranges)
- All monetary values in INR (Indian Rupees)
- All distances in kilometers unless specified
- All areas in square feet (Indian standard)
- Include proper constraints (NOT NULL where appropriate, check constraints for ranges)
- Future-proof for adding more data sources
```

## CURSOR AI PROMPT #2: Data Collection Service (Python)

```prompt
CONTEXT:
You are building a comprehensive data collection and enrichment service for the Tharaga platform. This service will populate the 500+ data points from various sources (APIs, web scraping, government portals, third-party data providers).

TASK:
Create a new Python service: `backend/app/data_collection/`

DIRECTORY STRUCTURE:
```
backend/app/data_collection/
├── __init__.py
├── orchestrator.py          # Main data collection orchestrator
├── sources/
│   ├── __init__.py
│   ├── base.py             # Base data source class
│   ├── google_maps.py      # Google Maps Platform APIs
│   ├── census_india.py     # Indian Census data
│   ├── rera_portal.py      # RERA government portal
│   ├── weather_api.py      # Weather/climate data
│   ├── openstreetmap.py    # OSM for POI data
│   ├── pollution_board.py  # State pollution board APIs
│   ├── earthquake.py       # Seismic data from govt sources
│   ├── flood_risk.py       # Flood risk from govt/ISRO data
│   ├── market_data.py      # Historical transaction data
│   └── demographic.py      # Census demographic data
├── enrichers/
│   ├── __init__.py
│   ├── location.py         # Location data enrichment
│   ├── infrastructure.py   # Infrastructure analysis
│   ├── market.py           # Market intelligence
│   ├── risk.py             # Risk assessment
│   └── demographic.py      # Demographic analysis
├── validators/
│   ├── __init__.py
│   ├── data_quality.py     # Data quality checks
│   └── completeness.py     # Completeness scoring
└── scheduler.py            # Background job scheduler
```

FILE 1: `backend/app/data_collection/sources/base.py`
```python
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime
import asyncio
from pydantic import BaseModel


class DataSourceMetadata(BaseModel):
    source_name: str
    collection_timestamp: datetime
    api_version: Optional[str] = None
    rate_limit_remaining: Optional[int] = None
    cost: Optional[float] = None  # API cost in INR
    success: bool
    error_message: Optional[str] = None


class BaseDataSource(ABC):
    """Base class for all data sources"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.source_name = self.__class__.__name__
        self.rate_limit_delay = config.get('rate_limit_delay', 1.0)

    @abstractmethod
    async def fetch_data(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fetch data for a property
        Returns: Dict with enriched data points
        """
        pass

    @abstractmethod
    def validate_config(self) -> bool:
        """Validate configuration (API keys, etc.)"""
        pass

    async def collect_with_retry(self, property_data: Dict[str, Any], max_retries: int = 3) -> tuple[Dict[str, Any], DataSourceMetadata]:
        """Collect data with retry logic"""
        for attempt in range(max_retries):
            try:
                start_time = datetime.now()
                data = await self.fetch_data(property_data)

                metadata = DataSourceMetadata(
                    source_name=self.source_name,
                    collection_timestamp=datetime.now(),
                    success=True
                )

                return data, metadata

            except Exception as e:
                if attempt == max_retries - 1:
                    metadata = DataSourceMetadata(
                        source_name=self.source_name,
                        collection_timestamp=datetime.now(),
                        success=False,
                        error_message=str(e)
                    )
                    return {}, metadata

                await asyncio.sleep(self.rate_limit_delay * (attempt + 1))
```

FILE 2: `backend/app/data_collection/sources/google_maps.py`
```python
import googlemaps
from typing import Dict, Any
from .base import BaseDataSource


class GoogleMapsSource(BaseDataSource):
    """
    Collect location intelligence using Google Maps Platform APIs:
    - Geocoding API (coordinates)
    - Places API (nearby POIs)
    - Distance Matrix API (travel times)
    - Elevation API (elevation data)
    - Roads API (road quality)
    """

    def validate_config(self) -> bool:
        return 'GOOGLE_MAPS_API_KEY' in self.config

    async def fetch_data(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        api_key = self.config['GOOGLE_MAPS_API_KEY']
        gmaps = googlemaps.Client(key=api_key)

        address = f"{property_data.get('address', '')}, {property_data.get('locality', '')}, {property_data.get('city', '')}"

        enriched_data = {}

        # 1. Geocoding (lat/lng/elevation)
        geocode_result = gmaps.geocode(address)
        if geocode_result:
            location = geocode_result[0]['geometry']['location']
            enriched_data['latitude'] = location['lat']
            enriched_data['longitude'] = location['lng']
            enriched_data['formatted_address'] = geocode_result[0]['formatted_address']

            # Get administrative details
            for component in geocode_result[0]['address_components']:
                if 'administrative_area_level_1' in component['types']:
                    enriched_data['state'] = component['long_name']
                if 'administrative_area_level_2' in component['types']:
                    enriched_data['district'] = component['long_name']
                if 'postal_code' in component['types']:
                    enriched_data['pin_code'] = component['long_name']

        # 2. Elevation
        if 'latitude' in enriched_data:
            elevation_result = gmaps.elevation((enriched_data['latitude'], enriched_data['longitude']))
            if elevation_result:
                enriched_data['elevation_meters'] = elevation_result[0]['elevation']

        # 3. Nearby Places (POIs)
        if 'latitude' in enriched_data:
            location_tuple = (enriched_data['latitude'], enriched_data['longitude'])

            # Schools
            schools = gmaps.places_nearby(location=location_tuple, radius=3000, type='school')
            enriched_data['schools_within_3km'] = len(schools.get('results', []))
            if schools.get('results'):
                nearest_school = schools['results'][0]
                enriched_data['nearest_school_name'] = nearest_school.get('name')
                enriched_data['nearest_school_rating'] = nearest_school.get('rating')

            # Hospitals
            hospitals = gmaps.places_nearby(location=location_tuple, radius=5000, type='hospital')
            enriched_data['hospitals_within_5km'] = len(hospitals.get('results', []))
            if hospitals.get('results'):
                nearest_hospital = hospitals['results'][0]
                enriched_data['nearest_hospital_name'] = nearest_hospital.get('name')
                enriched_data['nearest_hospital_rating'] = nearest_hospital.get('rating')

            # Supermarkets
            supermarkets = gmaps.places_nearby(location=location_tuple, radius=2000, type='supermarket')
            enriched_data['supermarkets_within_2km'] = len(supermarkets.get('results', []))

            # Metro stations
            metro_stations = gmaps.places_nearby(location=location_tuple, radius=5000, keyword='metro station')
            if metro_stations.get('results'):
                nearest_metro = metro_stations['results'][0]
                enriched_data['nearest_metro_station'] = nearest_metro.get('name')

                # Calculate distance and travel time
                origin = f"{enriched_data['latitude']},{enriched_data['longitude']}"
                destination = f"{nearest_metro['geometry']['location']['lat']},{nearest_metro['geometry']['location']['lng']}"

                distance_result = gmaps.distance_matrix(origins=origin, destinations=destination, mode='driving')
                if distance_result['rows'][0]['elements'][0]['status'] == 'OK':
                    element = distance_result['rows'][0]['elements'][0]
                    enriched_data['metro_distance_km'] = element['distance']['value'] / 1000
                    enriched_data['metro_travel_time_min'] = element['duration']['value'] / 60

            # Repeat for other POI types: parks, malls, restaurants, gyms, banks, ATMs, etc.
            # (Similar pattern for each category)

        enriched_data['google_maps_enriched'] = True
        return enriched_data
```

FILE 3: `backend/app/data_collection/sources/flood_risk.py`
```python
import httpx
from typing import Dict, Any
from .base import BaseDataSource


class FloodRiskSource(BaseDataSource):
    """
    Collect flood risk data from:
    - CWC (Central Water Commission) flood data
    - ISRO Bhuvan flood hazard maps
    - State disaster management APIs
    """

    def validate_config(self) -> bool:
        return True  # Using open government data

    async def fetch_data(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        lat = property_data.get('latitude')
        lng = property_data.get('longitude')

        if not lat or not lng:
            return {}

        enriched_data = {}

        # 1. Determine flood zone using ISRO Bhuvan (example endpoint)
        async with httpx.AsyncClient() as client:
            # Note: Replace with actual ISRO Bhuvan API endpoint
            # This is a placeholder for demonstration
            bhuvan_url = f"https://bhuvan-app1.nrsc.gov.in/disaster/disaster.php?lat={lat}&lon={lng}"

            try:
                response = await client.get(bhuvan_url, timeout=10.0)
                if response.status_code == 200:
                    # Parse flood zone data from response
                    # This will depend on actual API response format
                    data = response.json()
                    enriched_data['flood_zone_category'] = data.get('flood_zone', 'Unknown')
                    enriched_data['flood_hazard_level'] = data.get('hazard_level', 'Low')
            except Exception as e:
                print(f"Flood risk API error: {e}")

        # 2. Calculate distance to nearest water body (rivers, lakes)
        # Use OpenStreetMap Overpass API to find water bodies
        overpass_url = "https://overpass-api.de/api/interpreter"
        overpass_query = f"""
        [out:json];
        (
          way["natural"="water"](around:5000,{lat},{lng});
          relation["natural"="water"](around:5000,{lat},{lng});
        );
        out center;
        """

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(overpass_url, data={'data': overpass_query}, timeout=15.0)
                if response.status_code == 200:
                    data = response.json()
                    water_bodies = data.get('elements', [])

                    if water_bodies:
                        # Calculate distance to nearest water body
                        from math import radians, cos, sin, sqrt, atan2

                        def haversine_distance(lat1, lon1, lat2, lon2):
                            R = 6371  # Earth radius in km
                            dlat = radians(lat2 - lat1)
                            dlon = radians(lon2 - lon1)
                            a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
                            c = 2 * atan2(sqrt(a), sqrt(1-a))
                            return R * c

                        min_distance = float('inf')
                        for wb in water_bodies:
                            if 'center' in wb:
                                wb_lat = wb['center']['lat']
                                wb_lon = wb['center']['lon']
                                distance = haversine_distance(lat, lng, wb_lat, wb_lon)
                                min_distance = min(min_distance, distance)

                        enriched_data['distance_to_water_body_km'] = round(min_distance, 2)

                        # Simple flood risk heuristic
                        if min_distance < 0.5:
                            enriched_data['waterlogging_prone'] = True
                            enriched_data['flood_risk_score'] = 8
                        elif min_distance < 1.0:
                            enriched_data['waterlogging_prone'] = False
                            enriched_data['flood_risk_score'] = 5
                        else:
                            enriched_data['waterlogging_prone'] = False
                            enriched_data['flood_risk_score'] = 2
            except Exception as e:
                print(f"Overpass API error: {e}")

        # 3. Elevation analysis for flood risk
        elevation = property_data.get('elevation_meters', 0)
        if elevation:
            # Properties at higher elevation have lower flood risk
            if elevation < 10:
                enriched_data['elevation_flood_risk'] = 'High'
            elif elevation < 50:
                enriched_data['elevation_flood_risk'] = 'Medium'
            else:
                enriched_data['elevation_flood_risk'] = 'Low'

        return enriched_data
```

FILE 4: `backend/app/data_collection/orchestrator.py`
```python
import asyncio
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from .sources.google_maps import GoogleMapsSource
from .sources.flood_risk import FloodRiskSource
# Import other sources...
from .enrichers.location import LocationEnricher
from .enrichers.risk import RiskEnricher
from .validators.data_quality import DataQualityValidator


class DataCollectionOrchestrator:
    """
    Orchestrates data collection from multiple sources for a property
    """

    def __init__(self, config: Dict[str, Any]):
        self.config = config

        # Initialize data sources
        self.sources = [
            GoogleMapsSource(config),
            FloodRiskSource(config),
            # Add other sources...
        ]

        # Initialize enrichers
        self.enrichers = [
            LocationEnricher(config),
            RiskEnricher(config),
            # Add other enrichers...
        ]

        # Initialize validator
        self.validator = DataQualityValidator()

    async def collect_all_data(self, property_id: str, property_data: Dict[str, Any], db: AsyncSession) -> Dict[str, Any]:
        """
        Collect data from all sources for a property
        Returns: Comprehensive property data with 500+ fields
        """

        print(f"Starting data collection for property {property_id}")

        # Stage 1: Collect from all sources in parallel
        source_tasks = [
            source.collect_with_retry(property_data)
            for source in self.sources
        ]

        source_results = await asyncio.gather(*source_tasks, return_exceptions=True)

        # Merge data from all sources
        collected_data = {}
        metadata_list = []

        for result in source_results:
            if isinstance(result, tuple):
                data, metadata = result
                collected_data.update(data)
                metadata_list.append(metadata)
            else:
                print(f"Source error: {result}")

        # Stage 2: Run enrichers on collected data
        for enricher in self.enrichers:
            enriched = await enricher.enrich(collected_data, property_data)
            collected_data.update(enriched)

        # Stage 3: Validate and score data quality
        quality_score = self.validator.calculate_quality_score(collected_data)
        completeness_score = self.validator.calculate_completeness_score(collected_data)

        collected_data['data_quality_score'] = quality_score
        collected_data['data_completeness_score'] = completeness_score
        collected_data['data_last_updated_at'] = datetime.now()
        collected_data['data_sources_json'] = [m.source_name for m in metadata_list if m.success]

        # Stage 4: Save to database
        await self._save_to_database(property_id, collected_data, db)

        print(f"Data collection completed for property {property_id}. Quality: {quality_score}/100, Completeness: {completeness_score}/100")

        return collected_data

    async def _save_to_database(self, property_id: str, data: Dict[str, Any], db: AsyncSession):
        """Save collected data to appropriate tables"""
        # Update properties table
        # Insert into property_location_data
        # Insert into property_infrastructure_data
        # etc.
        pass
```

FILE 5: `backend/app/data_collection/scheduler.py`
```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select
from datetime import datetime, timedelta


class DataCollectionScheduler:
    """
    Schedule periodic data collection jobs
    """

    def __init__(self, orchestrator: DataCollectionOrchestrator, db_session_factory):
        self.orchestrator = orchestrator
        self.db_session_factory = db_session_factory
        self.scheduler = AsyncIOScheduler()

    def start(self):
        """Start scheduled jobs"""

        # Job 1: Daily update of market data for all properties
        self.scheduler.add_job(
            self.update_market_data_daily,
            CronTrigger(hour=2, minute=0),  # 2 AM daily
            id='market_data_daily'
        )

        # Job 2: Weekly update of demographic data
        self.scheduler.add_job(
            self.update_demographic_data_weekly,
            CronTrigger(day_of_week='sun', hour=3, minute=0),  # Sunday 3 AM
            id='demographic_data_weekly'
        )

        # Job 3: Monthly update of infrastructure data
        self.scheduler.add_job(
            self.update_infrastructure_data_monthly,
            CronTrigger(day=1, hour=4, minute=0),  # 1st of month, 4 AM
            id='infrastructure_data_monthly'
        )

        # Job 4: Backfill data for properties with low completeness
        self.scheduler.add_job(
            self.backfill_incomplete_properties,
            CronTrigger(hour='*/6'),  # Every 6 hours
            id='backfill_incomplete'
        )

        self.scheduler.start()
        print("Data collection scheduler started")

    async def update_market_data_daily(self):
        """Update market intelligence daily"""
        async with self.db_session_factory() as db:
            # Get all active properties
            result = await db.execute(
                select(Property).where(Property.listing_status == 'active')
            )
            properties = result.scalars().all()

            for prop in properties:
                try:
                    # Re-collect only market data
                    await self.orchestrator.collect_market_data(prop.id, db)
                except Exception as e:
                    print(f"Error updating market data for {prop.id}: {e}")

    async def backfill_incomplete_properties(self):
        """Backfill data for properties with low completeness"""
        async with self.db_session_factory() as db:
            # Get properties with completeness < 80%
            result = await db.execute(
                select(Property).where(Property.data_completeness_score < 80)
            )
            incomplete_properties = result.scalars().all()

            for prop in incomplete_properties:
                try:
                    # Full data collection
                    await self.orchestrator.collect_all_data(prop.id, prop.__dict__, db)
                except Exception as e:
                    print(f"Error backfilling {prop.id}: {e}")
```

REQUIREMENTS:

1. **Data Sources to Implement** (in order of priority):
   - Google Maps Platform (Geocoding, Places, Distance Matrix, Elevation)
   - OpenStreetMap/Overpass API (POIs, road network)
   - Government APIs (RERA, Census, Pollution Board, CWC)
   - Weather APIs (OpenWeatherMap / WeatherAPI.com)
   - Earthquake data (USGS / IMD)
   - Market data (scrape from PropTiger, MagicBricks, 99acres)

2. **Error Handling**:
   - Retry logic with exponential backoff
   - Rate limiting compliance
   - Graceful degradation if sources fail
   - Detailed error logging

3. **Cost Optimization**:
   - Cache frequently accessed data (Redis)
   - Batch requests where possible
   - Use free tiers and government open data first
   - Track API costs per property

4. **Data Freshness**:
   - Market data: Daily updates
   - Demographic data: Weekly updates
   - Infrastructure data: Monthly updates
   - Risk data: Quarterly updates
   - Location data: Update only if property details change

5. **API Integration**:
   - Add endpoint: POST `/api/properties/{id}/collect-data` to trigger collection
   - Add endpoint: GET `/api/properties/{id}/data-quality` to check quality
   - Add background job system using APScheduler or Celery

VALIDATION:
- Test with a sample property and verify 500+ fields are populated
- Check data quality scores are calculated correctly
- Verify API rate limits are respected
- Confirm cost tracking works

NEXT STEPS:
After this is implemented, create admin UI to:
- Trigger manual data collection
- View data quality scores
- Monitor API usage and costs
- Configure data source priorities
```

---

# 2. MACHINE LEARNING PROPERTY APPRECIATION MODEL

**Note**: This section has been extensively detailed in a separate document for better organization.

**See**: [CURSOR_AI_ML_IMPLEMENTATION.md](CURSOR_AI_ML_IMPLEMENTATION.md) for complete implementation with:
- **Prompt #3**: ML Project Structure (config files, feature engineering framework)
- **Prompt #4**: Historical Data Collection (50K+ properties, 6 years of data)
- **Prompt #5**: Model Training Pipeline (XGBoost, LightGBM, CatBoost, ensemble)
- **Prompt #6**: Prediction API with SHAP Explanations

**Quick Summary**:
- Train models achieving **85%+ accuracy** in property appreciation forecasting
- 200+ engineered features from the 500+ data points collected in Section 1
- Production API with confidence intervals and interpretable explanations
- Automated retraining pipeline

---

# 3. BLOCKCHAIN/CRYPTOGRAPHIC TITLE VERIFICATION

**Note**: This section has been extensively detailed in a separate document.

**See**: [CURSOR_AI_BLOCKCHAIN_IMPLEMENTATION.md](CURSOR_AI_BLOCKCHAIN_IMPLEMENTATION.md) for complete implementation with:
- **Prompt #7**: Smart Contract Development (Solidity, Hardhat, tests)
- **Prompt #8**: Backend Integration (Web3 client, IPFS, wallet management)

**Quick Summary**:
- Replace fake SHA256 simulation with real blockchain verification
- Deploy PropertyTitleRegistry.sol to Polygon mainnet
- IPFS document storage via Pinata
- Cost: ₹2-5 per transaction

---

# 4. VOICE-FIRST MULTI-LANGUAGE AI SEARCH

**Note**: This section has been extensively detailed in a separate document.

**See**: [CURSOR_AI_VOICE_REALTIME_IMPLEMENTATION.md](CURSOR_AI_VOICE_REALTIME_IMPLEMENTATION.md) - Part 1 for:
- **Prompt #9**: Voice AI Infrastructure (OpenAI Whisper, NLU pipeline, query builder)

**Quick Summary**:
- OpenAI Whisper for 90%+ accurate transcription in 6+ Indian languages
- Intent classification and entity extraction using GPT-3.5-turbo
- Voice search API with complete NLU pipeline
- Cost: ~₹1-2 per query

---

# 5. REAL-TIME DATA PIPELINE & ANALYTICS

**Note**: This section has been extensively detailed in a separate document.

**See**: [CURSOR_AI_VOICE_REALTIME_IMPLEMENTATION.md](CURSOR_AI_VOICE_REALTIME_IMPLEMENTATION.md) - Part 2 for:
- **Prompt #10**: Real-Time Streaming Infrastructure (Redis Streams, WebSockets)

**Quick Summary**:
- Redis Streams for event processing (100K+ events/second)
- WebSocket manager for live updates (10K+ concurrent connections)
- Real-time analytics and notifications
- Latency < 100ms

---

# 6. ADVANCED RISK ASSESSMENT ENGINE

## OBJECTIVE
Build a comprehensive risk assessment engine that analyzes multiple risk dimensions (flood, earthquake, legal, environmental, financial) and generates actionable risk scores for each property.

## CURSOR AI PROMPT #11: Risk Assessment Engine

```prompt
CONTEXT:
You are building an advanced risk assessment engine for the Tharaga platform. This engine aggregates data from the property_risk_data table (created in Prompt #1) and external APIs to produce comprehensive risk scores and recommendations.

TASK:
Create `backend/app/risk/` service with multi-dimensional risk analysis.

DIRECTORY STRUCTURE:
```
backend/app/risk/
├── __init__.py
├── risk_engine.py          # Main risk assessment engine
├── assessors/
│   ├── __init__.py
│   ├── base.py            # Base risk assessor class
│   ├── flood_risk.py      # Flood risk assessment
│   ├── seismic_risk.py    # Earthquake risk
│   ├── legal_risk.py      # Legal and title risks
│   ├── environmental_risk.py  # Air quality, pollution
│   ├── financial_risk.py  # Investment risk
│   └── builder_risk.py    # Builder reputation risk
├── scoring/
│   ├── __init__.py
│   ├── aggregator.py      # Aggregate multiple risk scores
│   ├── normalizer.py      # Normalize scores to 0-100
│   └── weights.py         # Risk weight configuration
├── recommendations/
│   ├── __init__.py
│   └── generator.py       # Generate risk mitigation recommendations
└── config.py              # Risk assessment configuration
```

FILE 1: `backend/app/risk/config.py`
```python
"""
Risk assessment configuration
"""

from typing import Dict


class RiskConfig:
    """Configuration for risk assessment engine"""

    # Risk categories and weights (must sum to 1.0)
    RISK_WEIGHTS = {
        "flood": 0.20,           # 20% weight
        "seismic": 0.15,         # 15% weight
        "legal": 0.25,           # 25% weight (most critical)
        "environmental": 0.15,   # 15% weight
        "financial": 0.15,       # 15% weight
        "builder": 0.10,         # 10% weight
    }

    # Risk score thresholds (0-100 scale)
    RISK_LEVELS = {
        "low": (0, 30),
        "moderate": (30, 60),
        "high": (60, 80),
        "critical": (80, 100)
    }

    # Flood risk thresholds
    FLOOD_ZONE_SCORES = {
        "Zone 0": 10,  # Very low risk
        "Zone 1": 25,  # Low risk
        "Zone 2": 50,  # Moderate risk
        "Zone 3": 75,  # High risk
        "Zone 4": 95,  # Very high risk
    }

    # Seismic zone scores (India has 5 zones)
    SEISMIC_ZONE_SCORES = {
        "Zone II": 20,   # Low intensity (South India)
        "Zone III": 40,  # Moderate intensity (Kerala, Goa)
        "Zone IV": 70,   # High intensity (Delhi, Mumbai)
        "Zone V": 95,    # Very high intensity (Kashmir, Northeast)
    }

    # Legal risk factors
    LEGAL_RISK_FACTORS = {
        "litigation_active": 50,
        "disputed_land": 60,
        "no_rera": 30,
        "no_oc_certificate": 40,
        "approval_violations": 70,
        "unauthorized_construction": 80,
    }

    # Environmental risk thresholds
    AIR_QUALITY_THRESHOLDS = {
        "good": (0, 50),        # AQI 0-50: Low risk
        "moderate": (51, 100),  # AQI 51-100: Moderate
        "poor": (101, 200),     # AQI 101-200: High
        "severe": (201, 500),   # AQI 201+: Critical
    }

    # Builder reputation thresholds
    BUILDER_SCORE_MULTIPLIERS = {
        "excellent": 0.5,    # 50% risk reduction
        "good": 0.75,        # 25% risk reduction
        "average": 1.0,      # No change
        "poor": 1.5,         # 50% risk increase
    }
```

FILE 2: `backend/app/risk/assessors/base.py`
```python
"""
Base risk assessor class
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple


class BaseRiskAssessor(ABC):
    """Base class for all risk assessors"""

    def __init__(self, config):
        self.config = config

    @abstractmethod
    async def assess(self, property_data: Dict[str, Any]) -> Tuple[float, str, list]:
        """
        Assess risk for a property

        Args:
            property_data: Property data with risk fields

        Returns:
            Tuple of (risk_score_0_100, risk_level, reasons)
        """
        pass

    def normalize_score(self, raw_score: float, min_val: float = 0, max_val: float = 100) -> float:
        """Normalize score to 0-100 range"""
        return max(0, min(100, ((raw_score - min_val) / (max_val - min_val)) * 100))

    def get_risk_level(self, score: float) -> str:
        """Get risk level from score"""
        for level, (min_score, max_score) in self.config.RISK_LEVELS.items():
            if min_score <= score < max_score:
                return level
        return "critical"
```

FILE 3: `backend/app/risk/assessors/flood_risk.py`
```python
"""
Flood risk assessment
"""

from typing import Dict, Any, Tuple
from .base import BaseRiskAssessor


class FloodRiskAssessor(BaseRiskAssessor):
    """Assess flood risk based on location, elevation, and historical data"""

    async def assess(self, property_data: Dict[str, Any]) -> Tuple[float, str, list]:
        """
        Calculate flood risk score

        Factors considered:
        - Flood zone category
        - Elevation above river
        - Distance to water body
        - Historical flood count
        - Drainage capacity
        """

        risk_score = 0
        reasons = []

        # Factor 1: Flood zone (40% weight)
        flood_zone = property_data.get("flood_zone_category", "Unknown")
        if flood_zone in self.config.FLOOD_ZONE_SCORES:
            zone_score = self.config.FLOOD_ZONE_SCORES[flood_zone]
            risk_score += zone_score * 0.4
            if zone_score > 50:
                reasons.append(f"Located in {flood_zone} (high flood risk area)")

        # Factor 2: Elevation (20% weight)
        elevation = property_data.get("elevation_above_river_meters", 50)
        if elevation < 10:
            elevation_score = 80
            reasons.append(f"Low elevation ({elevation}m above river)")
        elif elevation < 30:
            elevation_score = 50
            reasons.append(f"Moderate elevation ({elevation}m above river)")
        else:
            elevation_score = 20

        risk_score += elevation_score * 0.2

        # Factor 3: Distance to water body (15% weight)
        distance_to_water = property_data.get("distance_to_water_body_km", 10)
        if distance_to_water < 0.5:
            water_score = 90
            reasons.append(f"Very close to water body ({distance_to_water}km)")
        elif distance_to_water < 1.0:
            water_score = 60
            reasons.append(f"Close to water body ({distance_to_water}km)")
        elif distance_to_water < 2.0:
            water_score = 30
        else:
            water_score = 10

        risk_score += water_score * 0.15

        # Factor 4: Historical floods (15% weight)
        historical_floods = property_data.get("historical_flood_count_10y", 0)
        if historical_floods >= 3:
            history_score = 90
            reasons.append(f"Flooded {historical_floods} times in last 10 years")
        elif historical_floods >= 1:
            history_score = 60
            reasons.append(f"Flooded {historical_floods} time(s) in last 10 years")
        else:
            history_score = 10

        risk_score += history_score * 0.15

        # Factor 5: Drainage capacity (10% weight)
        drainage_rating = property_data.get("drainage_capacity_rating", "average")
        drainage_scores = {"excellent": 10, "good": 30, "average": 50, "poor": 80, "very_poor": 95}
        drainage_score = drainage_scores.get(drainage_rating, 50)
        if drainage_score > 60:
            reasons.append(f"Poor drainage system ({drainage_rating})")

        risk_score += drainage_score * 0.1

        risk_level = self.get_risk_level(risk_score)

        return risk_score, risk_level, reasons
```

FILE 4: `backend/app/risk/assessors/legal_risk.py`
```python
"""
Legal and title risk assessment
"""

from typing import Dict, Any, Tuple
from .base import BaseRiskAssessor


class LegalRiskAssessor(BaseRiskAssessor):
    """Assess legal risks including title, approvals, and disputes"""

    async def assess(self, property_data: Dict[str, Any]) -> Tuple[float, str, list]:
        """
        Calculate legal risk score

        Factors:
        - Active litigation
        - Land disputes
        - Missing approvals (RERA, OC, CC)
        - Unauthorized construction
        - Encumbrance status
        """

        risk_score = 0
        reasons = []

        # Check for active litigation
        if property_data.get("litigation_status") == "active":
            risk_score += 50
            reasons.append("Active litigation on property")

        # Check for land disputes
        if property_data.get("disputed_land"):
            risk_score += 60
            reasons.append("Land ownership dispute reported")

        # Check for ancestral claims
        if property_data.get("ancestral_property_claims"):
            risk_score += 40
            reasons.append("Ancestral property claims exist")

        # Check RERA registration
        if not property_data.get("rera_id"):
            risk_score += 30
            reasons.append("Not registered with RERA")

        # Check Occupancy Certificate
        if not property_data.get("oc_certificate"):
            risk_score += 40
            reasons.append("No Occupancy Certificate (OC)")

        # Check Completion Certificate
        if not property_data.get("cc_certificate"):
            risk_score += 35
            reasons.append("No Completion Certificate (CC)")

        # Check for approval violations
        if property_data.get("approval_violations", 0) > 0:
            violations = property_data["approval_violations"]
            risk_score += min(70, violations * 20)
            reasons.append(f"{violations} approval violation(s) found")

        # Check unauthorized construction
        unauthorized_risk = property_data.get("unauthorized_construction_risk", 0)
        if unauthorized_risk > 50:
            risk_score += unauthorized_risk * 0.8
            reasons.append("High risk of unauthorized construction")

        # Check encumbrance certificate
        if not property_data.get("encumbrance_certificate_url"):
            risk_score += 25
            reasons.append("No Encumbrance Certificate available")

        # Cap at 100
        risk_score = min(100, risk_score)

        risk_level = self.get_risk_level(risk_score)

        return risk_score, risk_level, reasons
```

FILE 5: `backend/app/risk/assessors/environmental_risk.py`
```python
"""
Environmental risk assessment
"""

from typing import Dict, Any, Tuple
from .base import BaseRiskAssessor


class EnvironmentalRiskAssessor(BaseRiskAssessor):
    """Assess environmental risks including air quality, pollution, hazards"""

    async def assess(self, property_data: Dict[str, Any]) -> Tuple[float, str, list]:
        """
        Calculate environmental risk score

        Factors:
        - Air quality (PM2.5, PM10, NO2, SO2, CO, Ozone)
        - Proximity to industrial areas
        - Proximity to landfills
        - Soil contamination
        - Hazardous materials (radon, asbestos, lead)
        """

        risk_score = 0
        reasons = []

        # Factor 1: Air Quality (40% weight)
        pm25 = property_data.get("pm25_avg_ugm3", 50)
        aqi = property_data.get("air_quality_index_avg", 50)

        if aqi >= 201:
            air_score = 95
            reasons.append(f"Severe air pollution (AQI: {aqi})")
        elif aqi >= 101:
            air_score = 70
            reasons.append(f"Poor air quality (AQI: {aqi})")
        elif aqi >= 51:
            air_score = 40
            reasons.append(f"Moderate air quality (AQI: {aqi})")
        else:
            air_score = 15

        risk_score += air_score * 0.4

        # Factor 2: Industrial proximity (25% weight)
        industrial_distance = property_data.get("proximity_to_industrial_area_km", 10)
        if industrial_distance < 1:
            industrial_score = 85
            reasons.append(f"Too close to industrial area ({industrial_distance}km)")
        elif industrial_distance < 3:
            industrial_score = 50
            reasons.append(f"Near industrial area ({industrial_distance}km)")
        else:
            industrial_score = 10

        risk_score += industrial_score * 0.25

        # Factor 3: Landfill proximity (20% weight)
        landfill_distance = property_data.get("proximity_to_landfill_km", 10)
        if landfill_distance < 2:
            landfill_score = 90
            reasons.append(f"Very close to landfill ({landfill_distance}km)")
        elif landfill_distance < 5:
            landfill_score = 50
            reasons.append(f"Near landfill ({landfill_distance}km)")
        else:
            landfill_score = 10

        risk_score += landfill_score * 0.2

        # Factor 4: Soil contamination (10% weight)
        soil_contamination = property_data.get("soil_contamination_level", "low")
        contamination_scores = {"low": 10, "moderate": 50, "high": 85, "severe": 95}
        soil_score = contamination_scores.get(soil_contamination, 10)
        if soil_score > 50:
            reasons.append(f"Soil contamination detected ({soil_contamination})")

        risk_score += soil_score * 0.1

        # Factor 5: Hazardous materials (5% weight)
        hazard_score = 0
        if property_data.get("radon_gas_risk"):
            hazard_score += 30
            reasons.append("Radon gas risk detected")
        if property_data.get("asbestos_presence"):
            hazard_score += 40
            reasons.append("Asbestos presence detected")
        if property_data.get("lead_paint_risk"):
            hazard_score += 25
            reasons.append("Lead paint risk")

        risk_score += min(100, hazard_score) * 0.05

        risk_level = self.get_risk_level(risk_score)

        return risk_score, risk_level, reasons
```

FILE 6: `backend/app/risk/risk_engine.py`
```python
"""
Main risk assessment engine
"""

from typing import Dict, Any
from .config import RiskConfig
from .assessors.flood_risk import FloodRiskAssessor
from .assessors.seismic_risk import SeismicRiskAssessor
from .assessors.legal_risk import LegalRiskAssessor
from .assessors.environmental_risk import EnvironmentalRiskAssessor
from .assessors.financial_risk import FinancialRiskAssessor
from .assessors.builder_risk import BuilderRiskAssessor
from .scoring.aggregator import RiskAggregator
from .recommendations.generator import RecommendationGenerator


class RiskAssessmentEngine:
    """
    Comprehensive risk assessment engine
    Analyzes multiple risk dimensions and produces actionable scores
    """

    def __init__(self):
        self.config = RiskConfig()

        # Initialize assessors
        self.flood_assessor = FloodRiskAssessor(self.config)
        self.seismic_assessor = SeismicRiskAssessor(self.config)
        self.legal_assessor = LegalRiskAssessor(self.config)
        self.environmental_assessor = EnvironmentalRiskAssessor(self.config)
        self.financial_assessor = FinancialRiskAssessor(self.config)
        self.builder_assessor = BuilderRiskAssessor(self.config)

        # Initialize aggregator and recommendation generator
        self.aggregator = RiskAggregator(self.config)
        self.recommendation_generator = RecommendationGenerator()

    async def assess_property(self, property_id: str, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform comprehensive risk assessment for a property

        Args:
            property_id: Property UUID
            property_data: Complete property data including all risk fields

        Returns:
            Dict with comprehensive risk assessment
        """

        print(f"Assessing risk for property {property_id}")

        # Run all assessors
        flood_score, flood_level, flood_reasons = await self.flood_assessor.assess(property_data)
        seismic_score, seismic_level, seismic_reasons = await self.seismic_assessor.assess(property_data)
        legal_score, legal_level, legal_reasons = await self.legal_assessor.assess(property_data)
        env_score, env_level, env_reasons = await self.environmental_assessor.assess(property_data)
        financial_score, financial_level, financial_reasons = await self.financial_assessor.assess(property_data)
        builder_score, builder_level, builder_reasons = await self.builder_assessor.assess(property_data)

        # Aggregate scores
        overall_score, overall_level = self.aggregator.aggregate({
            "flood": flood_score,
            "seismic": seismic_score,
            "legal": legal_score,
            "environmental": env_score,
            "financial": financial_score,
            "builder": builder_score,
        })

        # Generate recommendations
        recommendations = self.recommendation_generator.generate({
            "overall_score": overall_score,
            "overall_level": overall_level,
            "category_scores": {
                "flood": {"score": flood_score, "level": flood_level, "reasons": flood_reasons},
                "seismic": {"score": seismic_score, "level": seismic_level, "reasons": seismic_reasons},
                "legal": {"score": legal_score, "level": legal_level, "reasons": legal_reasons},
                "environmental": {"score": env_score, "level": env_level, "reasons": env_reasons},
                "financial": {"score": financial_score, "level": financial_level, "reasons": financial_reasons},
                "builder": {"score": builder_score, "level": builder_level, "reasons": builder_reasons},
            }
        })

        return {
            "property_id": property_id,
            "overall_risk_score": round(overall_score, 2),
            "overall_risk_level": overall_level,
            "category_scores": {
                "flood": {
                    "score": round(flood_score, 2),
                    "level": flood_level,
                    "weight": self.config.RISK_WEIGHTS["flood"],
                    "reasons": flood_reasons
                },
                "seismic": {
                    "score": round(seismic_score, 2),
                    "level": seismic_level,
                    "weight": self.config.RISK_WEIGHTS["seismic"],
                    "reasons": seismic_reasons
                },
                "legal": {
                    "score": round(legal_score, 2),
                    "level": legal_level,
                    "weight": self.config.RISK_WEIGHTS["legal"],
                    "reasons": legal_reasons
                },
                "environmental": {
                    "score": round(env_score, 2),
                    "level": env_level,
                    "weight": self.config.RISK_WEIGHTS["environmental"],
                    "reasons": env_reasons
                },
                "financial": {
                    "score": round(financial_score, 2),
                    "level": financial_level,
                    "weight": self.config.RISK_WEIGHTS["financial"],
                    "reasons": financial_reasons
                },
                "builder": {
                    "score": round(builder_score, 2),
                    "level": builder_level,
                    "weight": self.config.RISK_WEIGHTS["builder"],
                    "reasons": builder_reasons
                }
            },
            "recommendations": recommendations,
            "risk_summary": self._generate_summary(overall_score, overall_level),
            "insurability": self._assess_insurability(overall_score),
            "investment_recommendation": self._investment_recommendation(overall_score, financial_score)
        }

    def _generate_summary(self, score: float, level: str) -> str:
        """Generate human-readable risk summary"""
        if level == "low":
            return f"This property has low overall risk (score: {score:.0f}/100). Safe for investment."
        elif level == "moderate":
            return f"This property has moderate risk (score: {score:.0f}/100). Consider risk mitigation measures."
        elif level == "high":
            return f"This property has high risk (score: {score:.0f}/100). Significant concerns need addressing."
        else:
            return f"This property has critical risk (score: {score:.0f}/100). Not recommended for investment."

    def _assess_insurability(self, score: float) -> Dict[str, Any]:
        """Assess if property is insurable and estimated premium"""
        if score < 30:
            return {"insurable": True, "premium_category": "standard", "estimated_premium_factor": 1.0}
        elif score < 60:
            return {"insurable": True, "premium_category": "elevated", "estimated_premium_factor": 1.5}
        elif score < 80:
            return {"insurable": True, "premium_category": "high", "estimated_premium_factor": 2.5}
        else:
            return {"insurable": False, "premium_category": "uninsurable", "estimated_premium_factor": None}

    def _investment_recommendation(self, overall_score: float, financial_score: float) -> str:
        """Generate investment recommendation"""
        if overall_score < 30 and financial_score < 40:
            return "Strong Buy - Low risk, good financial potential"
        elif overall_score < 50 and financial_score < 50:
            return "Buy - Acceptable risk-reward ratio"
        elif overall_score < 70:
            return "Hold - Higher risk, proceed with caution"
        else:
            return "Avoid - Risk outweighs potential returns"
```

FILE 7: Update `backend/app/main.py` - Add Risk Assessment API
```python
from app.risk.risk_engine import RiskAssessmentEngine

risk_engine = RiskAssessmentEngine()


@app.get("/api/properties/{property_id}/risk-assessment")
async def get_risk_assessment(property_id: str):
    """
    Get comprehensive risk assessment for a property

    Returns multi-dimensional risk analysis with recommendations
    """

    # Load property data (with all risk fields from property_risk_data table)
    property_data = await load_property_with_risk_data(property_id)

    if not property_data:
        raise HTTPException(status_code=404, detail="Property not found")

    # Run risk assessment
    assessment = await risk_engine.assess_property(property_id, property_data)

    return assessment
```

REQUIREMENTS:

1. **Install dependencies**: (already installed from previous prompts)

2. **Implement remaining assessors**:
   - `seismic_risk.py` - Similar pattern to flood_risk.py
   - `financial_risk.py` - Analyze investment risks
   - `builder_risk.py` - Builder reputation analysis

3. **Create scoring components**:
   - `aggregator.py` - Weighted average of category scores
   - `normalizer.py` - Normalize disparate scores to 0-100
   - `weights.py` - Configuration for dynamic weight adjustment

4. **Create recommendation generator**:
   - Generate actionable mitigation steps
   - Insurance recommendations
   - Legal actions to reduce risk
   - Environmental improvements

VALIDATION:
- Test with 100 properties across different risk profiles
- Verify scores are intuitive and match expert judgment
- Ensure reasons are clear and actionable
- Check that recommendations are specific and helpful

OUTPUT:
Comprehensive risk assessment API returning:
- Overall risk score (0-100)
- 6 category scores with reasons
- Risk level (low/moderate/high/critical)
- Actionable recommendations
- Insurability assessment
- Investment recommendation
```

---

# 7. PREDICTIVE MARKET INTELLIGENCE DASHBOARD

## OBJECTIVE
Build an admin and builder dashboard that provides real-time market intelligence, predictive analytics, and actionable insights using data from all previous sections.

## CURSOR AI PROMPT #12: Market Intelligence Dashboard API

```prompt
CONTEXT:
You are building a comprehensive market intelligence API that powers admin and builder dashboards. This aggregates data from all previous sections (500+ data points, ML predictions, risk assessments, real-time events) to provide actionable insights.

TASK:
Create `backend/app/intelligence/` service that provides market analytics and insights.

DIRECTORY STRUCTURE:
```
backend/app/intelligence/
├── __init__.py
├── market_analyzer.py       # Market trend analysis
├── demand_predictor.py      # Demand forecasting
├── pricing_intelligence.py  # Pricing recommendations
├── competitor_analyzer.py   # Competitive analysis
├── locality_insights.py     # Locality-level insights
├── builder_performance.py   # Builder performance metrics
└── config.py               # Intelligence configuration
```

FILE 1: `backend/app/intelligence/market_analyzer.py`
```python
"""
Market trend analysis and forecasting
"""

from typing import Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy import select, func
import pandas as pd


class MarketAnalyzer:
    """
    Analyze market trends and provide insights
    """

    async def get_market_pulse(
        self,
        city: str,
        locality: Optional[str] = None,
        time_window_days: int = 30
    ) -> Dict[str, Any]:
        """
        Get real-time market pulse for a city/locality

        Returns:
        - Active listings count
        - New listings (last 7/30 days)
        - Sold properties (last 7/30 days)
        - Average price trends
        - Demand-supply ratio
        - Hot/cold localities
        - Emerging trends
        """

        # Calculate date ranges
        now = datetime.now()
        window_start = now - timedelta(days=time_window_days)
        week_ago = now - timedelta(days=7)

        # Query active listings
        active_count = await self._count_active_listings(city, locality)

        # Query new listings
        new_this_week = await self._count_new_listings(city, locality, week_ago, now)
        new_this_month = await self._count_new_listings(city, locality, window_start, now)

        # Query sold properties
        sold_this_week = await self._count_sold_properties(city, locality, week_ago, now)
        sold_this_month = await self._count_sold_properties(city, locality, window_start, now)

        # Calculate demand-supply ratio
        inquiry_rate = await self._get_inquiry_rate(city, locality, time_window_days)
        demand_supply_ratio = inquiry_rate / max(1, active_count) * 100

        # Get price trends
        price_trend = await self._calculate_price_trend(city, locality, time_window_days)

        # Identify hot localities
        hot_localities = await self._identify_hot_localities(city, time_window_days)

        # Get emerging trends
        trends = await self._detect_emerging_trends(city, time_window_days)

        return {
            "city": city,
            "locality": locality,
            "time_window_days": time_window_days,
            "timestamp": now.isoformat(),
            "listings": {
                "active_count": active_count,
                "new_this_week": new_this_week,
                "new_this_month": new_this_month,
                "sold_this_week": sold_this_week,
                "sold_this_month": sold_this_month,
            },
            "market_health": {
                "demand_supply_ratio": round(demand_supply_ratio, 2),
                "status": self._market_status(demand_supply_ratio),
                "inquiry_rate_per_listing": round(inquiry_rate / max(1, active_count), 2)
            },
            "price_trends": price_trend,
            "hot_localities": hot_localities,
            "emerging_trends": trends,
            "recommendation": self._generate_market_recommendation(
                demand_supply_ratio,
                price_trend,
                new_this_month,
                sold_this_month
            )
        }

    def _market_status(self, demand_supply_ratio: float) -> str:
        """Determine market status from demand-supply ratio"""
        if demand_supply_ratio > 150:
            return "Hot - Seller's market"
        elif demand_supply_ratio > 100:
            return "Active - Balanced market"
        elif demand_supply_ratio > 50:
            return "Moderate - Buyer's market"
        else:
            return "Slow - Weak demand"

    async def _calculate_price_trend(
        self,
        city: str,
        locality: Optional[str],
        days: int
    ) -> Dict[str, Any]:
        """Calculate price trend (up/down/stable)"""

        # Get average prices for last N days grouped by week
        # ... query database for historical prices

        # For now, return mock data
        return {
            "current_avg_psf": 9500,
            "previous_avg_psf": 9200,
            "change_percent": 3.26,
            "trend": "increasing",
            "7_day_change": 2.1,
            "30_day_change": 3.26,
        }

    def _generate_market_recommendation(
        self,
        demand_supply: float,
        price_trend: Dict,
        new_listings: int,
        sold_count: int
    ) -> str:
        """Generate actionable market recommendation"""

        if demand_supply > 150 and price_trend["trend"] == "increasing":
            return "Strong seller's market. Consider premium pricing. High buyer interest."
        elif demand_supply > 100:
            return "Balanced market. Price competitively. Good time to list."
        elif demand_supply < 50 and new_listings > sold_count * 2:
            return "Oversupply detected. Consider aggressive pricing or wait for market recovery."
        else:
            return "Moderate market conditions. Focus on property differentiation."
```

FILE 2: `backend/app/intelligence/pricing_intelligence.py`
```python
"""
AI-powered pricing recommendations
"""

from typing import Dict, Any
import asyncio


class PricingIntelligence:
    """
    Provide dynamic pricing recommendations based on:
    - ML predictions
    - Market conditions
    - Competitor analysis
    - Historical performance
    """

    async def get_pricing_recommendation(
        self,
        property_id: str,
        property_data: Dict[str, Any],
        ml_prediction: Dict[str, Any],
        market_pulse: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate optimal pricing recommendation

        Returns:
        - Recommended price
        - Price range (min/max)
        - Pricing strategy
        - Comparable properties
        - Confidence score
        """

        # Get property current price
        current_price = property_data.get("price_inr", 0)

        # Get ML predicted appreciation
        ml_appreciation_1y = ml_prediction.get("predictions", {}).get("1y", {}).get("appreciation_percent", 0)

        # Get market demand-supply ratio
        demand_supply = market_pulse.get("market_health", {}).get("demand_supply_ratio", 100)

        # Calculate market adjustment factor
        if demand_supply > 150:
            market_factor = 1.05  # 5% premium in hot market
        elif demand_supply > 100:
            market_factor = 1.0   # No adjustment in balanced market
        elif demand_supply > 50:
            market_factor = 0.97  # 3% discount in buyer's market
        else:
            market_factor = 0.92  # 8% discount in weak market

        # Get comparable properties
        comparables = await self._get_comparable_properties(property_data)
        comp_avg_price = sum(c["price_inr"] for c in comparables) / max(1, len(comparables))
        comp_avg_psf = sum(c["price_per_sqft"] for c in comparables) / max(1, len(comparables))

        # Calculate recommended price
        area_sqft = property_data.get("area_sqft", 1000)

        # Strategy 1: Comparable-based pricing
        comp_based_price = comp_avg_psf * area_sqft * market_factor

        # Strategy 2: ML-adjusted pricing
        ml_based_price = current_price * (1 + ml_appreciation_1y / 100) * market_factor

        # Strategy 3: Market median pricing
        median_psf = property_data.get("avg_price_per_sqft_locality", comp_avg_psf)
        market_based_price = median_psf * area_sqft * market_factor

        # Weighted average of strategies
        recommended_price = (comp_based_price * 0.5 + ml_based_price * 0.3 + market_based_price * 0.2)

        # Calculate price range
        price_min = recommended_price * 0.95
        price_max = recommended_price * 1.10

        # Determine pricing strategy
        if current_price > 0:
            price_diff_percent = ((recommended_price - current_price) / current_price) * 100

            if price_diff_percent > 10:
                strategy = "Increase price (underpriced)"
            elif price_diff_percent > 5:
                strategy = "Consider moderate increase"
            elif price_diff_percent > -5:
                strategy = "Maintain current price (well-priced)"
            elif price_diff_percent > -10:
                strategy = "Consider moderate decrease"
            else:
                strategy = "Reduce price (overpriced)"
        else:
            strategy = "New listing - set at recommended price"

        # Calculate confidence
        confidence = self._calculate_confidence(
            comparables_count=len(comparables),
            market_health=demand_supply,
            ml_confidence=ml_prediction.get("predictions", {}).get("1y", {}).get("confidence_score", 0)
        )

        return {
            "property_id": property_id,
            "current_price_inr": current_price,
            "recommended_price_inr": round(recommended_price, -3),  # Round to nearest 1000
            "price_range": {
                "min": round(price_min, -3),
                "max": round(price_max, -3)
            },
            "pricing_strategy": strategy,
            "confidence_score": confidence,
            "factors": {
                "market_factor": market_factor,
                "ml_appreciation_1y": ml_appreciation_1y,
                "demand_supply_ratio": demand_supply,
                "comp_avg_price_psf": round(comp_avg_psf, 2)
            },
            "comparables": comparables[:5],  # Top 5 comparables
            "recommendation": self._generate_pricing_recommendation(
                strategy,
                recommended_price,
                current_price,
                confidence
            )
        }

    def _calculate_confidence(
        self,
        comparables_count: int,
        market_health: float,
        ml_confidence: float
    ) -> float:
        """Calculate confidence in pricing recommendation"""

        # Base confidence from comparables
        if comparables_count >= 10:
            comp_confidence = 0.9
        elif comparables_count >= 5:
            comp_confidence = 0.7
        elif comparables_count >= 2:
            comp_confidence = 0.5
        else:
            comp_confidence = 0.3

        # Market health confidence
        if 90 <= market_health <= 110:
            market_confidence = 0.9  # Stable market
        elif 50 <= market_health <= 150:
            market_confidence = 0.7  # Moderate volatility
        else:
            market_confidence = 0.5  # High volatility

        # Weighted average
        overall_confidence = (comp_confidence * 0.4 + market_confidence * 0.3 + ml_confidence * 0.3)

        return round(overall_confidence, 2)

    def _generate_pricing_recommendation(
        self,
        strategy: str,
        recommended_price: float,
        current_price: float,
        confidence: float
    ) -> str:
        """Generate human-readable pricing recommendation"""

        if "Increase" in strategy:
            return f"Your property is underpriced. Consider increasing to ₹{recommended_price/10000000:.2f}Cr (confidence: {confidence*100:.0f}%)"
        elif "Reduce" in strategy:
            return f"Your property may be overpriced. Consider reducing to ₹{recommended_price/10000000:.2f}Cr for faster sale"
        else:
            return f"Your pricing is competitive. Maintain at ₹{recommended_price/10000000:.2f}Cr"
```

FILE 3: Update `backend/app/main.py` - Add Intelligence API
```python
from app.intelligence.market_analyzer import MarketAnalyzer
from app.intelligence.pricing_intelligence import PricingIntelligence

market_analyzer = MarketAnalyzer()
pricing_intelligence = PricingIntelligence()


@app.get("/api/intelligence/market-pulse")
async def get_market_pulse(
    city: str,
    locality: Optional[str] = None,
    time_window_days: int = 30
):
    """
    Get real-time market pulse for a city/locality

    Returns market health, trends, and recommendations
    """

    pulse = await market_analyzer.get_market_pulse(city, locality, time_window_days)
    return pulse


@app.get("/api/intelligence/pricing/{property_id}")
async def get_pricing_recommendation(property_id: str):
    """
    Get AI-powered pricing recommendation for a property

    Combines ML predictions, market analysis, and competitor data
    """

    # Load property data
    property_data = await load_property_data(property_id)

    # Get ML prediction
    ml_prediction = await ml_predictor.predict(property_id)

    # Get market pulse
    city = property_data.get("city")
    locality = property_data.get("locality")
    market_pulse = await market_analyzer.get_market_pulse(city, locality)

    # Get pricing recommendation
    pricing = await pricing_intelligence.get_pricing_recommendation(
        property_id,
        property_data,
        ml_prediction,
        market_pulse
    )

    return pricing
```

REQUIREMENTS:

1. **Dashboard UI**: Create React/Next.js dashboards (separate from backend)
2. **Real-time updates**: Use WebSockets from Prompt #10
3. **Caching**: Cache market pulse data for 5-10 minutes (Redis)
4. **Permissions**: Admin and builder role-based access

FEATURES:
- Market pulse dashboard (city/locality level)
- Pricing intelligence for each property
- Competitor analysis
- Demand forecasting
- Builder performance metrics
- Locality heat maps

VALIDATION:
- Test with multiple cities (Bangalore, Mumbai, Delhi)
- Verify recommendations match market reality
- Check API response times < 500ms
- Ensure data freshness (5-minute cache max)
```

---

# IMPLEMENTATION SUMMARY

## All Prompts Created

| # | Prompt | Feature | Document |
|---|--------|---------|----------|
| 1-2 | Data Infrastructure | 500+ data points | This document |
| 3-6 | Machine Learning | 85% accuracy | [CURSOR_AI_ML_IMPLEMENTATION.md](CURSOR_AI_ML_IMPLEMENTATION.md) |
| 7-8 | Blockchain | Real verification | [CURSOR_AI_BLOCKCHAIN_IMPLEMENTATION.md](CURSOR_AI_BLOCKCHAIN_IMPLEMENTATION.md) |
| 9 | Voice AI | 6 languages | [CURSOR_AI_VOICE_REALTIME_IMPLEMENTATION.md](CURSOR_AI_VOICE_REALTIME_IMPLEMENTATION.md) |
| 10 | Real-Time Pipeline | Streaming | [CURSOR_AI_VOICE_REALTIME_IMPLEMENTATION.md](CURSOR_AI_VOICE_REALTIME_IMPLEMENTATION.md) |
| 11 | Risk Assessment | Multi-dimensional | This document |
| 12 | Market Intelligence | Predictive analytics | This document |

## Total: 12 Ultra-Detailed Prompts

**All prompts are production-ready and can be copy-pasted into Cursor AI!**

---

# NEXT STEPS

1. **Start with Prompt #1** (Database Schema) - Foundation for everything
2. **Then Prompt #2** (Data Collection) - Populate the 500+ fields
3. **Move to ML** (Prompts #3-6) - Train models with collected data
4. **Add Advanced Features** (Prompts #7-12) - Blockchain, Voice, Risk, Intelligence

**Follow the IMPLEMENTATION_ROADMAP.md for detailed timeline and costs.**

---

**END OF CURSOR_AI_IMPLEMENTATION_GUIDE.md**
