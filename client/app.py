"""
Forwarder for deployments where Render's Root Directory was set to 'client'.
This forwards application startup to the root app.py.
"""
import sys
import os

# Add root directory to python path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from app import create_app, app  # noqa: F401

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
