from flask import Blueprint, render_template, session, redirect, url_for

data_quality_bp = Blueprint('data_quality', __name__, url_prefix='/admin/data-quality')

@data_quality_bp.route('/')
def index():
    if 'user_id' not in session or session.get('role', '').upper() != 'ADMIN':
        return redirect(url_for('auth.login'))
    return render_template('admin/data_quality.html')
