from config import get_db_connection

def create_notification(user_id, title, message, notif_type='SYSTEM', priority='INFO', module=None, entity_type=None, entity_id=None, action_url=None):
    """
    Creates a new notification in the database.
    
    :param user_id: ID of the user receiving the notification
    :param title: Notification title
    :param message: Detailed message
    :param notif_type: PROJECT, CITIZEN_REQUEST, INSPECTION, EVIDENCE, DATA_QUALITY, IMPACT, RISK, REPORT, SECURITY, SYSTEM
    :param priority: INFO, LOW, MEDIUM, HIGH, CRITICAL
    :param module: Module name for UI filtering
    :param entity_type: Related entity (e.g., 'Project')
    :param entity_id: ID of the related entity
    :param action_url: Internal route for the action button (e.g. '/admin/projects/2')
    """
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database for notification creation.")
        return False
        
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO notifications 
            (user_id, title, message, type, priority, module, entity_type, entity_id, action_url) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (user_id, title, message, notif_type, priority, module, entity_type, entity_id, action_url))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error creating notification: {e}")
        return False
    finally:
        cursor.close()
        conn.close()

def broadcast_notification_to_role(role, title, message, **kwargs):
    """
    Creates a notification for all users with a specific role.
    """
    conn = get_db_connection()
    if not conn:
        return False
        
    try:
        cursor = conn.cursor(dictionary=True)
        # In SQLite roles are joined via role_id, but the user requested role might be string. 
        # Need to join roles or just users. Let's do a join on roles.
        cursor.execute("""
            SELECT u.id FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE r.name = %s
        """, (role.upper(),))
        users = cursor.fetchall()
        
        for u in users:
            create_notification(user_id=u['id'], title=title, message=message, **kwargs)
            
        return True
    except Exception as e:
        print(f"Error broadcasting notification: {e}")
        return False
    finally:
        cursor.close()
        conn.close()
