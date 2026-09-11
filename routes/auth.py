from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from werkzeug.security import check_password_hash, generate_password_hash
from models.user import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        user = User.get_by_username(username)
        if user and check_password_hash(user['password_hash'], password):
            if user.get('status') == 'Pending':
                flash('Your officer account is awaiting administrator approval.', 'warning')
                return render_template('login.html')
            elif user.get('status') == 'Deactivated':
                flash('Your account has been deactivated. Contact support.', 'danger')
                return render_template('login.html')
                
            session['user_id'] = user['id']
            session['role'] = user['role']
            session['full_name'] = user['full_name']
            flash('Logged in successfully.', 'success')
            
            if user['role'] == 'Citizen':
                return redirect(url_for('citizen.dashboard'))
            return redirect(url_for('dashboard.index'))
        else:
            flash('Invalid username or password.', 'danger')
            
    return render_template('login.html')

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        full_name = request.form['full_name']
        email = request.form['email']
        password = request.form['password']
        confirm = request.form['confirm_password']
        role = request.form['role']
        
        if password != confirm:
            flash("Passwords do not match.", "danger")
            return redirect(url_for('auth.register'))
            
        if role not in ['Citizen', 'Municipal Officer']:
            flash("Invalid role selection.", "danger")
            return redirect(url_for('auth.register'))
            
        # Optional fields based on role
        username = request.form.get('username')
        phone = request.form.get('phone')
        employee_id = request.form.get('employee_id')
        
        # Validation
        if User.get_by_username(username if username else email):
            flash("Username or Email already exists.", "danger")
            return redirect(url_for('auth.register'))
            
        hashed_pwd = generate_password_hash(password)
        
        if role == 'Citizen':
            # Citizens don't have employee IDs, status is Active immediately
            success = User.create_user(full_name, username, email, phone, hashed_pwd, role, status='Active')
            if success:
                flash("Account created successfully. You can now sign in.", "success")
                return redirect(url_for('auth.login'))
        elif role == 'Municipal Officer':
            # Officers need approval, so status is Pending
            # Username is generated from email for officers if not provided
            uname = username if username else email.split('@')[0]
            success = User.create_user(full_name, uname, email, phone, hashed_pwd, role, employee_id=employee_id, status='Pending')
            if success:
                flash("Account created successfully. Your officer account is awaiting administrator approval.", "info")
                return redirect(url_for('auth.login'))
                
        flash("An error occurred creating your account.", "danger")
        return redirect(url_for('auth.register'))

    return render_template('register.html')

@auth_bp.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form.get('email')
        user = User.get_by_username(email)
        if user:
            # Simulate sending email by just saving the ID to session and redirecting
            session['reset_user_id'] = user['id']
            flash("Verification email sent! (Simulated - Redirecting to reset page)", "success")
            return redirect(url_for('auth.reset_password'))
        else:
            flash("If that email exists in our system, a reset link has been sent.", "info")
            return redirect(url_for('auth.login'))
            
    return render_template('forgot_password.html')

@auth_bp.route('/reset-password', methods=['GET', 'POST'])
def reset_password():
    user_id = session.get('reset_user_id')
    if not user_id:
        flash("Invalid or expired password reset link.", "danger")
        return redirect(url_for('auth.forgot_password'))
        
    if request.method == 'POST':
        password = request.form['password']
        confirm = request.form['confirm_password']
        
        if password != confirm:
            flash("Passwords do not match.", "danger")
            return redirect(url_for('auth.reset_password'))
            
        # Reset logic
        conn = __import__('config').get_db_connection()
        cursor = conn.cursor()
        hashed = generate_password_hash(password)
        cursor.execute("UPDATE users SET password_hash = %s WHERE id = %s", (hashed, user_id))
        conn.commit()
        cursor.close()
        conn.close()
        
        session.pop('reset_user_id', None)
        flash("Password successfully reset. You can now sign in.", "success")
        return redirect(url_for('auth.login'))
        
    return render_template('reset_password.html')

@auth_bp.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('auth.login'))
