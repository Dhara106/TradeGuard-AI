"""
TradeGuard AI - ML Model Module
=================================
This module handles loading and using the trained Machine Learning model.

It provides:
1. load_model()  - Loads the trained Random Forest model from disk (.pkl files)
2. predict()     - Takes shipment features and returns delay prediction
3. Feature engineering functions - Convert raw input into model-ready format

The model predicts whether a shipment will be DELAYED or ON TIME based on:
- Origin and destination cities
- Package weight and shipping distance
- Weather conditions and traffic congestion
- Shipping carrier and season

Author: TradeGuard AI Team
"""

import os
import joblib
import numpy as np
from pathlib import Path

# ──────────────────────────────────────────────────────────────
# PATH CONFIGURATION
# The trained model files (.pkl) are stored in the 'ml/' directory
# ──────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent  # Points to backend-django/
ML_DIR = BASE_DIR / 'ml'                           # Points to backend-django/ml/

# File paths for saved model artifacts
MODEL_PATH = ML_DIR / 'fraud_model.pkl'    # Trained Random Forest model
SCALER_PATH = ML_DIR / 'scaler.pkl'        # StandardScaler for feature normalization
ENCODERS_PATH = ML_DIR / 'encoders.pkl'    # Label encoders for categorical variables
MODEL_INFO_PATH = ML_DIR / 'model_info.pkl'  # Model metadata (accuracy, training date)

# ──────────────────────────────────────────────────────────────
# CITY ENCODING MAP
# Maps city names to numerical values for the ML model.
# The model can't understand text, so we convert cities to numbers.
# These MUST match the encodings used during training.
# ──────────────────────────────────────────────────────────────
CITY_ENCODING = {
    'Ahmedabad': 0, 'Bangalore': 1, 'Chennai': 2, 'Delhi': 3,
    'Hyderabad': 4, 'Jaipur': 5, 'Kolkata': 6, 'Lucknow': 7,
    'Mumbai': 8, 'Pune': 9
}

CARRIER_ENCODING = {
    'BlueDart': 0, 'DTDC': 1, 'DHL': 2, 'Delhivery': 3, 'FedEx': 4
}

SEASON_ENCODING = {
    'Autumn': 0, 'Monsoon': 1, 'Summer': 2, 'Winter': 3
}

# ──────────────────────────────────────────────────────────────
# DISTANCE LOOKUP TABLE
# Approximate distances (in km) between major Indian cities.
# Used when the frontend doesn't provide distance.
# ──────────────────────────────────────────────────────────────
DISTANCE_LOOKUP = {
    ('Mumbai', 'Delhi'): 1400, ('Mumbai', 'Bangalore'): 980,
    ('Mumbai', 'Chennai'): 1330, ('Mumbai', 'Kolkata'): 2050,
    ('Mumbai', 'Hyderabad'): 710, ('Mumbai', 'Ahmedabad'): 530,
    ('Mumbai', 'Pune'): 150, ('Mumbai', 'Jaipur'): 1150,
    ('Mumbai', 'Lucknow'): 1350,
    ('Delhi', 'Bangalore'): 2150, ('Delhi', 'Chennai'): 2180,
    ('Delhi', 'Kolkata'): 1530, ('Delhi', 'Hyderabad'): 1560,
    ('Delhi', 'Ahmedabad'): 940, ('Delhi', 'Pune'): 1420,
    ('Delhi', 'Jaipur'): 280, ('Delhi', 'Lucknow'): 550,
    ('Bangalore', 'Chennai'): 350, ('Bangalore', 'Kolkata'): 1870,
    ('Bangalore', 'Hyderabad'): 570, ('Bangalore', 'Ahmedabad'): 1500,
    ('Bangalore', 'Pune'): 840, ('Bangalore', 'Jaipur'): 1850,
    ('Bangalore', 'Lucknow'): 1950,
    ('Chennai', 'Kolkata'): 1670, ('Chennai', 'Hyderabad'): 630,
    ('Chennai', 'Ahmedabad'): 1850, ('Chennai', 'Pune'): 1170,
    ('Chennai', 'Jaipur'): 1900, ('Chennai', 'Lucknow'): 1750,
    ('Kolkata', 'Hyderabad'): 1490, ('Kolkata', 'Ahmedabad'): 1930,
    ('Kolkata', 'Pune'): 1870, ('Kolkata', 'Jaipur'): 1500,
    ('Kolkata', 'Lucknow'): 980,
    ('Hyderabad', 'Ahmedabad'): 1220, ('Hyderabad', 'Pune'): 560,
    ('Hyderabad', 'Jaipur'): 1420, ('Hyderabad', 'Lucknow'): 1350,
    ('Ahmedabad', 'Pune'): 660, ('Ahmedabad', 'Jaipur'): 670,
    ('Ahmedabad', 'Lucknow'): 1100,
    ('Pune', 'Jaipur'): 1260, ('Pune', 'Lucknow'): 1320,
    ('Jaipur', 'Lucknow'): 580,
}


def get_distance(origin: str, destination: str) -> int:
    """
    Look up the distance between two cities.
    Checks both (A, B) and (B, A) since distance is the same both ways.
    
    Args:
        origin: Origin city name
        destination: Destination city name
        
    Returns:
        Distance in kilometers
    """
    # Try both orderings since the lookup might have (A,B) but not (B,A)
    pair = (origin, destination)
    reverse_pair = (destination, origin)

    if pair in DISTANCE_LOOKUP:
        return DISTANCE_LOOKUP[pair]
    elif reverse_pair in DISTANCE_LOOKUP:
        return DISTANCE_LOOKUP[reverse_pair]
    else:
        # Default distance if pair not found
        return 1000


# ──────────────────────────────────────────────────────────────
# GLOBAL MODEL CACHE
# We load the model ONCE and keep it in memory for fast predictions.
# This avoids reading from disk on every API request.
# ──────────────────────────────────────────────────────────────
_cached_model = None
_cached_scaler = None
_cached_encoders = None
_cached_model_info = None


def load_model():
    """
    Load the trained ML model and associated artifacts from disk.
    
    This function loads:
    1. The Random Forest Classifier model (fraud_model.pkl)
    2. The StandardScaler for feature normalization (scaler.pkl)
    3. The label encoders for categorical variables (encoders.pkl)
    4. Model metadata like accuracy and training date (model_info.pkl)
    
    The model is cached in global variables so it's only loaded ONCE
    from disk, making subsequent predictions much faster.
    
    Returns:
        tuple: (model, scaler, encoders, model_info)
        
    Raises:
        FileNotFoundError: If model files haven't been trained yet
    """
    global _cached_model, _cached_scaler, _cached_encoders, _cached_model_info

    # Only load from disk if not already cached in memory
    if _cached_model is None:
        # Check if model files exist
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model file not found at {MODEL_PATH}. "
                "Please run 'python ml/train_model.py' first to train the model."
            )

        print(f"[ML] Loading model from {MODEL_PATH}...")

        # joblib.load() reads the serialized (pickled) Python objects from disk
        _cached_model = joblib.load(MODEL_PATH)
        _cached_scaler = joblib.load(SCALER_PATH)
        _cached_encoders = joblib.load(ENCODERS_PATH)

        # Load model info (accuracy, features, training date)
        if MODEL_INFO_PATH.exists():
            _cached_model_info = joblib.load(MODEL_INFO_PATH)
        else:
            _cached_model_info = {
                'accuracy': 0.0,
                'algorithm': 'Random Forest Classifier',
                'features': [],
                'training_date': 'Unknown'
            }

        print("[ML] Model loaded successfully!")

    return _cached_model, _cached_scaler, _cached_encoders, _cached_model_info


def get_model_info() -> dict:
    """
    Get information about the trained model.
    
    Returns:
        dict with keys: accuracy, algorithm, features, training_date
    """
    try:
        _, _, _, model_info = load_model()
        return model_info
    except FileNotFoundError:
        return {
            'accuracy': 0.0,
            'algorithm': 'Random Forest Classifier',
            'features': ['origin', 'destination', 'weight', 'distance',
                         'weather_score', 'traffic_score', 'carrier', 'season'],
            'training_date': 'Model not trained yet',
            'status': 'not_trained'
        }


def preprocess_input(data: dict) -> np.ndarray:
    """
    Convert raw input data from the API into the format expected by the ML model.
    
    The ML model expects a NumPy array of numbers, but the API receives
    a JSON object with city names, carrier names, etc. This function:
    
    1. Encodes categorical variables (city names → numbers)
    2. Extracts numerical features
    3. Creates engineered features (composite risk score)
    4. Scales the features using the trained StandardScaler
    
    Args:
        data: Dictionary with keys: origin, destination, weight, distance,
              weatherScore, trafficScore, carrier, season
              
    Returns:
        NumPy array of shape (1, n_features) ready for model.predict()
    """
    # ── Step 1: Encode categorical variables ──────────────────
    # Convert city names to numbers using our encoding maps
    origin_encoded = CITY_ENCODING.get(data['origin'], 5)        # Default to 5 if unknown city
    destination_encoded = CITY_ENCODING.get(data['destination'], 5)
    carrier_encoded = CARRIER_ENCODING.get(data['carrier'], 0)
    season_encoded = SEASON_ENCODING.get(data['season'], 2)

    # ── Step 2: Extract numerical features ────────────────────
    weight = float(data['weight'])
    distance = float(data['distance'])
    weather_score = float(data['weatherScore'])
    traffic_score = float(data['trafficScore'])

    # ── Step 3: Create engineered features ────────────────────
    # Composite risk score: combines weather and traffic into one metric
    # Higher values indicate more risk of delay
    risk_composite = (weather_score * 0.6 + traffic_score * 0.4)

    # Weight-distance interaction: heavier packages over longer distances = more risk
    weight_distance_ratio = weight / max(distance, 1)  # Avoid division by zero

    # ── Step 4: Build the feature array ───────────────────────
    # The order MUST match the order used during model training
    features = np.array([[
        origin_encoded,         # 0: Origin city (encoded)
        destination_encoded,    # 1: Destination city (encoded)
        weight,                 # 2: Package weight (kg)
        distance,               # 3: Shipping distance (km)
        weather_score,          # 4: Weather severity (1-10)
        traffic_score,          # 5: Traffic congestion (1-10)
        carrier_encoded,        # 6: Carrier company (encoded)
        season_encoded,         # 7: Season (encoded)
        risk_composite,         # 8: Engineered: composite risk score
        weight_distance_ratio   # 9: Engineered: weight-to-distance ratio
    ]])

    # ── Step 5: Scale features ────────────────────────────────
    # StandardScaler normalizes features to have mean=0, std=1
    # This is important because features have very different scales
    # (weight: 1-5000, weather_score: 1-10, distance: 1-5000)
    try:
        _, scaler, _, _ = load_model()
        # Scale only the numerical columns (indices 2, 3, 4, 5, 8, 9)
        scale_indices = [2, 3, 4, 5, 8, 9]
        features_scaled = features.copy().astype(float)
        features_scaled[:, scale_indices] = scaler.transform(features_scaled[:, scale_indices])
    except Exception as e:
        print(f"[ML Warning] Scaling failed: {str(e)}. Falling back to raw features.")
        features_scaled = features

    return features_scaled


def predict(data: dict) -> dict:
    """
    Main prediction function - takes shipment data and returns delay prediction.
    
    This is the function called by the API view. It:
    1. Preprocesses the input data
    2. Runs the ML model prediction
    3. Calculates risk score and delay estimate
    4. Generates human-readable reasons for the prediction
    
    Args:
        data: Dictionary with shipment features from the API
        
    Returns:
        Dictionary with prediction results:
        {
            'prediction': 'Delayed' or 'On Time',
            'confidence': 0.87,
            'riskScore': 74,
            'predictedDelay': 3,
            'reasons': ['High weather severity', ...]
        }
    """
    try:
        # Load the trained model
        model, scaler, encoders, model_info = load_model()

        # Preprocess the input features
        features = preprocess_input(data)

        # ── Get prediction ────────────────────────────────────
        # predict() returns [0] or [1]: 0=On Time, 1=Delayed
        prediction = model.predict(features)[0]

        # predict_proba() returns probability for each class: [[prob_class0, prob_class1]]
        probabilities = model.predict_proba(features)[0]

        # The confidence is the probability of the predicted class
        confidence = float(max(probabilities))

        # prediction label: 0 → "On Time", 1 → "Delayed"
        prediction_label = "Delayed" if prediction == 1 else "On Time"

    except FileNotFoundError:
        # ── Fallback: Rule-based prediction if model isn't trained ──
        # This allows the API to work even before training the model
        prediction_label, confidence = _rule_based_prediction(data)

    # ── Calculate risk score (1-100) ──────────────────────────
    risk_score = _calculate_risk_score(data, confidence, prediction_label)

    # ── Estimate delay in days ────────────────────────────────
    predicted_delay = _estimate_delay_days(data, risk_score, prediction_label)

    # ── Generate reasons for the prediction ───────────────────
    reasons = _generate_reasons(data, prediction_label, risk_score)

    return {
        'prediction': prediction_label,
        'confidence': round(confidence, 4),
        'riskScore': risk_score,
        'predictedDelay': predicted_delay,
        'reasons': reasons,
    }


def _rule_based_prediction(data: dict) -> tuple:
    """
    Fallback prediction using simple rules (no ML model needed).
    
    Used when the trained model files aren't available yet.
    This gives reasonable predictions based on domain knowledge:
    - High weather score → likely delayed
    - Monsoon season → likely delayed
    - High traffic → likely delayed
    """
    weather = data.get('weatherScore', 5)
    traffic = data.get('trafficScore', 5)
    season = data.get('season', 'Summer')

    # Calculate a simple risk factor
    risk_factor = (weather * 0.4 + traffic * 0.3)
    if season == 'Monsoon':
        risk_factor += 2
    if season == 'Winter':
        risk_factor += 0.5

    # Predict based on threshold
    if risk_factor > 5.5:
        return "Delayed", min(0.6 + (risk_factor - 5.5) * 0.05, 0.95)
    else:
        return "On Time", min(0.6 + (5.5 - risk_factor) * 0.05, 0.95)


def _calculate_risk_score(data: dict, confidence: float, prediction: str) -> int:
    """
    Calculate a risk score from 1-100 based on multiple factors.
    
    Higher score = higher risk of delay.
    
    Factors considered:
    - Weather severity (25% weight)
    - Traffic congestion (20% weight)
    - Season (15% weight)
    - Distance (15% weight)
    - Model confidence (25% weight)
    """
    weather = data.get('weatherScore', 5)
    traffic = data.get('trafficScore', 5)
    season = data.get('season', 'Summer')
    distance = data.get('distance', 1000)

    # Base risk from weather and traffic (both on 1-10 scale)
    weather_risk = (weather / 10) * 25        # 0-25 points
    traffic_risk = (traffic / 10) * 20        # 0-20 points

    # Season risk
    season_risk_map = {'Monsoon': 15, 'Winter': 8, 'Autumn': 5, 'Summer': 3}
    season_risk = season_risk_map.get(season, 5)  # 0-15 points

    # Distance risk (longer distance = higher risk)
    distance_risk = min((distance / 3000) * 15, 15)  # 0-15 points

    # Model confidence contributes to risk score
    if prediction == "Delayed":
        model_risk = confidence * 25         # 0-25 points (high confidence in delay = high risk)
    else:
        model_risk = (1 - confidence) * 25   # Low confidence in "On Time" = some risk

    # Sum all factors
    risk_score = int(weather_risk + traffic_risk + season_risk + distance_risk + model_risk)

    # Clamp between 1 and 100
    return max(1, min(100, risk_score))


def _estimate_delay_days(data: dict, risk_score: int, prediction: str) -> int:
    """
    Estimate how many days the shipment will be delayed.
    
    Based on the risk score:
    - Risk 1-30:  0 days (On Time)
    - Risk 31-50: 1 day
    - Risk 51-65: 2 days
    - Risk 66-80: 3-4 days
    - Risk 81-100: 5-7 days
    """
    if prediction == "On Time":
        return 0

    if risk_score <= 30:
        return 0
    elif risk_score <= 50:
        return 1
    elif risk_score <= 65:
        return 2
    elif risk_score <= 80:
        return 3 + (1 if data.get('season') == 'Monsoon' else 0)
    else:
        return 5 + (2 if data.get('season') == 'Monsoon' else 0)


def _generate_reasons(data: dict, prediction: str, risk_score: int) -> list:
    """
    Generate human-readable reasons explaining the prediction.
    
    This helps users understand WHY the model made a particular prediction.
    Transparency in ML predictions is important for trust.
    """
    reasons = []

    weather = data.get('weatherScore', 5)
    traffic = data.get('trafficScore', 5)
    season = data.get('season', 'Summer')
    distance = data.get('distance', 1000)
    weight = data.get('weight', 100)

    # Weather-related reasons
    if weather >= 8:
        reasons.append("⚠️ Severe weather conditions (score: {}/10)".format(weather))
    elif weather >= 6:
        reasons.append("🌧️ Moderate weather disruption (score: {}/10)".format(weather))
    elif weather <= 3:
        reasons.append("☀️ Favorable weather conditions (score: {}/10)".format(weather))

    # Traffic-related reasons
    if traffic >= 8:
        reasons.append("🚗 Heavy traffic congestion (score: {}/10)".format(traffic))
    elif traffic >= 6:
        reasons.append("🚙 Moderate traffic expected (score: {}/10)".format(traffic))
    elif traffic <= 3:
        reasons.append("🛣️ Light traffic conditions (score: {}/10)".format(traffic))

    # Season-related reasons
    if season == 'Monsoon':
        reasons.append("🌧️ Monsoon season - historically causes most delays")
    elif season == 'Winter':
        reasons.append("❄️ Winter season - fog and cold may cause minor delays")
    elif season == 'Autumn':
        reasons.append("🍂 Autumn season - generally favorable for shipping")
    else:
        reasons.append("☀️ Summer season - good shipping conditions")

    # Distance-related reasons
    if distance > 2000:
        reasons.append("📏 Long-distance shipment ({}km) - higher delay risk".format(distance))
    elif distance > 1000:
        reasons.append("📏 Medium-distance shipment ({}km)".format(distance))
    else:
        reasons.append("📏 Short-distance shipment ({}km) - lower delay risk".format(distance))

    # Weight-related reasons
    if weight > 3000:
        reasons.append("⚖️ Heavy shipment ({}kg) - may require special handling".format(weight))
    elif weight > 1000:
        reasons.append("⚖️ Medium-weight shipment ({}kg)".format(weight))

    # Overall risk assessment
    if risk_score >= 75:
        reasons.append("🔴 HIGH RISK - Multiple risk factors detected")
    elif risk_score >= 50:
        reasons.append("🟡 MEDIUM RISK - Some concerning factors present")
    else:
        reasons.append("🟢 LOW RISK - Favorable conditions for on-time delivery")

    return reasons
