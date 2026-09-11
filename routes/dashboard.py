from flask import Blueprint, render_template, session, redirect, url_for
from config import get_db_connection
from functools import wraps

dashboard_bp = Blueprint('dashboard', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

@dashboard_bp.route('/dashboard')
@login_required
def index():
    if session.get('role') == 'Officer':
        return redirect(url_for('officer.dashboard'))
    elif session.get('role') == 'Citizen':
        return redirect(url_for('citizen.dashboard'))
    return render_template('dashboard.html')
