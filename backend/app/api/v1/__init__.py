from fastapi import APIRouter
from .leads import router as leads_router
from .properties import router as properties_router
from .builders import router as builders_router
from .analytics import router as analytics_router
from .tools import router as tools_router
from .integrations import router as integrations_router

api_router = APIRouter()

api_router.include_router(leads_router, prefix="/leads", tags=["leads"])
api_router.include_router(properties_router, prefix="/properties", tags=["properties"])
api_router.include_router(builders_router, prefix="/builders", tags=["builders"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
api_router.include_router(tools_router, prefix="/tools", tags=["tools"])
api_router.include_router(integrations_router, prefix="/integrations", tags=["integrations"])