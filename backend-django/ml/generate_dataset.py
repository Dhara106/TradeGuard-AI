import pandas as pd
import numpy as np
import os

# Paths resolved relative to this file so the script works on any OS / in Docker
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # -> backend-django/
ML_DIR = os.path.join(BASE_DIR, 'ml')
DATASET_DIR = os.path.join(BASE_DIR, 'dataset')

# Create directories if they do not exist
os.makedirs(ML_DIR, exist_ok=True)
os.makedirs(DATASET_DIR, exist_ok=True)

# Seed for reproducibility
np.random.seed(42)

# Parameters
num_records = 5000

cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Ahmedabad', 'Pune', 'Jaipur', 'Lucknow']
carriers = ['BlueDart', 'DTDC', 'FedEx', 'DHL', 'Delhivery']
seasons = ['Summer', 'Monsoon', 'Winter', 'Autumn']

# Mock distance between cities (in km)
distance_matrix = {
    ('Mumbai', 'Delhi'): 1400, ('Mumbai', 'Bangalore'): 1000, ('Mumbai', 'Chennai'): 1330, ('Mumbai', 'Kolkata'): 2000,
    ('Delhi', 'Bangalore'): 2100, ('Delhi', 'Chennai'): 2200, ('Delhi', 'Kolkata'): 1500,
    ('Bangalore', 'Chennai'): 350, ('Bangalore', 'Kolkata'): 1900,
    ('Chennai', 'Kolkata'): 1660
}

def get_distance(c1, c2):
    if c1 == c2:
        return 50 # Local shipment
    pair = tuple(sorted([c1, c2]))
    return distance_matrix.get(pair, 800) # Default distance

# Generate columns
origin_list = np.random.choice(cities, num_records)
destination_list = []
for orig in origin_list:
    dest = np.random.choice([c for c in cities if c != orig])
    destination_list.append(dest)

weight_list = np.random.randint(10, 5000, size=num_records)
distance_list = [get_distance(orig, dest) for orig, dest in zip(origin_list, destination_list)]
carrier_list = np.random.choice(carriers, num_records)
season_list = np.random.choice(seasons, num_records)
weather_list = np.random.randint(1, 11, size=num_records) # 1 = Clear, 10 = Severe Cyclone/Rain
traffic_list = np.random.randint(1, 11, size=num_records) # 1 = Empty roads, 10 = Gridlock

# Calculate Delay Probability using features
# Risk starts at base level, and increases with factors:
# - High weather score increases delay risk
# - High traffic score increases delay risk
# - Longer distances increase delay risk
# - Monsoon season adds risk
# - High weight adds small risk
# - DTDC/Delhivery are slightly slower carriers in this synthetic scenario
delay_probs = []
for i in range(num_records):
    prob = 0.05 # Base prob
    
    # Distance factor
    prob += (distance_list[i] / 2200) * 0.2
    
    # Weather factor
    prob += (weather_list[i] / 10) * 0.3
    
    # Traffic factor
    prob += (traffic_list[i] / 10) * 0.2
    
    # Season factor
    if season_list[i] == 'Monsoon':
        prob += 0.15
        
    # Carrier factor
    if carrier_list[i] in ['DTDC', 'Delhivery']:
        prob += 0.05
        
    # Cap between 0 and 1
    prob = min(max(prob, 0.0), 0.95)
    delay_probs.append(prob)

# Determine delay based on probabilities
is_delayed = [1 if np.random.random() < p else 0 for p in delay_probs]

# Generate delay days (0 if not delayed, 1-7 if delayed)
delay_days = []
for delayed, prob in zip(is_delayed, delay_probs):
    if delayed == 0:
        delay_days.append(0)
    else:
        # Scale delay days by the risk probability
        days = int(np.round(prob * 7))
        delay_days.append(max(days, 1))

# Build dataframe
df = pd.DataFrame({
    'origin': origin_list,
    'destination': destination_list,
    'weight': weight_list,
    'distance': distance_list,
    'carrier': carrier_list,
    'season': season_list,
    'weather_score': weather_list,
    'traffic_score': traffic_list,
    'is_delayed': is_delayed,
    'delay_days': delay_days
})

# Save to CSV
df.to_csv(os.path.join(ML_DIR, 'shipment_data.csv'), index=False)
print("Synthetic shipment dataset generated successfully with 5,000 records!")
