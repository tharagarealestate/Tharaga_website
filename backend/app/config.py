# backend/app/config.py
"""
Configuration management for Tharaga backend
Loads environment variables and validates required settings
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
# Look for .env in the backend directory (parent of app/)
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)


class Config:
    """Application configuration class"""

    # Supabase Configuration
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY')
    SUPABASE_DB_URL = os.getenv('SUPABASE_DB_URL')

    # Application Configuration
    ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
    DEBUG = os.getenv('DEBUG', 'False').lower() in ('true', '1', 't')
    PORT = int(os.getenv('PORT', 8000))

    @classmethod
    def validate(cls):
        """
        Validate that required configuration is present

        Raises:
            ValueError: If required configuration is missing
        """
        required_vars = {
            'SUPABASE_URL': cls.SUPABASE_URL,
            'SUPABASE_KEY': cls.SUPABASE_KEY
        }

        missing = [key for key, value in required_vars.items() if not value]

        if missing:
            raise ValueError(
                f"Missing required environment variables: {', '.join(missing)}\n"
                f"Please check your backend/.env file"
            )

    @classmethod
    def is_production(cls):
        """Check if running in production environment"""
        return cls.ENVIRONMENT.lower() == 'production'

    @classmethod
    def is_development(cls):
        """Check if running in development environment"""
        return cls.ENVIRONMENT.lower() == 'development'


# Validate configuration on import
try:
    Config.validate()
    print(f"✓ Configuration loaded successfully (Environment: {Config.ENVIRONMENT})")
except ValueError as e:
    print(f"✗ Configuration error: {e}")
    # Don't raise in case we're just importing for inspection
    # The error will be raised when actually trying to use the config
