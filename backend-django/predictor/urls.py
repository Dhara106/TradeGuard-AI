"""
TradeGuard AI - Predictor URL Configuration
=============================================
This file defines the URL patterns for the predictor app.
These URLs are included under the '/api/' prefix from the main urls.py.

Available Endpoints:
    POST /api/predict/      → Predict shipment delay risk
    GET  /api/health/       → Health check (is the service running?)
    GET  /api/model-info/   → Get ML model information and accuracy
"""

from django.urls import path
from . import views

# ──────────────────────────────────────────────────────────────
# URL PATTERNS
# Each path() maps a URL to a view class.
# .as_view() converts a class-based view into a callable view function.
# ──────────────────────────────────────────────────────────────
urlpatterns = [
    # POST /api/predict/ - Main prediction endpoint
    # Receives shipment features and returns delay prediction
    path('predict/', views.PredictView.as_view(), name='predict'),

    # GET /api/health/ - Health check endpoint
    # Used by monitoring systems to check if the service is running
    path('health/', views.HealthView.as_view(), name='health'),

    # GET /api/model-info/ - Model information endpoint
    # Returns details about the trained ML model (accuracy, features, etc.)
    path('model-info/', views.ModelInfoView.as_view(), name='model-info'),
]
