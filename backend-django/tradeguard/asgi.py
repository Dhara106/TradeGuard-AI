"""
TradeGuard AI - ASGI Configuration
====================================
ASGI config for tradeguard project (for async support).
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tradeguard.settings')
application = get_asgi_application()
