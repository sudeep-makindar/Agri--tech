import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib
import os

print("Loading dataset...")
df = pd.read_csv(r"d:\11-11\Crop_recommendation.csv")

print("Encoding labels...")
le = LabelEncoder()
df['label_encoded'] = le.fit_transform(df['label'])

X = df[['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']]
y = df['label_encoded']

print("Training Random Forest...")
rf = RandomForestClassifier(n_estimators=100, random_state=42)
rf.fit(X, y)

print("Saving models...")
model_dir = r"d:\11-11\backend\ml_models"
os.makedirs(model_dir, exist_ok=True)

joblib.dump(rf, os.path.join(model_dir, "crop_model.pkl"))
joblib.dump(le, os.path.join(model_dir, "crop_label_encoder.pkl"))

print("Done! Crop model and encoder saved.")
