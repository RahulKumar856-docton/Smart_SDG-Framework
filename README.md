# Smart SDG Monitoring Framework

An integrated, KPI-driven, predictive and decision-support framework for evaluating municipal development projects against SDGs 6, 11, 13, and 15.

## Architecture

- **Frontend**: HTML5, CSS3, Bootstrap 5, Chart.js, Leaflet.js
- **Backend**: Python, Flask
- **Database**: MySQL
- **Analytics/ML**: Python (Scikit-learn, Pandas, NumPy)
- **Reporting**: ReportLab (PDF)

## Prerequisites

1. Python 3.9+
2. MySQL Server running locally (or remote, update config.py)

## Installation & Setup

1. **Clone/Navigate to the directory**:
   ```cmd
   cd c:\Smart-SDG-Framework
   ```

2. **Activate Virtual Environment** (already created in this workspace):
   ```cmd
   .\venv\Scripts\activate
   ```
   *(If not created, run: `python -m venv venv` and `pip install -r requirements.txt`)*

3. **Database Configuration**:
   - Open `config.py` and update `DB_USER` and `DB_PASSWORD` if your MySQL root password is not empty.
   - Ensure your MySQL server is running on localhost port 3306.

4. **Initialize and Seed Database**:
   ```cmd
   python init_db.py
   python seed.py
   ```

5. **Run the Application**:
   ```cmd
   python app.py
   ```
   The application will be available at `http://localhost:5000`

## Default Accounts (Password for all: `password123`)
- **Admin**: `admin`
- **Officer**: `officer1`
- **Citizen**: `citizen1`

## Demonstration Workflow
1. Login as Admin (`admin` / `password123`).
2. View the dashboard statistics and charts.
3. Go to **Projects** -> **Create New Project**.
4. Enter details (e.g., "Lake Restoration Project", Budget: 5000000, Progress: 45, Lat: 28.6139, Lng: 77.2090). Check all SDGs (6, 11, 13, 15).
5. On the project details page, scroll down to KPIs and update the values.
6. The SDG Scores, Overall Sustainability Score, Gap Analysis, Risk Prediction, Early Warnings, and Recommendations will automatically calculate and update based on your inputs.
7. Click **Generate PDF Report** to download the analysis.
8. Go to **GIS Map** to see the project plotted based on its status/risk color.
9. Logout, login as `citizen1`, and submit feedback for the project.
