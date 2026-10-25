from flask import Blueprint, jsonify, session, request
from config import get_db_connection
from routes.utils import role_required
from ml.complaint_clustering import ComplaintClusteringEngine
from ml.priority_predictor import PriorityPredictor

ai_intelligence_bp = Blueprint('ai_intelligence', __name__)

# Initialize ML Models
clustering_engine = ComplaintClusteringEngine(eps=0.4, min_samples=2)
priority_predictor = PriorityPredictor()

@ai_intelligence_bp.route('/complaint-clusters', methods=['GET'])
@role_required('ADMIN')
def get_complaint_clusters():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Fetch recent unresolved complaints
    cursor.execute("""
        SELECT id, title, description, category, location, status, priority, created_at 
        FROM citizen_requests 
        WHERE status NOT IN ('COMPLETED', 'RESOLVED', 'REJECTED')
        ORDER BY created_at DESC
        LIMIT 500
    """)
    complaints = cursor.fetchall()
    cursor.close()
    conn.close()
    
    # Format for clustering
    for c in complaints:
        if c['created_at']:
            c['created_at'] = str(c['created_at'])
            
    # Run clustering
    clusters = clustering_engine.cluster_complaints(complaints)
    
    return jsonify({
        'success': True,
        'data': clusters,
        'metrics': {
            'total_analyzed': len(complaints),
            'clusters_found': len(clusters)
        }
    })

@ai_intelligence_bp.route('/priority-predictions', methods=['GET'])
@role_required('ADMIN')
def get_priority_predictions():
    # In a real app, this would return historical predictions.
    # For now, we will fetch recent complaints and run the predictor on them to demonstrate.
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT id, request_id_code, title, description, category, priority as actual_priority, created_at
        FROM citizen_requests
        ORDER BY created_at DESC
        LIMIT 50
    """)
    complaints = cursor.fetchall()
    cursor.close()
    conn.close()
    
    predictions = []
    for c in complaints:
        predicted = priority_predictor.predict_priority(
            category=c['category'],
            title=c['title'],
            description=c['description']
        )
        
        predictions.append({
            'request_id': c['id'],
            'request_code': c['request_id_code'],
            'title': c['title'],
            'category': c['category'],
            'actual_priority': c['actual_priority'],
            'predicted_priority': predicted,
            'match': c['actual_priority'] == predicted,
            'date': str(c['created_at'])
        })
        
    return jsonify({
        'success': True,
        'data': predictions,
        'health': priority_predictor.get_model_health()
    })
