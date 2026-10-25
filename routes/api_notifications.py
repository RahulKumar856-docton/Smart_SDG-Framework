from flask import Blueprint, jsonify, request, session
import sqlite3
import datetime

api_notifications_bp = Blueprint('api_notifications', __name__)

def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

def login_required(f):
    def wrapper(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper

@api_notifications_bp.route('/', methods=['GET'])
@login_required
def get_notifications():
    conn = get_db_connection()
    try:
        user_id = session['user_id']
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM notifications 
            WHERE user_id = ? 
            ORDER BY created_at DESC LIMIT 50
        """, (user_id,))
        notifications = [dict(r) for r in cursor.fetchall()]
        return jsonify({'success': True, 'data': notifications})
    finally:
        conn.close()

@api_notifications_bp.route('/unread-count', methods=['GET'])
@login_required
def get_unread_count():
    conn = get_db_connection()
    try:
        user_id = session['user_id']
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0", (user_id,))
        count = cursor.fetchone()['count']
        return jsonify({'success': True, 'count': count})
    finally:
        conn.close()

@api_notifications_bp.route('/<int:notif_id>/read', methods=['PATCH'])
@login_required
def mark_read(notif_id):
    conn = get_db_connection()
    try:
        user_id = session['user_id']
        cursor = conn.cursor()
        # Verify ownership
        cursor.execute("SELECT id FROM notifications WHERE id = ? AND user_id = ?", (notif_id, user_id))
        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Notification not found or unauthorized'}), 404
            
        cursor.execute("UPDATE notifications SET is_read = 1, read_at = ? WHERE id = ?", (datetime.datetime.now(), notif_id))
        conn.commit()
        return jsonify({'success': True, 'message': 'Marked as read'})
    finally:
        conn.close()

@api_notifications_bp.route('/read-all', methods=['PATCH'])
@login_required
def mark_all_read():
    conn = get_db_connection()
    try:
        user_id = session['user_id']
        cursor = conn.cursor()
        cursor.execute("UPDATE notifications SET is_read = 1, read_at = ? WHERE user_id = ? AND is_read = 0", (datetime.datetime.now(), user_id))
        conn.commit()
        return jsonify({'success': True, 'message': 'All marked as read'})
    finally:
        conn.close()
