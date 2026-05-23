"""
Server entry point for Tharaga Backend API
Bridges supervisor's server:app expectation with our app.main:app
"""
from app.main import app

# Re-export the FastAPI app for uvicorn
__all__ = ['app']
