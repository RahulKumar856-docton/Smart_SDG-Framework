from flask import Blueprint, render_template, session, redirect, url_for

admin_inspections_bp = Blueprint('admin_inspections', __name__, url_prefix='/admin/inspections')

@admin_inspections_bp.route('/')
def index():
    if 'user_id' not in session or session.get('role', '').upper() != 'ADMIN':
        return redirect(url_for('auth.login'))
    return render_template('admin/inspections.html')
