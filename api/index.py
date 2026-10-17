import os
import sys

# Ajouter le dossier backend au sys.path pour que Django trouve les modules
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
backend_dir = os.path.join(project_root, 'backend')

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'parfum_project.settings')

from django.core.wsgi import get_wsgi_application

# Vercel Python runtime cherche une variable `app` de type WSGI
app = get_wsgi_application()
