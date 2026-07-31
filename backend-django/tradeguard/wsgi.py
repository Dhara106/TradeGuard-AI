"""
TradeGuard AI - WSGI Configuration
====================================
WSGI (Web Server Gateway Interface) config for the tradeguard project.
This is used by web servers like Gunicorn to serve the Django application.
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tradeguard.settings')
application = get_wsgi_application()
