import mysql.connector
from config import get_db_connection
from werkzeug.security import generate_password_hash
import os

def seed_database():
    conn = get_db_connection()
    if not conn:
        print("Could not connect to database.")
        return
    
    cursor = conn.cursor()
    
    # Check if database is already seeded (by checking users)
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] > 0:
        print("Database already seeded. Skipping.")
        conn.close()
        return

    print("Seeding database...")
    
    # 1. Seed Departments
    departments = [
        ('Environment Department', 'Handles environmental and ecological projects.'),
        ('Public Works Department', 'Handles infrastructure and construction.'),
        ('Water & Sanitation Department', 'Handles water supply and waste management.'),
        ('Urban Planning Department', 'Handles city development and green spaces.')
    ]
    cursor.executemany("INSERT INTO departments (name, description) VALUES (%s, %s)", departments)
    
    # 2. Seed Users
    hashed_pwd = generate_password_hash('password123')
    users = [
        ('admin', hashed_pwd, 'Admin', None, 'System Administrator', 'admin@municipality.gov', '1234567890'),
        ('officer1', hashed_pwd, 'Officer', 1, 'John Doe', 'john@municipality.gov', '0987654321'),
        ('citizen1', hashed_pwd, 'Citizen', None, 'Jane Smith', 'jane@example.com', '1122334455')
    ]
    cursor.executemany("INSERT INTO users (username, password_hash, role, department_id, full_name, email, phone) VALUES (%s, %s, %s, %s, %s, %s, %s)", users)
    
    # 3. Seed SDGs
    sdgs = [
        (6, 'Clean Water and Sanitation', 'Ensure availability and sustainable management of water and sanitation for all.', '#26BDE2'),
        (11, 'Sustainable Cities and Communities', 'Make cities and human settlements inclusive, safe, resilient and sustainable.', '#FD9D24'),
        (13, 'Climate Action', 'Take urgent action to combat climate change and its impacts.', '#3F7E44'),
        (15, 'Life on Land', 'Protect, restore and promote sustainable use of terrestrial ecosystems.', '#56C02B')
    ]
    cursor.executemany("INSERT INTO sdgs (id, name, description, color) VALUES (%s, %s, %s, %s)", sdgs)
    
    # 4. Seed KPIs
    kpis = [
        # SDG 6
        (6, 'Water Supply Coverage', 'Percentage of population with access to safe drinking water', '%', 100, 1.0),
        (6, 'Wastewater Treatment', 'Percentage of wastewater treated safely', '%', 90, 1.5),
        # SDG 11
        (11, 'Waste Collection Efficiency', 'Percentage of municipal solid waste collected', '%', 95, 1.0),
        (11, 'Green/Public Space Availability', 'Area of public green space per capita', 'sq.m/capita', 15, 1.0),
        # SDG 13
        (13, 'Carbon Emission Reduction', 'Reduction in carbon emissions compared to baseline', '%', 30, 2.0),
        (13, 'Renewable Energy Usage', 'Percentage of renewable energy used in municipal operations', '%', 50, 1.5),
        # SDG 15
        (15, 'Tree Plantation', 'Number of trees planted', 'count', 10000, 1.0),
        (15, 'Green Cover', 'Percentage increase in total green cover', '%', 20, 1.5)
    ]
    cursor.executemany("INSERT INTO kpis (sdg_id, name, description, unit, target_value, weight) VALUES (%s, %s, %s, %s, %s, %s)", kpis)

    # 5. Sample Projects
    projects = [
        ('Lake Restoration Project', 'Restoring the main municipal lake and surrounding biodiversity', 1, 2, 'Central Park', 28.6139, 77.2090, '2025-01-01', '2026-12-31', None, 5000000, 2250000, 'In Progress', 45.0, 'High', 50000, 'Positive impact on local flora and fauna', 1),
        ('Solar Street Lighting', 'Installing solar street lights in sector 4', 2, 2, 'Sector 4', 28.6150, 77.2100, '2025-06-01', '2025-12-31', None, 1000000, 200000, 'Planned', 10.0, 'Medium', 10000, 'Reduces carbon footprint', 1),
        ('Wastewater Treatment Plant', 'New plant in the industrial zone', 3, 2, 'Industrial Zone', 28.6200, 77.2150, '2024-01-01', '2025-06-30', None, 15000000, 12000000, 'Delayed', 70.0, 'Critical', 100000, 'Improves water quality', 1)
    ]
    cursor.executemany("""
        INSERT INTO projects (project_name, description, department_id, manager_id, location, latitude, longitude, start_date, expected_end_date, actual_end_date, allocated_budget, amount_spent, status, progress_percentage, priority, population_benefited, environmental_impact, created_by) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, projects)

    # 6. Project SDGs Mapping
    project_sdgs = [
        (1, 6), (1, 11), (1, 13), (1, 15), # Lake Restoration maps to all
        (2, 11), (2, 13),                  # Solar lighting
        (3, 6), (3, 11)                    # Wastewater plant
    ]
    cursor.executemany("INSERT INTO project_sdgs (project_id, sdg_id) VALUES (%s, %s)", project_sdgs)

    conn.commit()
    cursor.close()
    conn.close()
    print("Database seeded successfully.")

if __name__ == '__main__':
    seed_database()
