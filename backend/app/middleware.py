"""
Middleware for production-grade features
"""
import logging
import time
import uuid
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from .utils import rate_limiter
from .utils.exceptions import TharagaBaseException

logger = logging.getLogger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Add unique request ID to each request"""
    
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get('X-Request-ID', str(uuid.uuid4()))
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers['X-Request-ID'] = request_id
        return response


class LoggingMiddleware(BaseHTTPMiddleware):
    """Log all requests with timing"""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        request_id = getattr(request.state, 'request_id', 'unknown')
        
        logger.info(f"[{request_id}] {request.method} {request.url.path}")
        
        try:
            response = await call_next(request)
            duration_ms = (time.time() - start_time) * 1000
            logger.info(f"[{request_id}] {request.method} {request.url.path} - {response.status_code} ({duration_ms:.2f}ms)")
            response.headers['X-Response-Time-Ms'] = str(round(duration_ms, 2))
            return response
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            logger.error(f"[{request_id}] FAILED ({duration_ms:.2f}ms): {str(e)}", exc_info=True)
            raise


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware with path-specific limits"""
    
    PATH_LIMITS = {
        '/api/v1/leads': (10, 60),  # 10 leads per minute per IP
        '/api/v1/tools': (30, 60),  # 30 calculator calls per minute (shared)
        '/api/v1/integrations/whatsapp/send': (20, 60),
    }
    DEFAULT_LIMIT = (200, 60)
    EXCLUDED_PATHS = {'/health', '/', '/api/docs', '/api/redoc', '/api/openapi.json'}
    
    async def dispatch(self, request: Request, call_next):
        if request.url.path in self.EXCLUDED_PATHS:
            return await call_next(request)
        
        client_id = request.headers.get('X-Forwarded-For', request.client.host if request.client else 'unknown')
        client_id = client_id.split(',')[0].strip()
        
        # Determine rate limit & shared bucket prefix
        max_requests, window = self.DEFAULT_LIMIT
        bucket_prefix = request.url.path
        for path_prefix, limits in self.PATH_LIMITS.items():
            if request.url.path.startswith(path_prefix):
                max_requests, window = limits
                bucket_prefix = path_prefix  # Share bucket across sub-paths
                break
        
        # Use shared bucket key (so all /api/v1/tools/* share one bucket)
        rate_key = f"{client_id}:{bucket_prefix}"
        if not rate_limiter.is_allowed(rate_key, max_requests, window):
            reset_time = rate_limiter.get_reset_time(rate_key, window)
            retry_after = int(reset_time - time.time()) if reset_time else 60
            
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    'detail': 'Rate limit exceeded. Please try again later.',
                    'retry_after_seconds': retry_after
                },
                headers={'Retry-After': str(retry_after)}
            )
        
        return await call_next(request)


async def tharaga_exception_handler(request: Request, exc: TharagaBaseException):
    """Handle custom Tharaga exceptions"""
    request_id = getattr(request.state, 'request_id', 'unknown')
    logger.warning(f"[{request_id}] {exc.__class__.__name__}: {exc.detail}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            'detail': exc.detail,
            'error_type': exc.__class__.__name__,
            'request_id': request_id
        }
    )
