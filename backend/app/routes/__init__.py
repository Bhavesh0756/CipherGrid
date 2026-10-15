"""Routes package for Industrial SecureSim."""
from .dashboard import dashboard_bp
from .devices import devices_bp
from .crypto import crypto_bp
from .logs import logs_bp
from .tls import tls_bp

__all__ = ["dashboard_bp", "devices_bp", "crypto_bp", "logs_bp", "tls_bp"]
