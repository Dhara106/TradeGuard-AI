"""
TradeGuard AI - Predictor App Configuration
=============================================
This file tells Django about the predictor app.
"""

from django.apps import AppConfig


class PredictorConfig(AppConfig):
    """
    Configuration class for the 'predictor' Django app.
    This app handles all ML prediction logic for shipment delay risk.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'predictor'
    verbose_name = 'TradeGuard AI Shipment Predictor'
