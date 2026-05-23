"""Custom exception classes"""


class TharagaBaseException(Exception):
    status_code = 500
    detail = "Internal server error"
    
    def __init__(self, detail: str = None, status_code: int = None):
        if detail:
            self.detail = detail
        if status_code:
            self.status_code = status_code
        super().__init__(self.detail)


class NotFoundError(TharagaBaseException):
    status_code = 404
    detail = "Resource not found"


class ValidationError(TharagaBaseException):
    status_code = 400
    detail = "Invalid input"


class UnauthorizedError(TharagaBaseException):
    status_code = 401
    detail = "Unauthorized"


class ForbiddenError(TharagaBaseException):
    status_code = 403
    detail = "Forbidden"


class RateLimitError(TharagaBaseException):
    status_code = 429
    detail = "Rate limit exceeded"


class IntegrationError(TharagaBaseException):
    status_code = 502
    detail = "External service error"


class DatabaseError(TharagaBaseException):
    status_code = 503
    detail = "Database error"
