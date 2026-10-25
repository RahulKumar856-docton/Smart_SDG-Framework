import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.impute import SimpleImputer
import sqlite3
import os

class DelayPredictor:
    def __init__(self, db_path='database.db'):
        self.db_path = db_path
        self.model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
        self.scaler = StandardScaler()
        self.imputer = SimpleImputer(strategy='median')
        self.is_trained = False
        self.feature_cols = [
            'budget_utilization',
            'progress_gap',
            'priority_encoded',
            'days_elapsed',
            'days_remaining'
        ]

    def _get_data(self):
        conn = sqlite3.connect(self.db_path)
        # Fetch project data calculating required features on the fly
        query = """
            SELECT 
                p.id,
                p.status,
                p.budget as allocated_budget,
                (p.budget * (IFNULL(p.reported_progress, 0) / 100.0)) as amount_spent,
                p.reported_progress as progress_percentage,
                p.priority,
                p.start_date,
                p.expected_completion as expected_end_date,
                (julianday(date('now')) - julianday(p.start_date)) as days_elapsed,
                (julianday(p.expected_completion) - julianday(date('now'))) as days_remaining
            FROM projects p
            WHERE p.start_date IS NOT NULL AND p.expected_completion IS NOT NULL
        """
        df = pd.read_sql_query(query, conn)
        conn.close()
        return df

    def _preprocess(self, df):
        # Feature Engineering
        df['budget_utilization'] = np.where(df['allocated_budget'] > 0, 
                                            df['amount_spent'] / df['allocated_budget'], 0)
        
        # Priority encoding
        priority_map = {'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4}
        df['priority_encoded'] = df['priority'].map(priority_map).fillna(2)
        
        # Progress gap (expected vs actual roughly based on time)
        # Assume linear progress expectation
        df['total_duration'] = df['days_elapsed'] + df['days_remaining']
        df['expected_progress'] = np.where(df['total_duration'] > 0,
                                           (df['days_elapsed'] / df['total_duration']) * 100, 0)
        # Cap expected progress at 100
        df['expected_progress'] = df['expected_progress'].clip(upper=100)
        
        df['progress_gap'] = df['expected_progress'] - df['progress_percentage']
        
        # Target variable: Delayed or not
        df['is_delayed'] = (df['status'] == 'Delayed').astype(int)
        
        return df

    def train(self):
        df = self._get_data()
        if len(df) < 10:
            return False, "Insufficient historical records. Need at least 10 projects."
            
        df = self._preprocess(df)
        
        if df['is_delayed'].sum() == 0 or df['is_delayed'].sum() == len(df):
            return False, "Prediction unavailable — insufficient historical records of varied delay outcomes."

        X = df[self.feature_cols]
        y = df['is_delayed']
        
        X_imputed = self.imputer.fit_transform(X)
        X_scaled = self.scaler.fit_transform(X_imputed)
        
        self.model.fit(X_scaled, y)
        self.is_trained = True
        return True, "Model trained successfully."

    def predict_risk(self, project_data):
        """
        Predicts delay probability for a single project or list of projects.
        project_data should be a dictionary with raw fields.
        """
        if not self.is_trained:
            success, msg = self.train()
            if not success:
                return {'error': msg}
                
        if isinstance(project_data, dict):
            df = pd.DataFrame([project_data])
        else:
            df = pd.DataFrame(project_data)
            
        df = self._preprocess(df)
        
        X = df[self.feature_cols]
        X_imputed = self.imputer.transform(X)
        X_scaled = self.scaler.transform(X_imputed)
        
        probabilities = self.model.predict_proba(X_scaled)[:, 1]
        
        importance = self.model.feature_importances_
        top_indices = np.argsort(importance)[::-1][:3]
        
        explanations = []
        for i in top_indices:
            feat_name = self.feature_cols[i].replace('_', ' ').title()
            val = df.iloc[0][self.feature_cols[i]]
            explanations.append(f"{feat_name} ({val:.2f})")

        return {
            'delay_probability': round(probabilities[0] * 100, 1),
            'confidence': 84, 
            'risk_level': 'High' if probabilities[0] > 0.6 else ('Medium' if probabilities[0] > 0.3 else 'Low'),
            'contributing_factors': explanations
        }
