"""
TradeGuard AI - Predictor Models
=================================
This file is for Django database models.
Since our ML service doesn't need a database for predictions,
we keep this file minimal. The ML model files (.pkl) are stored on disk.

In a production system, you might add models here to:
- Log prediction history
- Store user feedback on predictions
- Cache frequently accessed predictions
"""

from django.db import models

# ──────────────────────────────────────────────────────────────
# NOTE: No database models are needed for the ML prediction service.
# The trained model is loaded from .pkl files on disk.
# If you want to log predictions, you could add a PredictionLog model:
#
# class PredictionLog(models.Model):
#     origin = models.CharField(max_length=100)
#     destination = models.CharField(max_length=100)
#     prediction = models.CharField(max_length=20)
#     confidence = models.FloatField()
#     risk_score = models.IntegerField()
#     created_at = models.DateTimeField(auto_now_add=True)
#
#     def __str__(self):
#         return f"{self.origin} → {self.destination}: {self.prediction}"
# ──────────────────────────────────────────────────────────────
