import json
from config import get_db_connection

class SettingsService:
    @staticmethod
    def get_all_settings(mask_secrets=True):
        conn = get_db_connection()
        if not conn:
            return {}
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM system_settings")
            rows = cursor.fetchall()
            
            settings = {}
            for row in rows:
                val = row['setting_value']
                if row['setting_type'] == 'boolean':
                    val = val.lower() == 'true' if val else False
                elif row['setting_type'] == 'number':
                    val = float(val) if val and '.' in val else int(val) if val else 0
                elif row['setting_type'] == 'json':
                    try:
                        val = json.loads(val)
                    except:
                        val = {}
                elif row['setting_type'] == 'secret' and mask_secrets:
                    val = '[CONFIGURED]' if val else '[NOT CONFIGURED]'
                    
                cat = row['category']
                if cat not in settings:
                    settings[cat] = []
                settings[cat].append({
                    'key': row['setting_key'],
                    'value': val,
                    'type': row['setting_type'],
                    'description': row['description']
                })
            return settings
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def get_setting(key, default=None):
        conn = get_db_connection()
        if not conn:
            return default
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT setting_value, setting_type FROM system_settings WHERE setting_key = %s", (key,))
            row = cursor.fetchone()
            if not row:
                return default
                
            val = row['setting_value']
            if row['setting_type'] == 'boolean':
                return val.lower() == 'true' if val else False
            elif row['setting_type'] == 'number':
                return float(val) if val and '.' in val else int(val) if val else 0
            elif row['setting_type'] == 'json':
                try:
                    return json.loads(val)
                except:
                    return default
            return val
        except Exception as e:
            print(f"Error reading setting {key}: {e}")
            return default
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def update_settings(updates, user_id=None):
        """
        Updates a dictionary of key-value pairs.
        Ignores [CONFIGURED] or [NOT CONFIGURED] values for secrets.
        """
        conn = get_db_connection()
        if not conn:
            return False, "Database connection failed"
            
        try:
            cursor = conn.cursor(dictionary=True)
            changes_made = []
            
            for key, val in updates.items():
                # Skip masked secrets
                if isinstance(val, str) and val in ('[CONFIGURED]', '[NOT CONFIGURED]'):
                    continue
                    
                cursor.execute("SELECT setting_value, setting_type FROM system_settings WHERE setting_key = %s", (key,))
                row = cursor.fetchone()
                if not row:
                    continue
                    
                old_val = row['setting_value']
                db_val = val
                if row['setting_type'] == 'boolean':
                    db_val = 'true' if val else 'false'
                elif row['setting_type'] == 'json':
                    db_val = json.dumps(val)
                else:
                    db_val = str(val)
                    
                if old_val != db_val:
                    cursor.execute("""
                        UPDATE system_settings 
                        SET setting_value = %s, updated_by = %s, updated_at = CURRENT_TIMESTAMP 
                        WHERE setting_key = %s
                    """, (db_val, user_id, key))
                    changes_made.append({
                        'key': key,
                        'old': old_val if row['setting_type'] != 'secret' else '[MASKED]',
                        'new': db_val if row['setting_type'] != 'secret' else '[MASKED]'
                    })
                    
            # Audit log for changes
            if changes_made and user_id:
                for change in changes_made:
                    cursor.execute("""
                        INSERT INTO audit_logs (user_id, action, module, entity, entity_id, new_value)
                        VALUES (%s, 'SETTINGS_UPDATE', 'Settings', 'system_settings', 0, %s)
                    """, (user_id, f"Changed {change['key']} from {change['old']} to {change['new']}"))
                    
            conn.commit()
            return True, changes_made
        except Exception as e:
            conn.rollback()
            return False, str(e)
        finally:
            cursor.close()
            conn.close()
