"""
Production utilities: caching, retry, circuit breaker
"""
import asyncio
import functools
import logging
import time
from typing import Any, Callable, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


# ============================================
# IN-MEMORY TTL CACHE
# ============================================
class TTLCache:
    """Simple TTL-based cache for hot data"""
    
    def __init__(self, default_ttl: int = 300):
        self._cache = {}
        self._default_ttl = default_ttl
    
    def get(self, key: str) -> Optional[Any]:
        if key not in self._cache:
            return None
        value, expiry = self._cache[key]
        if datetime.utcnow() > expiry:
            del self._cache[key]
            return None
        return value
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        ttl = ttl or self._default_ttl
        expiry = datetime.utcnow() + timedelta(seconds=ttl)
        self._cache[key] = (value, expiry)
    
    def delete(self, key: str):
        self._cache.pop(key, None)
    
    def clear(self):
        self._cache.clear()


cache = TTLCache(default_ttl=300)
long_cache = TTLCache(default_ttl=3600)


# ============================================
# RETRY DECORATOR WITH EXPONENTIAL BACKOFF
# ============================================
def async_retry(max_attempts: int = 3, base_delay: float = 1.0, max_delay: float = 30.0, exceptions: tuple = (Exception,)):
    """Retry async function with exponential backoff"""
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt == max_attempts - 1:
                        logger.error(f"{func.__name__} failed after {max_attempts} attempts: {str(e)}")
                        raise
                    delay = min(base_delay * (2 ** attempt), max_delay)
                    logger.warning(f"{func.__name__} attempt {attempt + 1} failed: {str(e)}. Retrying in {delay}s")
                    await asyncio.sleep(delay)
            raise last_exception
        return wrapper
    return decorator


# ============================================
# CIRCUIT BREAKER PATTERN
# ============================================
class CircuitBreaker:
    """Circuit breaker for external service calls"""
    CLOSED = 'closed'
    OPEN = 'open'
    HALF_OPEN = 'half_open'
    
    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = self.CLOSED
    
    async def call(self, func: Callable, *args, **kwargs):
        if self.state == self.OPEN:
            if self._should_attempt_reset():
                self.state = self.HALF_OPEN
            else:
                raise Exception(f"Circuit breaker OPEN for {func.__name__}")
        
        try:
            result = await func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise
    
    def _should_attempt_reset(self) -> bool:
        if self.last_failure_time is None:
            return True
        return (datetime.utcnow() - self.last_failure_time).seconds >= self.recovery_timeout
    
    def _on_success(self):
        self.failure_count = 0
        self.state = self.CLOSED
    
    def _on_failure(self):
        self.failure_count += 1
        self.last_failure_time = datetime.utcnow()
        if self.failure_count >= self.failure_threshold:
            self.state = self.OPEN
            logger.warning(f"Circuit breaker OPENED after {self.failure_count} failures")


meta_circuit_breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=60)
whatsapp_circuit_breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=60)
zoho_circuit_breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=120)


# ============================================
# RATE LIMITING
# ============================================
class RateLimiter:
    """Simple in-memory rate limiter"""
    
    def __init__(self):
        self._requests = {}
    
    def is_allowed(self, key: str, max_requests: int = 60, window_seconds: int = 60) -> bool:
        now = time.time()
        cutoff = now - window_seconds
        
        if key in self._requests:
            self._requests[key] = [ts for ts in self._requests[key] if ts > cutoff]
        else:
            self._requests[key] = []
        
        if len(self._requests[key]) >= max_requests:
            return False
        
        self._requests[key].append(now)
        return True
    
    def get_reset_time(self, key: str, window_seconds: int = 60) -> Optional[float]:
        if key not in self._requests or not self._requests[key]:
            return None
        return self._requests[key][0] + window_seconds


rate_limiter = RateLimiter()


# ============================================
# INPUT SANITIZATION
# ============================================
def sanitize_string(value: str, max_length: int = 500) -> str:
    if not value:
        return ''
    sanitized = ''.join(char for char in value if ord(char) >= 32 or char in '\n\t')
    return sanitized[:max_length].strip()


def sanitize_phone(phone: str) -> str:
    if not phone:
        return ''
    cleaned = ''.join(c for c in phone if c.isdigit() or c == '+')
    if cleaned.startswith('+'):
        cleaned = cleaned[1:]
    if len(cleaned) == 10:
        cleaned = '91' + cleaned
    return cleaned
