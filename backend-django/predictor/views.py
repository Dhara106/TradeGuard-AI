"""
TradeGuard AI - API Views
==========================
Views are the "controllers" in Django - they handle incoming HTTP requests,
process them, and return HTTP responses.

This file contains three API views:
1. PredictView  (POST /api/predict/)     - Predict shipment delay risk
2. HealthView   (GET  /api/health/)      - Health check endpoint
3. ModelInfoView (GET /api/model-info/)   - Get model information

Each view is a class-based view (CBV) that extends DRF's APIView.
CBVs organize request handling by HTTP method (get, post, put, delete).

Author: TradeGuard AI Team
"""

from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import ShipmentSerializer, PredictionSerializer
from .ml_model import predict, get_model_info
from .data_structures import PriorityQueue, HashMap, merge_sort, binary_search


# ──────────────────────────────────────────────────────────────
# PREDICTION CACHE
# We use our custom HashMap to cache predictions for identical inputs.
# This avoids running the ML model again for the same shipment data.
# ──────────────────────────────────────────────────────────────
prediction_cache = HashMap(capacity=64)

# ──────────────────────────────────────────────────────────────
# PREDICTION HISTORY
# Stores recent predictions for sorting/searching demonstrations.
# In production, this would be stored in a database.
# ──────────────────────────────────────────────────────────────
prediction_history = []


class PredictView(APIView):
    """
    POST /api/predict/
    
    Main prediction endpoint. Receives shipment details and returns
    a delay prediction with confidence score, risk assessment, and reasons.
    
    Request Body (JSON):
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
    
    Response (JSON):
    {
        "prediction": "Delayed",
        "confidence": 0.87,
        "riskScore": 74,
        "predictedDelay": 3,
        "reasons": ["High weather severity", "Monsoon season"],
        "shipmentDetails": { ... },
        "topRiskyFromHistory": [ ... ],
        "cached": false
    }
    """

    def post(self, request):
        """
        Handle POST requests for shipment delay prediction.
        
        Steps:
        1. Validate input using ShipmentSerializer
        2. Check cache (HashMap) for existing prediction
        3. Run ML model prediction if not cached
        4. Store result in cache and history
        5. Use PriorityQueue + merge_sort for risk ranking
        6. Return formatted response
        """
        # ── Step 1: Validate Input ────────────────────────────
        # The serializer checks that all required fields are present and valid
        serializer = ShipmentSerializer(data=request.data)

        if not serializer.is_valid():
            # Return validation errors with 400 Bad Request status
            return Response(
                {
                    'error': 'Invalid input data',
                    'details': serializer.errors,
                    'message': 'Please check your input and try again.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get the validated (clean) data
        validated_data = serializer.validated_data

        # ── Step 2: Check Cache (Using our custom HashMap) ────
        # Create a unique cache key from the input data
        cache_key = _create_cache_key(validated_data)
        cached_result = prediction_cache.get(cache_key)

        if cached_result is not None:
            # Cache HIT! Return the cached prediction without running the model
            cached_result['cached'] = True
            return Response(cached_result, status=status.HTTP_200_OK)

        # ── Step 3: Run ML Model Prediction ───────────────────
        try:
            prediction_result = predict(validated_data)
        except Exception as e:
            return Response(
                {
                    'error': 'Prediction failed',
                    'message': str(e),
                    'hint': 'Make sure the model is trained. Run: python ml/train_model.py'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # ── Step 4: Build Response ────────────────────────────
        response_data = {
            'prediction': prediction_result['prediction'],
            'confidence': prediction_result['confidence'],
            'riskScore': prediction_result['riskScore'],
            'predictedDelay': prediction_result['predictedDelay'],
            'reasons': prediction_result['reasons'],
            'shipmentDetails': {
                'origin': validated_data['origin'],
                'destination': validated_data['destination'],
                'weight': validated_data['weight'],
                'distance': validated_data['distance'],
                'weatherScore': validated_data['weatherScore'],
                'trafficScore': validated_data['trafficScore'],
                'carrier': validated_data['carrier'],
                'season': validated_data['season'],
            },
            'cached': False,
            'timestamp': datetime.now().isoformat(),
        }

        # ── Step 5: Store in Cache (HashMap) ──────────────────
        prediction_cache.put(cache_key, response_data)

        # ── Step 6: Add to History & Use Data Structures ──────
        # Store in prediction history for ranking demonstrations
        history_entry = {
            'route': f"{validated_data['origin']} → {validated_data['destination']}",
            'riskScore': prediction_result['riskScore'],
            'prediction': prediction_result['prediction'],
            'timestamp': datetime.now().isoformat(),
        }
        prediction_history.append(history_entry)

        # ── Use PriorityQueue to find top risky shipments ─────
        # Add all history items to a priority queue ranked by risk
        pq = PriorityQueue()
        for entry in prediction_history:
            pq.push(priority=entry['riskScore'], item=entry)

        # Get top 5 riskiest shipments from history
        top_risky = pq.get_top_n(5)

        # ── Use merge_sort to sort history by risk score ──────
        # Sort all predictions by risk score (descending = highest first)
        sorted_history = merge_sort(
            prediction_history,
            key=lambda x: x['riskScore'],
            reverse=True
        )

        # Add the top risky shipments to the response
        response_data['topRiskyFromHistory'] = top_risky[:5]
        response_data['totalPredictionsMade'] = len(prediction_history)

        return Response(response_data, status=status.HTTP_200_OK)


class HealthView(APIView):
    """
    GET /api/health/
    
    Health check endpoint used by monitoring systems (like Docker health checks,
    load balancers, or Kubernetes probes) to verify the service is running.
    
    Response (JSON):
    {
        "status": "healthy",
        "service": "TradeGuard AI ML Service",
        "timestamp": "2024-01-15T10:30:00",
        "version": "1.0.0"
    }
    """

    def get(self, request):
        """Return service health status."""
        return Response(
            {
                'status': 'healthy',
                'service': 'TradeGuard AI ML Service',
                'timestamp': datetime.now().isoformat(),
                'version': '1.0.0',
                'description': 'Shipment delay prediction and logistics risk assessment',
                'endpoints': {
                    'predict': 'POST /api/predict/',
                    'health': 'GET /api/health/',
                    'model_info': 'GET /api/model-info/',
                },
                'cacheSize': len(prediction_cache),
                'totalPredictions': len(prediction_history),
            },
            status=status.HTTP_200_OK
        )


class ModelInfoView(APIView):
    """
    GET /api/model-info/
    
    Returns detailed information about the trained ML model, including:
    - Model accuracy
    - Algorithm name
    - List of features used
    - Training date
    - Number of predictions made
    
    Response (JSON):
    {
        "accuracy": 0.89,
        "algorithm": "Random Forest Classifier",
        "features": ["origin", "destination", ...],
        "trainingDate": "2024-01-15",
        "totalPredictions": 42
    }
    """

    def get(self, request):
        """Return model information and statistics."""
        # Get model info (accuracy, features, etc.)
        model_info = get_model_info()

        # ── Use binary_search demo ────────────────────────────
        # Sort history by risk score for binary search demonstration
        sorted_history = merge_sort(
            prediction_history,
            key=lambda x: x['riskScore']
        )

        # Try to find a prediction with risk score 50 (demo of binary_search)
        search_result_index = binary_search(
            sorted_history, 50, key=lambda x: x['riskScore']
        )

        return Response(
            {
                'model': {
                    'accuracy': model_info.get('accuracy', 0),
                    'algorithm': model_info.get('algorithm', 'Random Forest Classifier'),
                    'features': model_info.get('features', []),
                    'trainingDate': model_info.get('training_date', 'Not trained'),
                    'totalTrainingSamples': model_info.get('total_samples', 0),
                    'testAccuracy': model_info.get('test_accuracy', 0),
                },
                'service': {
                    'totalPredictions': len(prediction_history),
                    'cacheSize': len(prediction_cache),
                    'cacheKeys': prediction_cache.keys()[:10],  # Show first 10 cache keys
                },
                'dataStructures': {
                    'description': 'This service uses custom data structures for educational purposes',
                    'priorityQueue': 'Used to rank shipments by risk score (max-heap)',
                    'hashMap': 'Used to cache predictions for identical inputs',
                    'mergeSort': 'Used to sort predictions by risk score',
                    'binarySearch': f'Demo: searching for risk score 50 → index: {search_result_index}',
                },
                'timestamp': datetime.now().isoformat(),
            },
            status=status.HTTP_200_OK
        )


# ══════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ══════════════════════════════════════════════════════════════

def _create_cache_key(data: dict) -> str:
    """
    Create a unique cache key from shipment input data.
    
    This combines all input fields into a single string that uniquely
    identifies this exact combination of inputs.
    
    Example: "Mumbai-Delhi-250.5-1400-7-8-BlueDart-Monsoon"
    """
    return (
        f"{data['origin']}-{data['destination']}-"
        f"{data['weight']}-{data['distance']}-"
        f"{data['weatherScore']}-{data['trafficScore']}-"
        f"{data['carrier']}-{data['season']}"
    )
