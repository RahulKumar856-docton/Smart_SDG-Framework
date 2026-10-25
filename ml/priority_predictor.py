import random

class PriorityPredictor:
    def __init__(self):
        """
        Initializes the Priority Predictor.
        In a full production scenario, this would load a pre-trained ML model (e.g., Random Forest or XGBoost)
        trained on historical resolution times and complaint severity.
        """
        self.priority_levels = ['Low', 'Medium', 'High', 'Critical']
        
        # Simulated feature weights based on typical municipal SLA patterns
        self.category_weights = {
            'Water & Sanitation': 3,
            'Roads & Transport': 2,
            'Electricity & Power': 3,
            'Public Health': 4,
            'Waste Management': 2,
            'Parks & Recreation': 1,
            'Street Lighting': 2
        }
        
    def predict_priority(self, category: str, title: str, description: str, duration_days: int = 0) -> str:
        """
        Predicts the priority of a citizen request.
        """
        score = 0
        
        # Base score from category
        score += self.category_weights.get(category, 1)
        
        # Keyword analysis
        text = f"{title} {description}".lower()
        critical_keywords = ['emergency', 'accident', 'danger', 'hospital', 'blood', 'fire', 'hazard', 'blocked drain', 'flooding']
        high_keywords = ['urgent', 'leak', 'broken', 'pothole', 'no water', 'outage', 'smell', 'dead animal']
        
        for kw in critical_keywords:
            if kw in text:
                score += 3
                break
                
        for kw in high_keywords:
            if kw in text:
                score += 1.5
                break
                
        # Duration factor: longer unresolved issues escalate in priority
        if duration_days > 30:
            score += 2
        elif duration_days > 14:
            score += 1
            
        # Add slight variance to simulate ML prediction boundary fuzziness
        score += random.uniform(-0.5, 0.5)
        
        # Map score to priority
        if score >= 6.5:
            return 'Critical'
        elif score >= 4.5:
            return 'High'
        elif score >= 2.5:
            return 'Medium'
        else:
            return 'Low'

    def get_model_health(self):
        """Returns simulated model accuracy metrics for the AI Intelligence Dashboard"""
        return {
            "accuracy": 0.92,
            "f1_score": 0.89,
            "training_samples": 12450,
            "last_trained": "2026-09-15"
        }
