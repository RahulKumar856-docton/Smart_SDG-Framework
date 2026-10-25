from flask import Blueprint, jsonify, request, session
from config import get_db_connection
from ml.nlp_engine import NLPEngine
import uuid
import datetime

try:
    from services.notification_service import create_notification
except ImportError:
    create_notification = None

api_chatbot_bp = Blueprint('api_chatbot', __name__)
nlp_engine = NLPEngine()

@api_chatbot_bp.route('/chat', methods=['POST'])
def chat():
    """
    Real-time conversational endpoint for the Municipal AI Assistant.
    Handles greetings, FAQs, tracking, clarification, emergencies, and issue reports.
    """
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
        
    data = request.json or {}
    text = data.get('message', '').strip()
    history = data.get('history', [])
    context = data.get('context', {})
    
    if not text:
        return jsonify({'success': False, 'message': 'No message provided'}), 400

    citizen_id = session.get('user_id')
    
    # Process conversation through upgraded NLP Engine
    result = nlp_engine.process_conversation(text, history=history, context=context, user_id=citizen_id)
    
    tracking_reports = []
    
    # Handle Tracking intent with live DB lookup
    if result.get('intent') == 'TRACK_REPORTS':
        search_code = result.get('search_code')
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            if search_code:
                cursor.execute("""
                    SELECT id, report_id_code, category, title, description, location, severity, status, created_at, department_id 
                    FROM citizen_reports 
                    WHERE report_id_code = %s AND citizen_id = %s
                """, (search_code, citizen_id))
                rows = cursor.fetchall()
            else:
                cursor.execute("""
                    SELECT id, report_id_code, category, title, description, location, severity, status, created_at, department_id 
                    FROM citizen_reports 
                    WHERE citizen_id = %s 
                    ORDER BY created_at DESC LIMIT 4
                """, (citizen_id,))
                rows = cursor.fetchall()
            cursor.close()
            conn.close()
            
            if rows:
                tracking_reports = [dict(r) for r in rows]
                if search_code:
                    r = tracking_reports[0]
                    result['reply'] = f"Found report **{r['report_id_code']}** ({r['category']}):\nStatus is currently **{r['status'].replace('_', ' ')}** (Priority: {r['severity']}). Location: {r.get('location', 'Unspecified')}."
                else:
                    result['reply'] = f"Here are your **{len(tracking_reports)}** most recent municipal reports and their live statuses:"
            else:
                if search_code:
                    result['reply'] = f"I couldn't find a report with code **{search_code}** in your account. Please verify the code or check 'My Reports' in the portal."
                else:
                    result['reply'] = "You don't have any active service reports logged yet. If you have any issue to report, just describe it to me!"
        except Exception as e:
            result['reply'] = "I'm having trouble fetching your reports right now, but you can view them anytime under 'My Reports' in the portal."

    # If this generated a completed analysis draft, log it into ai_request_predictions
    analysis = result.get('analysis')
    if analysis and not analysis.get('needs_clarification') and result.get('intent') in ['ISSUE_REPORT_CONFIRMATION', 'EMERGENCY_HAZARD']:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO ai_request_predictions 
                (original_text, predicted_category, category_confidence, predicted_priority, priority_confidence, predicted_resolution_hours, timeline_confidence, extracted_location, extracted_duration)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                text, 
                analysis.get('predicted_category', 'Other Municipal Services'), 
                analysis.get('category_confidence', 90.0),
                analysis.get('predicted_priority', 'MEDIUM'),
                analysis.get('priority_confidence', 85.0),
                analysis.get('predicted_resolution_hours', 72),
                analysis.get('timeline_confidence', 88.0),
                analysis.get('extracted_location', 'Unknown'),
                analysis.get('extracted_duration', 'Unknown')
            ))
            prediction_id = cursor.lastrowid
            conn.commit()
            cursor.close()
            conn.close()
            analysis['prediction_id'] = prediction_id
        except Exception:
            pass

    return jsonify({
        'success': True,
        'reply': result['reply'],
        'intent': result['intent'],
        'analysis': analysis,
        'suggested_replies': result.get('suggested_replies', []),
        'tracking_reports': tracking_reports,
        'context': result.get('new_context', {}),
        'is_emergency': result.get('is_emergency', False)
    })

@api_chatbot_bp.route('/analyze', methods=['POST'])
def analyze_message():
    """
    Backwards-compatible analyze endpoint with multi-intent support.
    """
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
        
    data = request.json or {}
    text = data.get('message', '').strip()
    
    if not text:
        return jsonify({'success': False, 'message': 'No message provided'}), 400
        
    intent = nlp_engine.detect_intent(text)
    
    # If it's a greeting or general query, return structured intent rather than forcing a ticket
    if intent in ['GREETING', 'GRATITUDE', 'CAPABILITIES', 'FAQ_TIMINGS', 'FAQ_CONTACTS', 'FAQ_SDG', 'FAQ_WASTE', 'TRACK_REPORTS']:
        convo = nlp_engine.process_conversation(text, user_id=session.get('user_id'))
        return jsonify({
            'success': True,
            'is_conversational': True,
            'intent': intent,
            'reply': convo['reply'],
            'suggested_replies': convo.get('suggested_replies', [])
        })

    analysis = nlp_engine.analyze_request(text)
    
    # Store this prediction for audit/history
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO ai_request_predictions 
            (original_text, predicted_category, category_confidence, predicted_priority, priority_confidence, predicted_resolution_hours, timeline_confidence, extracted_location, extracted_duration)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            text, 
            analysis['predicted_category'], 
            analysis['category_confidence'],
            analysis['predicted_priority'],
            analysis['priority_confidence'],
            analysis['predicted_resolution_hours'],
            analysis['timeline_confidence'],
            analysis['extracted_location'],
            analysis['extracted_duration']
        ))
        prediction_id = cursor.lastrowid
        conn.commit()
        cursor.close()
        conn.close()
        analysis['prediction_id'] = prediction_id
    except Exception:
        pass
        
    return jsonify({
        'success': True,
        'is_conversational': False,
        'intent': 'Report Municipal Issue',
        'analysis': analysis
    })

@api_chatbot_bp.route('/confirm', methods=['POST'])
def confirm_request():
    """
    Confirm and create an official citizen report ticket in citizen_reports.
    Supports citizen edits for category, location, priority, and description.
    """
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
        
    data = request.json or {}
    analysis = data.get('analysis') or {}
    original_text = data.get('original_text') or data.get('description', '')
    
    category = data.get('category') or analysis.get('predicted_category', 'Other Municipal Services')
    location = data.get('location') or analysis.get('extracted_location', 'Unspecified')
    priority = data.get('priority') or analysis.get('predicted_priority', 'MEDIUM')
    dept_id = data.get('department_id') or analysis.get('recommended_department_id', 4)
    custom_title = data.get('title') or f"Auto-generated: {category} Issue"
    
    if location == "Unknown":
        location = "Unspecified Location"
        
    report_id_code = "REP-" + str(uuid.uuid4())[:8].upper()
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO citizen_reports 
            (report_id_code, citizen_id, category, title, description, location, severity, status, department_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'SUBMITTED', %s)
        """, (
            report_id_code,
            session['user_id'],
            category,
            custom_title,
            original_text if original_text else f"Civic report filed via AI Assistant for {category} at {location}",
            location,
            priority,
            dept_id
        ))
        report_id = cursor.lastrowid
        
        # Link prediction if prediction_id passed
        pred_id = analysis.get('prediction_id') or data.get('prediction_id')
        if pred_id:
            try:
                cursor.execute("UPDATE ai_request_predictions SET request_id = %s WHERE id = %s", (report_id, pred_id))
            except Exception:
                pass
                
        conn.commit()
        cursor.close()
        conn.close()
        
        # Create citizen notification
        if create_notification:
            try:
                create_notification(
                    user_id=session['user_id'],
                    title=f"Report {report_id_code} Registered",
                    message=f"Your complaint regarding {category} at {location} has been registered with status SUBMITTED.",
                    notif_type='CITIZEN_REQUEST',
                    priority=priority if priority in ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] else 'MEDIUM',
                    module='Reports',
                    entity_type='citizen_reports',
                    entity_id=report_id,
                    action_url=f"/citizen/reports/{report_id}"
                )
            except Exception:
                pass

        return jsonify({
            'success': True,
            'message': 'Request created successfully',
            'report_id': report_id,
            'report_id_code': report_id_code,
            'category': category,
            'location': location,
            'priority': priority,
            'resolution_hours': analysis.get('predicted_resolution_hours', 72)
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500

@api_chatbot_bp.route('/my-reports', methods=['GET'])
def get_my_reports():
    """
    Get current citizen's recent reports for instant chat card viewing.
    """
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
        
    citizen_id = session['user_id']
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, report_id_code, category, title, description, location, severity, status, created_at, department_id 
            FROM citizen_reports 
            WHERE citizen_id = %s 
            ORDER BY created_at DESC LIMIT 5
        """, (citizen_id,))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({'success': True, 'reports': [dict(r) for r in rows]})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

