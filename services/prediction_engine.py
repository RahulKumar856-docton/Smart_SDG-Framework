from config import get_db_connection
from ml.delay_prediction import DelayPredictor
import os

predictor = DelayPredictor(db_path=os.path.join(os.path.abspath(os.path.dirname(__file__)), '..', 'database.db'))

def predict_project_delay(project_id):
    """
    Predictive Delay Analysis using ML.
    Falls back to a message if insufficient data is available.
    """
    conn = get_db_connection()
    if not conn: return None
    
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM projects WHERE id = %s", (project_id,))
    p = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not p: return None
    if p['status'] == 'Completed':
        return {'probability': 0, 'confidence': 100, 'prediction': 'Project is already completed.', 'factors': []}

    # Attempt to use ML predictor
    ml_result = predictor.predict_risk(p)
    
    if 'error' in ml_result:
        # Return insufficient data message as per prompt
        return {
            'probability': None,
            'confidence': None,
            'prediction': 'Prediction unavailable — insufficient historical records.',
            'factors': [{'name': ml_result['error'], 'weight': 100}]
        }

    prediction_text = ""
    if ml_result['risk_level'] == 'High':
        prediction_text = "High likelihood of significant delay."
    elif ml_result['risk_level'] == 'Medium':
        prediction_text = "Moderate risk of missing deadline."
    else:
        prediction_text = "Project is tracking well against expected timelines."

    formatted_factors = [{'name': factor, 'weight': 50} for factor in ml_result['contributing_factors']]

    return {
        'probability': ml_result['delay_probability'],
        'confidence': ml_result['confidence'],
        'prediction': prediction_text,
        'factors': formatted_factors
    }
