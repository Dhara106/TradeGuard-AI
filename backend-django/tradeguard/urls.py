"""
TradeGuard AI - Main URL Configuration
========================================
This file maps URL paths to the appropriate views.
All API endpoints are routed under the 'api/' prefix.

URL Structure:
    /api/predict/     → POST  - Predict shipment delay risk
    /api/health/      → GET   - Health check endpoint
    /api/model-info/  → GET   - Get model information and accuracy
    /admin/           → Admin panel (Django built-in)
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Django admin panel (built-in)
    path('admin/', admin.site.urls),

    # All API endpoints are under /api/ prefix
    # This includes predict, health, and model-info from the predictor app
    path('api/', include('predictor.urls')),
]
