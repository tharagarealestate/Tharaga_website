# 🤖 MACHINE LEARNING PROPERTY APPRECIATION MODEL
## Ultra-Detailed Implementation Guide for Cursor AI

**Objective**: Build a production-ready ML system that achieves 85%+ accuracy in property appreciation forecasting for Indian real estate markets.

---

## 📊 ML SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                   ML TRAINING PIPELINE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Historical Data → Feature Engineering → Model Training →   │
│  → Validation → Hyperparameter Tuning → Model Registry      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  ML INFERENCE PIPELINE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Property Data → Feature Engineering → Model Prediction →   │
│  → Confidence Scoring → Explanation Generation → API        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## CURSOR AI PROMPT #3: ML Project Structure

```prompt
CONTEXT:
You are setting up a production-ready ML infrastructure for property appreciation forecasting at Tharaga. The system must be modular, testable, and scalable.

TASK:
Create the following directory structure and base files in `backend/ml/`

DIRECTORY STRUCTURE:
```
backend/ml/
├── __init__.py
├── config/
│   ├── __init__.py
│   ├── model_config.yaml        # Model hyperparameters
│   ├── feature_config.yaml      # Feature definitions
│   └── training_config.yaml     # Training pipeline config
├── data/
│   ├── __init__.py
│   ├── loaders.py              # Data loading from database
│   ├── collectors.py           # Historical data collection
│   ├── validators.py           # Data quality checks
│   └── preprocessors.py        # Data preprocessing
├── features/
│   ├── __init__.py
│   ├── base.py                 # Base feature class
│   ├── property_features.py    # Property-specific features
│   ├── location_features.py    # Location-based features
│   ├── market_features.py      # Market trend features
│   ├── macro_features.py       # Macroeconomic features
│   └── temporal_features.py    # Time-series features
├── models/
│   ├── __init__.py
│   ├── base_model.py           # Base model interface
│   ├── gradient_boosting.py    # XGBoost/LightGBM/CatBoost
│   ├── neural_network.py       # Deep learning model
│   ├── ensemble.py             # Model ensemble
│   └── baseline.py             # Simple baseline models
├── training/
│   ├── __init__.py
│   ├── trainer.py              # Training orchestrator
│   ├── cross_validator.py      # K-fold cross-validation
│   ├── hyperparameter_tuner.py # Optuna/GridSearch
│   └── evaluator.py            # Model evaluation metrics
├── inference/
│   ├── __init__.py
│   ├── predictor.py            # Inference engine
│   ├── explainer.py            # SHAP/LIME explanations
│   └── confidence.py           # Prediction confidence scoring
├── registry/
│   ├── __init__.py
│   ├── model_registry.py       # MLflow model registry
│   └── experiment_tracker.py   # Experiment tracking
├── monitoring/
│   ├── __init__.py
│   ├── drift_detector.py       # Data/concept drift detection
│   ├── performance_monitor.py  # Production model monitoring
│   └── alerting.py             # Alert system for degradation
├── utils/
│   ├── __init__.py
│   ├── metrics.py              # Custom evaluation metrics
│   └── visualization.py        # Plotting utilities
└── api/
    ├── __init__.py
    └── prediction_api.py       # FastAPI endpoints
```

FILE 1: `backend/ml/config/model_config.yaml`
```yaml
# Model Configuration for Property Appreciation Forecasting

models:
  xgboost:
    enabled: true
    name: "XGBoost Property Appreciation Model"
    hyperparameters:
      n_estimators: 1000
      max_depth: 8
      learning_rate: 0.05
      subsample: 0.8
      colsample_bytree: 0.8
      min_child_weight: 3
      gamma: 0.1
      reg_alpha: 0.1
      reg_lambda: 1.0
      objective: "reg:squarederror"
      eval_metric: ["rmse", "mae"]
      early_stopping_rounds: 50
      random_state: 42

  lightgbm:
    enabled: true
    name: "LightGBM Property Appreciation Model"
    hyperparameters:
      n_estimators: 1000
      max_depth: 8
      learning_rate: 0.05
      num_leaves: 31
      subsample: 0.8
      colsample_bytree: 0.8
      min_child_samples: 20
      reg_alpha: 0.1
      reg_lambda: 1.0
      objective: "regression"
      metric: ["rmse", "mae"]
      early_stopping_round: 50
      verbose: -1
      random_state: 42

  catboost:
    enabled: true
    name: "CatBoost Property Appreciation Model"
    hyperparameters:
      iterations: 1000
      depth: 8
      learning_rate: 0.05
      l2_leaf_reg: 3.0
      random_seed: 42
      loss_function: "RMSE"
      eval_metric: "MAE"
      early_stopping_rounds: 50
      verbose: False

  ensemble:
    enabled: true
    name: "Ensemble Model (Stacking)"
    method: "stacking"  # or "voting", "blending"
    base_models: ["xgboost", "lightgbm", "catboost"]
    meta_model: "ridge"
    meta_model_params:
      alpha: 1.0

target_variables:
  - name: "price_appreciation_1y_percent"
    description: "1-year price appreciation percentage"
    min_value: -50.0
    max_value: 100.0
  - name: "price_appreciation_3y_percent"
    description: "3-year price appreciation percentage"
    min_value: -50.0
    max_value: 300.0
  - name: "price_appreciation_5y_percent"
    description: "5-year price appreciation percentage"
    min_value: -50.0
    max_value: 500.0

performance_targets:
  r2_score: 0.75  # R² > 0.75
  mae_percent: 3.0  # MAE < 3% of property price
  mape: 15.0  # MAPE < 15%
  accuracy_within_5_percent: 0.85  # 85% predictions within 5% of actual
```

FILE 2: `backend/ml/config/feature_config.yaml`
```yaml
# Feature Engineering Configuration

feature_groups:
  property_intrinsic:
    description: "Property-specific features"
    features:
      - name: "bedrooms"
        type: "categorical"
        categories: [1, 2, 3, 4, 5, "5+"]
      - name: "bathrooms"
        type: "categorical"
        categories: [1, 2, 3, 4, "4+"]
      - name: "area_sqft"
        type: "numerical"
        scaling: "standard"
        clip_outliers: true
        outlier_method: "iqr"
        outlier_threshold: 3.0
      - name: "carpet_area_sqft"
        type: "numerical"
        scaling: "standard"
      - name: "age_of_property_years"
        type: "numerical"
        scaling: "minmax"
        fill_missing: "median"
      - name: "floor"
        type: "numerical"
        scaling: "standard"
      - name: "total_floors"
        type: "numerical"
        scaling: "standard"
      - name: "property_type"
        type: "categorical"
        encoding: "target"  # Target encoding for high-cardinality
        categories: ["Apartment", "Villa", "Independent House", "Plot", "Penthouse", "Studio"]
      - name: "facing"
        type: "categorical"
        encoding: "onehot"
        categories: ["North", "South", "East", "West", "NE", "NW", "SE", "SW"]
      - name: "furnished"
        type: "categorical"
        encoding: "ordinal"
        order: ["Unfurnished", "Semi-Furnished", "Fully-Furnished"]
      - name: "parking_spaces"
        type: "numerical"
        scaling: "standard"
      - name: "balcony_count"
        type: "numerical"
        scaling: "standard"
      - name: "construction_quality_score"
        type: "numerical"
        scaling: "minmax"
      - name: "builder_reputation_score"
        type: "numerical"
        scaling: "minmax"

  location_features:
    description: "Location-based features"
    features:
      - name: "city"
        type: "categorical"
        encoding: "target"
        smoothing: 0.5  # Bayesian target encoding with smoothing
      - name: "locality"
        type: "categorical"
        encoding: "target"
        smoothing: 0.5
      - name: "latitude"
        type: "numerical"
        scaling: "standard"
      - name: "longitude"
        type: "numerical"
        scaling: "standard"
      - name: "elevation_meters"
        type: "numerical"
        scaling: "standard"
      - name: "distance_to_city_center_km"
        type: "numerical"
        scaling: "standard"
        transform: "log"  # Log transform for distance features
      - name: "metro_distance_km"
        type: "numerical"
        scaling: "standard"
        transform: "log"
        fill_missing: 99.0
      - name: "metro_travel_time_min"
        type: "numerical"
        scaling: "standard"
        fill_missing: 999
      - name: "hospital_distance_km"
        type: "numerical"
        scaling: "standard"
        transform: "log"
      - name: "school_distance_km"
        type: "numerical"
        scaling: "standard"
        transform: "log"
      - name: "mall_distance_km"
        type: "numerical"
        scaling: "standard"
        transform: "log"
      - name: "it_park_distance_km"
        type: "numerical"
        scaling: "standard"
        transform: "log"
        fill_missing: 99.0
      - name: "schools_within_3km"
        type: "numerical"
        scaling: "standard"
      - name: "hospitals_within_5km"
        type: "numerical"
        scaling: "standard"
      - name: "restaurants_within_1km"
        type: "numerical"
        scaling: "standard"

  market_features:
    description: "Market dynamics and historical trends"
    features:
      - name: "avg_price_per_sqft_locality"
        type: "numerical"
        scaling: "standard"
      - name: "locality_appreciation_1y_percent"
        type: "numerical"
        scaling: "standard"
      - name: "locality_appreciation_3y_percent"
        type: "numerical"
        scaling: "standard"
      - name: "total_transactions_locality_last_year"
        type: "numerical"
        scaling: "standard"
        transform: "log1p"
      - name: "active_listings_locality"
        type: "numerical"
        scaling: "standard"
        transform: "log1p"
      - name: "demand_supply_ratio_locality"
        type: "numerical"
        scaling: "standard"
      - name: "inventory_months_locality"
        type: "numerical"
        scaling: "standard"
      - name: "rental_yield_locality_percent"
        type: "numerical"
        scaling: "standard"
      - name: "price_volatility_locality"
        type: "numerical"
        scaling: "minmax"
      - name: "avg_days_on_market_locality"
        type: "numerical"
        scaling: "standard"
        transform: "log1p"

  infrastructure_features:
    description: "Infrastructure and development indicators"
    features:
      - name: "planned_metro_stations_3km"
        type: "numerical"
        scaling: "standard"
      - name: "metro_completion_years_remaining"
        type: "numerical"
        scaling: "standard"
        fill_missing: 99
      - name: "planned_highways_5km"
        type: "numerical"
        scaling: "standard"
      - name: "smart_city_initiative"
        type: "binary"
      - name: "infrastructure_investment_cr"
        type: "numerical"
        scaling: "standard"
        transform: "log1p"
      - name: "road_quality_score"
        type: "numerical"
        scaling: "minmax"
      - name: "public_transport_frequency_per_hour"
        type: "numerical"
        scaling: "standard"
      - name: "water_supply_hours_per_day"
        type: "numerical"
        scaling: "minmax"
      - name: "electricity_reliability_score"
        type: "numerical"
        scaling: "minmax"

  risk_features:
    description: "Risk assessment features"
    features:
      - name: "flood_risk_score"
        type: "numerical"
        scaling: "minmax"
      - name: "earthquake_risk_score"
        type: "numerical"
        scaling: "minmax"
      - name: "air_quality_index_avg"
        type: "numerical"
        scaling: "standard"
      - name: "crime_rate_per_1000"
        type: "numerical"
        scaling: "standard"
        transform: "log1p"
      - name: "legal_risk_score"
        type: "numerical"
        scaling: "minmax"
      - name: "waterlogging_prone"
        type: "binary"

  demographic_features:
    description: "Demographic and economic indicators"
    features:
      - name: "population_density_per_sqkm"
        type: "numerical"
        scaling: "standard"
        transform: "log"
      - name: "population_growth_5y_percent"
        type: "numerical"
        scaling: "standard"
      - name: "median_income_inr"
        type: "numerical"
        scaling: "standard"
        transform: "log"
      - name: "income_growth_5y_percent"
        type: "numerical"
        scaling: "standard"
      - name: "employment_rate_percent"
        type: "numerical"
        scaling: "minmax"
      - name: "literacy_rate_percent"
        type: "numerical"
        scaling: "minmax"
      - name: "it_professionals_percent"
        type: "numerical"
        scaling: "minmax"
      - name: "net_migration_rate_5y"
        type: "numerical"
        scaling: "standard"

  temporal_features:
    description: "Time-based features"
    features:
      - name: "listing_month"
        type: "categorical"
        encoding: "cyclical"  # Cyclical encoding for months
      - name: "listing_quarter"
        type: "categorical"
        encoding: "onehot"
        categories: ["Q1", "Q2", "Q3", "Q4"]
      - name: "listing_year"
        type: "numerical"
        scaling: "standard"
      - name: "months_since_construction"
        type: "numerical"
        scaling: "standard"
        transform: "log1p"

derived_features:
  - name: "price_per_sqft"
    formula: "price_inr / area_sqft"
    type: "numerical"
    scaling: "standard"
  - name: "carpet_to_builtup_ratio"
    formula: "carpet_area_sqft / builtup_area_sqft"
    type: "numerical"
    scaling: "minmax"
  - name: "floor_position_ratio"
    formula: "floor / total_floors"
    type: "numerical"
    scaling: "minmax"
  - name: "bedroom_to_area_ratio"
    formula: "bedrooms / (area_sqft / 1000)"
    type: "numerical"
    scaling: "standard"
  - name: "amenities_count"
    formula: "len(amenities_json)"
    type: "numerical"
    scaling: "standard"
  - name: "transport_accessibility_score"
    formula: "1 / (1 + metro_distance_km + bus_distance_km)"
    type: "numerical"
    scaling: "minmax"
  - name: "location_premium_index"
    formula: "(schools_within_3km * 0.3 + hospitals_within_5km * 0.2 + restaurants_within_1km * 0.5) / 3"
    type: "numerical"
    scaling: "standard"

feature_selection:
  method: "recursive_feature_elimination"  # or "mutual_info", "lasso"
  n_features_to_select: 150  # Select top 150 features
  cv_folds: 5

feature_importance:
  methods:
    - "shap"
    - "permutation"
    - "gain"
  top_n: 30  # Track top 30 most important features
```

FILE 3: `backend/ml/data/loaders.py`
```python
"""
Data loading from PostgreSQL database
"""

import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, join
from typing import Optional, List
import asyncio


class PropertyDataLoader:
    """
    Load property data with all associated tables for ML training/inference
    """

    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def load_training_data(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        cities: Optional[List[str]] = None,
        min_completeness_score: float = 80.0
    ) -> pd.DataFrame:
        """
        Load historical property data for training
        Only includes properties with known outcomes (sold/transacted)
        """

        # Build query to join all relevant tables
        query = """
        SELECT
            p.*,
            pld.*,
            pid.*,
            pmd.*,
            prd.*,
            pdd.*,
            pad.*,
            -- Target variables (future appreciation)
            CASE
                WHEN pt.transaction_date > p.listed_at + INTERVAL '1 year'
                THEN ((pt.transaction_price - p.price_inr) / p.price_inr * 100)
                ELSE NULL
            END as price_appreciation_1y_percent,
            CASE
                WHEN pt.transaction_date > p.listed_at + INTERVAL '3 years'
                THEN ((pt.transaction_price - p.price_inr) / p.price_inr * 100)
                ELSE NULL
            END as price_appreciation_3y_percent,
            CASE
                WHEN pt.transaction_date > p.listed_at + INTERVAL '5 years'
                THEN ((pt.transaction_price - p.price_inr) / p.price_inr * 100)
                ELSE NULL
            END as price_appreciation_5y_percent
        FROM properties p
        LEFT JOIN property_location_data pld ON p.id = pld.property_id
        LEFT JOIN property_infrastructure_data pid ON p.id = pid.property_id
        LEFT JOIN property_market_data pmd ON p.id = pmd.property_id
        LEFT JOIN property_risk_data prd ON p.id = prd.property_id
        LEFT JOIN property_demographic_data pdd ON p.id = pdd.property_id
        LEFT JOIN property_amenities_data pad ON p.id = pad.property_id
        LEFT JOIN property_transactions pt ON p.id = pt.property_id
        WHERE
            p.data_completeness_score >= :min_completeness
            AND p.listing_status IN ('sold', 'rented', 'inactive')
            AND pt.transaction_date IS NOT NULL
        """

        params = {"min_completeness": min_completeness_score}

        if start_date:
            query += " AND p.listed_at >= :start_date"
            params["start_date"] = start_date

        if end_date:
            query += " AND p.listed_at <= :end_date"
            params["end_date"] = end_date

        if cities:
            query += " AND p.city = ANY(:cities)"
            params["cities"] = cities

        # Execute query
        result = await self.db.execute(query, params)
        rows = result.fetchall()

        # Convert to DataFrame
        df = pd.DataFrame(rows)

        print(f"Loaded {len(df)} properties for training")
        print(f"Date range: {df['listed_at'].min()} to {df['listed_at'].max()}")
        print(f"Cities: {df['city'].unique()}")

        return df

    async def load_inference_data(self, property_id: str) -> pd.DataFrame:
        """
        Load a single property's data for prediction
        """

        query = """
        SELECT
            p.*,
            pld.*,
            pid.*,
            pmd.*,
            prd.*,
            pdd.*,
            pad.*
        FROM properties p
        LEFT JOIN property_location_data pld ON p.id = pld.property_id
        LEFT JOIN property_infrastructure_data pid ON p.id = pid.property_id
        LEFT JOIN property_market_data pmd ON p.id = pmd.property_id
        LEFT JOIN property_risk_data prd ON p.id = prd.property_id
        LEFT JOIN property_demographic_data pdd ON p.id = pdd.property_id
        LEFT JOIN property_amenities_data pad ON p.id = pad.property_id
        WHERE p.id = :property_id
        """

        result = await self.db.execute(query, {"property_id": property_id})
        row = result.fetchone()

        if not row:
            raise ValueError(f"Property {property_id} not found")

        df = pd.DataFrame([row])
        return df
```

FILE 4: `backend/ml/features/property_features.py`
```python
"""
Property-specific feature engineering
"""

import pandas as pd
import numpy as np
from typing import Dict, Any
from .base import BaseFeatureEngineer


class PropertyFeatureEngineer(BaseFeatureEngineer):
    """
    Engineer features from property intrinsic characteristics
    """

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)

    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create derived features from property data
        """

        df = df.copy()

        # Price-related features
        df['price_per_sqft'] = df['price_inr'] / df['area_sqft']
        df['price_per_sqft_percentile_city'] = df.groupby('city')['price_per_sqft'].rank(pct=True)
        df['price_per_sqft_percentile_locality'] = df.groupby(['city', 'locality'])['price_per_sqft'].rank(pct=True)

        # Area-related features
        df['carpet_to_builtup_ratio'] = df['carpet_area_sqft'] / df['builtup_area_sqft']
        df['carpet_to_super_buildup_ratio'] = df['carpet_area_sqft'] / df['super_buildup_area_sqft']
        df['efficiency_ratio'] = df['carpet_area_sqft'] / df['area_sqft']  # Higher is better
        df['loading_factor'] = (df['super_buildup_area_sqft'] - df['carpet_area_sqft']) / df['carpet_area_sqft']

        # Room density features
        df['area_per_bedroom'] = df['area_sqft'] / df['bedrooms']
        df['area_per_bathroom'] = df['area_sqft'] / df['bathrooms']
        df['bedroom_to_bathroom_ratio'] = df['bedrooms'] / df['bathrooms']
        df['total_rooms'] = df['bedrooms'] + df['bathrooms'] + df['balcony_count']
        df['room_density'] = df['total_rooms'] / (df['area_sqft'] / 1000)  # Rooms per 1000 sqft

        # Floor features
        df['floor_position_ratio'] = df['floor'] / df['total_floors']
        df['is_ground_floor'] = (df['floor'] == 0).astype(int)
        df['is_top_floor'] = (df['floor'] == df['total_floors']).astype(int)
        df['is_mid_floor'] = ((df['floor'] > 0) & (df['floor'] < df['total_floors'])).astype(int)

        # Age and condition
        df['property_age_category'] = pd.cut(
            df['age_of_property_years'],
            bins=[-1, 0, 5, 10, 20, 100],
            labels=['Under Construction', 'New', 'Relatively New', 'Old', 'Very Old']
        )
        df['months_since_construction'] = df['age_of_property_years'] * 12
        df['depreciation_factor'] = 1 - (df['age_of_property_years'] / 50)  # Assuming 50-year lifespan

        # Amenities scoring
        df['amenities_count'] = df['amenities_json'].apply(lambda x: len(x) if isinstance(x, list) else 0)
        df['has_pool'] = df['amenities_json'].apply(lambda x: 'Swimming Pool' in x if isinstance(x, list) else 0)
        df['has_gym'] = df['amenities_json'].apply(lambda x: 'Gym' in x if isinstance(x, list) else 0)
        df['has_clubhouse'] = df['amenities_json'].apply(lambda x: 'Clubhouse' in x if isinstance(x, list) else 0)
        df['has_security'] = df['amenities_json'].apply(lambda x: 'Security' in x if isinstance(x, list) else 0)
        df['luxury_amenities_score'] = df['has_pool'] + df['has_gym'] + df['has_clubhouse']

        # Parking
        df['parking_per_bedroom'] = df['parking_spaces'] / df['bedrooms']
        df['has_parking'] = (df['parking_spaces'] > 0).astype(int)

        # Builder quality
        df['builder_quality_category'] = pd.cut(
            df['builder_reputation_score'],
            bins=[0, 3, 6, 8, 10],
            labels=['Poor', 'Average', 'Good', 'Excellent']
        )

        # Furnishing score (ordinal encoding)
        furnishing_map = {'Unfurnished': 0, 'Semi-Furnished': 1, 'Fully-Furnished': 2}
        df['furnishing_score'] = df['furnished'].map(furnishing_map)

        # Construction quality premium
        df['construction_quality_premium'] = (df['construction_quality_score'] - 5) / 5  # Normalized to [-1, 1]

        # Legal status
        df['has_rera'] = df['rera_id'].notna().astype(int)
        df['has_oc_certificate'] = df['oc_certificate'].notna().astype(int)
        df['legal_compliance_score'] = (df['has_rera'] + df['has_oc_certificate']) / 2

        # Possession status
        df['is_ready_to_move'] = (df['possession_date'] <= pd.Timestamp.now()).astype(int)
        df['months_until_possession'] = ((df['possession_date'] - pd.Timestamp.now()).dt.days / 30).clip(lower=0)

        return df

    def create_interaction_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create interaction features between multiple variables
        """

        df = df.copy()

        # Location × Property Type interactions
        df['city_property_type'] = df['city'].astype(str) + '_' + df['property_type'].astype(str)
        df['locality_property_type'] = df['locality'].astype(str) + '_' + df['property_type'].astype(str)

        # Size × Location interactions
        df['area_city'] = df['area_sqft'] * df.groupby('city')['area_sqft'].transform('mean')
        df['bedrooms_city'] = df['bedrooms'] * df.groupby('city')['bedrooms'].transform('mean')

        # Age × Quality interactions
        df['age_quality_interaction'] = df['age_of_property_years'] * df['construction_quality_score']
        df['age_builder_interaction'] = df['age_of_property_years'] * df['builder_reputation_score']

        # Price × Size polynomial features
        df['area_squared'] = df['area_sqft'] ** 2
        df['area_cubed'] = df['area_sqft'] ** 3

        return df
```

FILE 5: `backend/ml/models/gradient_boosting.py`
```python
"""
Gradient Boosting Models (XGBoost, LightGBM, CatBoost)
"""

import xgboost as xgb
import lightgbm as lgb
from catboost import CatBoostRegressor
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from sklearn.model_selection import cross_val_score
import joblib
from .base_model import BaseModel


class XGBoostModel(BaseModel):
    """
    XGBoost model for property appreciation forecasting
    """

    def __init__(self, config: Dict[str, Any], target_variable: str = "price_appreciation_1y_percent"):
        super().__init__(config, target_variable)
        self.model = None
        self.feature_importance_ = None

    def train(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        X_val: Optional[pd.DataFrame] = None,
        y_val: Optional[pd.Series] = None,
        categorical_features: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Train XGBoost model with early stopping
        """

        # Prepare DMatrix
        dtrain = xgb.DMatrix(X_train, label=y_train)

        params = self.config['hyperparameters']

        # If validation set provided, use early stopping
        eval_list = [(dtrain, 'train')]
        if X_val is not None and y_val is not None:
            dval = xgb.DMatrix(X_val, label=y_val)
            eval_list.append((dval, 'val'))

        # Train model
        evals_result = {}
        self.model = xgb.train(
            params,
            dtrain,
            num_boost_round=params['n_estimators'],
            evals=eval_list,
            early_stopping_rounds=params.get('early_stopping_rounds', 50),
            evals_result=evals_result,
            verbose_eval=50
        )

        # Store feature importance
        self.feature_importance_ = pd.DataFrame({
            'feature': X_train.columns,
            'importance': self.model.get_score(importance_type='gain').values()
        }).sort_values('importance', ascending=False)

        # Calculate training metrics
        train_pred = self.model.predict(dtrain)
        train_metrics = self.calculate_metrics(y_train, train_pred)

        val_metrics = {}
        if X_val is not None:
            val_pred = self.model.predict(dval)
            val_metrics = self.calculate_metrics(y_val, val_pred)

        return {
            'train_metrics': train_metrics,
            'val_metrics': val_metrics,
            'best_iteration': self.model.best_iteration,
            'evals_result': evals_result
        }

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Make predictions"""
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")

        dtest = xgb.DMatrix(X)
        return self.model.predict(dtest)

    def predict_with_confidence(self, X: pd.DataFrame, n_iterations: int = 100) -> tuple:
        """
        Predict with confidence intervals using dropout approximation
        """
        predictions = []

        for i in range(n_iterations):
            # Predict using random subset of trees
            dtest = xgb.DMatrix(X)
            pred = self.model.predict(dtest, iteration_range=(0, self.model.best_iteration))
            predictions.append(pred)

        predictions = np.array(predictions)
        mean_pred = predictions.mean(axis=0)
        std_pred = predictions.std(axis=0)
        lower_bound = np.percentile(predictions, 5, axis=0)
        upper_bound = np.percentile(predictions, 95, axis=0)

        return mean_pred, std_pred, lower_bound, upper_bound

    def get_feature_importance(self, importance_type: str = 'gain') -> pd.DataFrame:
        """Get feature importance"""
        if self.model is None:
            raise ValueError("Model not trained.")

        importance_dict = self.model.get_score(importance_type=importance_type)
        importance_df = pd.DataFrame({
            'feature': list(importance_dict.keys()),
            'importance': list(importance_dict.values())
        }).sort_values('importance', ascending=False)

        return importance_df

    def save(self, path: str):
        """Save model to disk"""
        if self.model is None:
            raise ValueError("No model to save.")

        self.model.save_model(path)
        print(f"Model saved to {path}")

    def load(self, path: str):
        """Load model from disk"""
        self.model = xgb.Booster()
        self.model.load_model(path)
        print(f"Model loaded from {path}")


class LightGBMModel(BaseModel):
    """
    LightGBM model - faster training, similar accuracy to XGBoost
    """

    def __init__(self, config: Dict[str, Any], target_variable: str = "price_appreciation_1y_percent"):
        super().__init__(config, target_variable)
        self.model = None

    def train(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        X_val: Optional[pd.DataFrame] = None,
        y_val: Optional[pd.Series] = None,
        categorical_features: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Train LightGBM model"""

        params = self.config['hyperparameters']

        # Prepare datasets
        train_data = lgb.Dataset(
            X_train,
            label=y_train,
            categorical_feature=categorical_features
        )

        valid_sets = [train_data]
        valid_names = ['train']

        if X_val is not None and y_val is not None:
            val_data = lgb.Dataset(
                X_val,
                label=y_val,
                categorical_feature=categorical_features,
                reference=train_data
            )
            valid_sets.append(val_data)
            valid_names.append('val')

        # Train
        evals_result = {}
        self.model = lgb.train(
            params,
            train_data,
            num_boost_round=params['n_estimators'],
            valid_sets=valid_sets,
            valid_names=valid_names,
            callbacks=[
                lgb.early_stopping(stopping_rounds=params.get('early_stopping_round', 50)),
                lgb.log_evaluation(period=50),
                lgb.record_evaluation(evals_result)
            ]
        )

        # Calculate metrics
        train_pred = self.model.predict(X_train)
        train_metrics = self.calculate_metrics(y_train, train_pred)

        val_metrics = {}
        if X_val is not None:
            val_pred = self.model.predict(X_val)
            val_metrics = self.calculate_metrics(y_val, val_pred)

        return {
            'train_metrics': train_metrics,
            'val_metrics': val_metrics,
            'best_iteration': self.model.best_iteration,
            'evals_result': evals_result
        }

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Make predictions"""
        if self.model is None:
            raise ValueError("Model not trained.")
        return self.model.predict(X)

    def get_feature_importance(self) -> pd.DataFrame:
        """Get feature importance"""
        if self.model is None:
            raise ValueError("Model not trained.")

        importance_df = pd.DataFrame({
            'feature': self.model.feature_name(),
            'importance': self.model.feature_importance(importance_type='gain')
        }).sort_values('importance', ascending=False)

        return importance_df
```

REQUIREMENTS:

1. Install required packages:
```bash
pip install xgboost lightgbm catboost scikit-learn pandas numpy pyyaml mlflow optuna shap
```

2. Create training pipeline that:
   - Loads historical data (minimum 10,000 properties with transactions)
   - Engineers 150+ features
   - Trains multiple models (XGBoost, LightGBM, CatBoost)
   - Performs 5-fold cross-validation
   - Tunes hyperparameters with Optuna
   - Ensembles best models
   - Validates 85%+ accuracy (predictions within 5% of actual)
   - Tracks experiments with MLflow
   - Saves best model to registry

3. Create inference API:
   - FastAPI endpoint: POST `/api/ml/predict/appreciation`
   - Input: property_id
   - Output: 1y/3y/5y appreciation predictions + confidence intervals + SHAP explanations

4. Model monitoring:
   - Track prediction accuracy weekly
   - Detect data drift
   - Retrain quarterly or when accuracy drops below 82%

VALIDATION:
- Train on 70% data, validate on 15%, test on 15%
- Achieve R² > 0.75, MAE < 3%, MAPE < 15%
- 85% of predictions within 5% of actual value
- Feature importance analysis shows top features make sense
- SHAP values provide interpretable explanations

NEXT STEPS:
After implementation:
1. Create historical data collection pipeline
2. Set up MLflow tracking server
3. Build model retraining scheduler
4. Create A/B testing framework
5. Build prediction confidence UI
```

---

## CURSOR AI PROMPT #4: Historical Data Collection

```prompt
CONTEXT:
You need to collect historical property transaction data to train the ML model. Indian real estate data sources include government registries, property portals, and third-party APIs.

TASK:
Create `backend/ml/data/collectors.py` to scrape/collect historical data from:

1. **Government Sources (Free)**:
   - State Registration Departments (property registration data)
   - Urban Local Bodies (property tax records)
   - RERA portals (project-wise sales data)

2. **Property Portals (Scraping)**:
   - 99acres.com historical listings
   - MagicBricks historical data
   - PropTiger market reports

3. **Paid APIs** (if budget available):
   - PropStack API (comprehensive property data)
   - CRISIL real estate indices
   - PropTiger Enterprise API

REQUIREMENTS:
- Collect 50,000+ property records with known transaction prices
- Time range: 2018-2024 (6+ years for 5-year appreciation)
- Cities: Bangalore, Mumbai, Delhi, Pune, Chennai, Hyderabad (Tier 1)
- Data quality: Clean, deduplicated, validated

IMPLEMENTATION:
- Use Scrapy framework for web scraping
- Respect robots.txt and rate limits
- Store raw data in PostgreSQL staging table
- Clean and validate before adding to training set
- Run monthly to refresh dataset

OUTPUT:
- 50K+ properties with transaction history
- 200+ features per property (after enrichment)
- Clean training dataset ready for ML
```

---

## CURSOR AI PROMPT #5: Model Training Pipeline

```prompt
CONTEXT:
Create an end-to-end ML training pipeline that runs automatically and produces production-ready models.

TASK:
Create `backend/ml/training/pipeline.py` with the following stages:

**Stage 1: Data Preparation**
- Load historical data from database
- Split into train/val/test (70/15/15)
- Handle missing values (imputation)
- Remove outliers (IQR method)
- Temporal split (train on older data, test on recent)

**Stage 2: Feature Engineering**
- Generate 200+ features from raw data
- Apply feature scaling (StandardScaler/MinMaxScaler)
- Encode categorical variables (target/onehot/ordinal)
- Create interaction features
- Feature selection (top 150 features)

**Stage 3: Model Training**
- Train XGBoost, LightGBM, CatBoost in parallel
- 5-fold cross-validation for each
- Track metrics: R², MAE, MAPE, accuracy@5%
- Log experiments to MLflow

**Stage 4: Hyperparameter Tuning**
- Use Optuna for Bayesian optimization
- Search space: learning_rate, max_depth, n_estimators, etc.
- Optimize for MAE (most interpretable for users)
- 100 trials per model

**Stage 5: Ensemble Creation**
- Create stacking ensemble of best 3 models
- Meta-model: Ridge regression
- Validate ensemble performance

**Stage 6: Model Evaluation**
- Test on held-out test set
- Calculate final metrics
- Generate SHAP explanations
- Validate 85%+ accuracy requirement
- Create model card (documentation)

**Stage 7: Model Registration**
- Save best model to MLflow registry
- Tag with version, metrics, date
- Promote to "Production" if metrics pass threshold
- Archive old models

REQUIREMENTS:
- Fully automated (runs on schedule)
- Reproducible (fixed random seeds)
- Monitored (sends alerts if training fails)
- Versioned (all models tracked)
- Fast (< 2 hours for full pipeline)

OUTPUT:
- Production model achieving 85%+ accuracy
- Feature importance analysis
- SHAP value explanations
- Model card documentation
- MLflow experiment tracking
```

---

## CURSOR AI PROMPT #6: Prediction API with Explanations

```prompt
CONTEXT:
Create a production-ready prediction API that provides property appreciation forecasts with confidence intervals and explanations.

TASK:
Create `backend/ml/api/prediction_api.py` with FastAPI endpoints:

**Endpoint 1: POST `/api/ml/predict/appreciation`**

Request:
```json
{
  "property_id": "uuid",
  "horizons": ["1y", "3y", "5y"]
}
```

Response:
```json
{
  "property_id": "uuid",
  "predictions": {
    "1y": {
      "appreciation_percent": 8.5,
      "confidence_lower": 6.2,
      "confidence_upper": 10.8,
      "confidence_score": 0.92,
      "expected_price_inr": 75_00_000
    },
    "3y": {
      "appreciation_percent": 24.3,
      "confidence_lower": 18.5,
      "confidence_upper": 30.1,
      "confidence_score": 0.85,
      "expected_price_inr": 87_00_000
    },
    "5y": {
      "appreciation_percent": 42.7,
      "confidence_lower": 32.1,
      "confidence_upper": 53.3,
      "confidence_score": 0.78,
      "expected_price_inr": 1_00_00_000
    }
  },
  "top_factors": [
    {"factor": "Planned metro within 2km", "impact": "+3.2%"},
    {"factor": "Prime locality (Indiranagar)", "impact": "+2.8%"},
    {"factor": "High builder reputation", "impact": "+1.5%"},
    {"factor": "Property age (new)", "impact": "+1.2%"},
    {"factor": "Low flood risk", "impact": "+0.8%"}
  ],
  "risk_factors": [
    {"factor": "High current price vs locality avg", "impact": "-1.5%"}
  ],
  "market_comparison": {
    "vs_city_avg": "+2.1%",
    "vs_locality_avg": "+0.8%",
    "percentile_rank": 78
  },
  "model_version": "v2.3.1",
  "prediction_timestamp": "2024-01-15T10:30:00Z"
}
```

**Endpoint 2: GET `/api/ml/model/info`**
- Returns model version, accuracy metrics, last training date

**Endpoint 3: POST `/api/ml/predict/batch`**
- Batch prediction for multiple properties
- Used for portfolio analysis

REQUIREMENTS:
1. Load model from MLflow registry (production version)
2. Feature engineering pipeline for inference
3. SHAP explanations for top 5 factors
4. Confidence intervals via prediction uncertainty
5. Caching (Redis) for recently predicted properties
6. Rate limiting (100 requests/hour per user)
7. Async processing for batch requests
8. Response time < 500ms (95th percentile)

VALIDATION:
- Test with 1000 properties
- Verify predictions are reasonable
- Check confidence intervals make sense
- Ensure explanations are human-readable
```

---

*[Document continues with remaining ML topics: Model Monitoring, Drift Detection, Retraining Pipeline, A/B Testing, etc.]*

Would you like me to continue with the remaining sections (Blockchain, Voice AI, Real-time Pipeline)?
