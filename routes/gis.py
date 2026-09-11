from flask import Blueprint, render_template, jsonify
from config import get_db_connection
from routes.dashboard import login_required

gis_bp = Blueprint('gis', __name__)

@gis_bp.route('/map')
@login_required
def map_view():
    return render_template('gis/map.html')

@gis_bp.route('/api/gis/wards')
@login_required
def get_ward_stats():
    conn = get_db_connection()
    if not conn: return jsonify([])
    cursor = conn.cursor(dictionary=True)
    
    # Get overall stats per ward
    cursor.execute("""
        SELECT p.ward, 
               COUNT(p.id) as total_projects,
               AVG(p.progress_percentage) as avg_progress,
               AVG(ss.score) as avg_sdg
        FROM projects p
        LEFT JOIN sdg_scores ss ON p.id = ss.project_id
        WHERE p.ward IS NOT NULL
        GROUP BY p.ward
    """)
    wards = cursor.fetchall()
    
    # Format and enrich
    for w in wards:
        w['avg_progress'] = round(w['avg_progress'] or 0, 1)
        w['avg_sdg'] = round(w['avg_sdg'] or 0, 1)
        w['status'] = 'On Track' if w['avg_sdg'] >= 60 else ('Behind' if w['avg_sdg'] < 40 else 'Needs Attention')
        
        # Analyze why it's behind
        if w['status'] == 'Behind' or w['status'] == 'Needs Attention':
            cursor.execute("""
                SELECT s.name, AVG(ss.score) as score
                FROM projects p
                JOIN sdg_scores ss ON p.id = ss.project_id
                JOIN sdgs s ON ss.sdg_id = s.id
                WHERE p.ward = %s
                GROUP BY s.id, s.name
                ORDER BY score ASC LIMIT 3
            """, (w['ward'],))
            w['weakest_sdgs'] = cursor.fetchall()
        else:
            w['weakest_sdgs'] = []
            
    cursor.close()
    conn.close()
    return jsonify(wards)

@gis_bp.route('/api/projects/geojson')
@login_required
def get_geojson():
    conn = get_db_connection()
    if not conn: return jsonify({})
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT p.id, p.project_name, p.status, p.progress_percentage, p.latitude, p.longitude, p.ward, d.name as dept_name,
        (SELECT AVG(score) FROM sdg_scores WHERE project_id = p.id) as avg_sdg
        FROM projects p
        LEFT JOIN departments d ON p.department_id = d.id
        WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
    """)
    projects = cursor.fetchall()
    cursor.close()
    conn.close()
    
    features = []
    for p in projects:
        sdg_val = p['avg_sdg'] or 0
        color = '#198754' # green
        if sdg_val < 40: color = '#dc3545' # red
        elif sdg_val < 70: color = '#ffc107' # yellow
        
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [float(p['longitude']), float(p['latitude'])]
            },
            "properties": {
                "id": p['id'],
                "name": p['project_name'],
                "department": p['dept_name'],
                "status": p['status'],
                "ward": p['ward'] or 'Unassigned',
                "progress": float(p['progress_percentage']),
                "sdg_score": round(sdg_val, 1),
                "color": color
            }
        }
        features.append(feature)
        
    geojson = {
        "type": "FeatureCollection",
        "features": features
    }
    return jsonify(geojson)
