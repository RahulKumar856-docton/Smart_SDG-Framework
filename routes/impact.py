from flask import Blueprint, render_template, session, redirect, url_for

impact_bp = Blueprint('impact', __name__, url_prefix='/impact')

def admin_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('role', '').upper() != 'ADMIN':
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

@impact_bp.route('/')
@admin_required
def index():
    return render_template('impact/index.html')
