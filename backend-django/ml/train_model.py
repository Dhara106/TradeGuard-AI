import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

# Set file paths (resolved relative to this file so it works on any OS / in Docker)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # -> backend-django/
DATA_PATH = os.path.join(BASE_DIR, 'ml', 'shipment_data.csv')
MODEL_DIR = os.path.join(BASE_DIR, 'ml')

# Load the dataset
print("Loading dataset from:", DATA_PATH)
df = pd.read_csv(DATA_PATH)

# Categorical columns to encode
categorical_cols = ['origin', 'destination', 'carrier', 'season']
numerical_cols = ['weight', 'distance', 'weather_score', 'traffic_score']

# Dictionary to hold the label encoders
label_encoders = {}

# Fit and save LabelEncoder for each categorical variable
for col in categorical_cols:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    label_encoders[col] = le
    print(f"Encoded {col} with classes: {le.classes_}")

# Features and target variable
df['risk_composite'] = df['weather_score'] * 0.6 + df['traffic_score'] * 0.4
df['weight_distance_ratio'] = df['weight'] / df['distance'].replace(0, 1)

all_feature_cols = categorical_cols + numerical_cols + ['risk_composite', 'weight_distance_ratio']
X = df[all_feature_cols]
y = df['is_delayed']

# Split the dataset (80% train, 20% test)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Scale numerical columns (including engineered columns)
scale_cols = numerical_cols + ['risk_composite', 'weight_distance_ratio']
scaler = StandardScaler()
X_train_scaled = X_train.copy()
X_test_scaled = X_test.copy()

X_train_scaled[scale_cols] = scaler.fit_transform(X_train[scale_cols])
X_test_scaled[scale_cols] = scaler.transform(X_test[scale_cols])

# Train Random Forest Classifier
print("Training Random Forest model...")
model = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)
model.fit(X_train_scaled, y_train)

# Evaluate the model
y_pred = model.predict(X_test_scaled)
accuracy = accuracy_score(y_test, y_pred)
print(f"\nModel Accuracy: {accuracy * 100:.2f}%")
print("\nClassification Report:\n", classification_report(y_test, y_pred))

# Save the trained model, scaler, and label encoders
print("Saving model artifacts...")
joblib.dump(model, os.path.join(MODEL_DIR, 'fraud_model.pkl'))
joblib.dump(scaler, os.path.join(MODEL_DIR, 'scaler.pkl'))
joblib.dump(label_encoders, os.path.join(MODEL_DIR, 'encoders.pkl'))

# Save model metadata
from datetime import datetime
model_info = {
    'accuracy': float(accuracy),
    'algorithm': 'Random Forest Classifier',
    'features': all_feature_cols,
    'training_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
}
joblib.dump(model_info, os.path.join(MODEL_DIR, 'model_info.pkl'))

print("All ML artifacts saved successfully!")
