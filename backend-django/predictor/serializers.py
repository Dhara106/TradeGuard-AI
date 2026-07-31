"""
TradeGuard AI - Serializers
============================
Serializers convert complex data types (like Python objects, dicts) to/from JSON.
They also handle input validation - making sure the data sent by the frontend
is in the correct format before we process it.

Think of serializers as the "gatekeepers" between the frontend and our ML model:
1. ShipmentSerializer: Validates INCOMING data (what the frontend sends us)
2. PredictionSerializer: Formats OUTGOING data (what we send back to frontend)
"""

from rest_framework import serializers


class ShipmentSerializer(serializers.Serializer):
    """
    Validates incoming shipment data from the frontend.
    
    This serializer checks that all required fields are present and valid
    before we pass them to the ML model for prediction.
    
    Expected Input (JSON):
    {
        "origin": "Mumbai",
        "destination": "Delhi",
        "weight": 250.5,
        "distance": 1400,
        "weatherScore": 7,
        "trafficScore": 8,
        "carrier": "BlueDart",
        "season": "Monsoon"
    }
    """
    # ── Required Fields ──────────────────────────────────────
    # CharField: accepts text strings
    origin = serializers.CharField(
        max_length=100,
        help_text="Origin city (e.g., 'Mumbai', 'Delhi', 'Bangalore')"
    )
    destination = serializers.CharField(
        max_length=100,
        help_text="Destination city (e.g., 'Chennai', 'Kolkata', 'Hyderabad')"
    )

    # FloatField: accepts decimal numbers
    weight = serializers.FloatField(
        min_value=0.1,
        max_value=10000,
        help_text="Shipment weight in kilograms (0.1 - 10,000 kg)"
    )

    # IntegerField: accepts whole numbers
    distance = serializers.IntegerField(
        min_value=1,
        max_value=5000,
        help_text="Distance between origin and destination in kilometers"
    )

    # Weather and traffic scores (1-10 scale)
    weatherScore = serializers.IntegerField(
        min_value=1,
        max_value=10,
        help_text="Weather severity score (1=clear, 10=extreme weather)"
    )
    trafficScore = serializers.IntegerField(
        min_value=1,
        max_value=10,
        help_text="Traffic congestion score (1=empty roads, 10=gridlock)"
    )

    # Carrier and season
    carrier = serializers.CharField(
        max_length=50,
        help_text="Shipping carrier (e.g., 'BlueDart', 'FedEx', 'DHL')"
    )
    season = serializers.CharField(
        max_length=20,
        help_text="Current season (e.g., 'Summer', 'Monsoon', 'Winter', 'Autumn')"
    )

    def validate_origin(self, value):
        """Make sure origin city is a non-empty string."""
        if not value.strip():
            raise serializers.ValidationError("Origin city cannot be empty.")
        return value.strip().title()  # Capitalize first letter of each word

    def validate_destination(self, value):
        """Make sure destination city is a non-empty string."""
        if not value.strip():
            raise serializers.ValidationError("Destination city cannot be empty.")
        return value.strip().title()

    def validate_season(self, value):
        """Validate that season is one of the expected values."""
        valid_seasons = ['Summer', 'Monsoon', 'Winter', 'Autumn']
        # Convert to title case for comparison
        value = value.strip().title()
        if value not in valid_seasons:
            raise serializers.ValidationError(
                f"Invalid season '{value}'. Must be one of: {', '.join(valid_seasons)}"
            )
        return value

    def validate(self, data):
        """
        Cross-field validation: origin and destination must be different.
        This method runs AFTER individual field validations.
        """
        if data.get('origin') == data.get('destination'):
            raise serializers.ValidationError(
                "Origin and destination must be different cities."
            )
        return data


class PredictionSerializer(serializers.Serializer):
    """
    Formats the prediction output to send back to the frontend.
    
    Output Format (JSON):
    {
        "prediction": "Delayed",
        "confidence": 0.87,
        "riskScore": 74,
        "predictedDelay": 3,
        "reasons": ["High weather severity", "Monsoon season"],
        "shipmentDetails": { ... }
    }
    """
    prediction = serializers.CharField(
        help_text="Prediction result: 'Delayed' or 'On Time'"
    )
    confidence = serializers.FloatField(
        help_text="Model's confidence in the prediction (0.0 - 1.0)"
    )
    riskScore = serializers.IntegerField(
        help_text="Overall risk score (1-100, higher = more risky)"
    )
    predictedDelay = serializers.IntegerField(
        help_text="Estimated delay in days (0 if on time)"
    )
    reasons = serializers.ListField(
        child=serializers.CharField(),
        help_text="List of reasons contributing to the prediction"
    )
    shipmentDetails = serializers.DictField(
        help_text="Echo of the input shipment details"
    )
