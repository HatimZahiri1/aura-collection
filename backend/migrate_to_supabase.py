#!/usr/bin/env python3
"""
Script pour migrer la base de données vers Supabase PostgreSQL.
Usage:
    python backend/migrate_to_supabase.py
"""

import os
import sys
import subprocess
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent

# Charger .env
load_dotenv(BASE_DIR / '.env')
load_dotenv(BASE_DIR.parent / '.env')

database_url = os.environ.get('DATABASE_URL')

if not database_url or not database_url.strip():
    print("\n❌ ERREUR : La variable DATABASE_URL n'est pas définie dans backend/.env")
    print("Veuillez renseigner votre connection string Supabase dans backend/.env :")
    print("DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres\n")
    sys.exit(1)

if 'sqlite' in database_url:
    print("\n❌ ERREUR : DATABASE_URL pointe toujours vers SQLite, pas vers Supabase PostgreSQL.\n")
    sys.exit(1)

print("\n=======================================================")
print("🚀 MIGRATION DE LA BASE DE DONNÉES VERS SUPABASE")
print("=======================================================\n")

python_bin = sys.executable

# 1. Run migrations
print("1/3 Exécution des migrations Django sur Supabase...")
res_migrate = subprocess.run([python_bin, str(BASE_DIR / 'manage.py'), 'migrate'])
if res_migrate.returncode != 0:
    print("\n❌ Échec de la commande 'migrate'. Vérifiez votre mot de passe et l'URL Supabase.")
    sys.exit(res_migrate.returncode)

print("\n✅ Tables créées avec succès sur Supabase !\n")

# 2. Importer les données
print("2/3 Importation des données du catalogue et des commandes...")
dump_file = BASE_DIR / 'dump_data.json'
loaded = False

if dump_file.exists():
    print(f"Chargement depuis {dump_file.name}...")
    res_load = subprocess.run([python_bin, str(BASE_DIR / 'manage.py'), 'loaddata', str(dump_file)])
    if res_load.returncode == 0:
        loaded = True
        print("\n✅ Données importées avec succès via loaddata !")

if not loaded:
    print("Lancement du script seed_aura_collection.py...")
    res_seed = subprocess.run([python_bin, str(BASE_DIR / 'seed_aura_collection.py')])
    if res_seed.returncode == 0:
        print("\n✅ Données initialisées avec succès via seed script !")
    else:
        print("\n⚠️ Avertissement lors du seed script.")

# 3. Vérification
print("\n3/3 Vérification des enregistrements sur Supabase...")
subprocess.run([
    python_bin, '-c',
    "import os, django; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'parfum_project.settings'); "
    "import sys; sys.path.append('backend'); django.setup(); "
    "from catalog.models import Marque, Collection, Parfum, Format; "
    "from orders.models import Commande; from django.contrib.auth.models import User; "
    "print(f'   - Utilisateurs admin : {User.objects.count()}'); "
    "print(f'   - Marques : {Marque.objects.count()}'); "
    "print(f'   - Collections : {Collection.objects.count()}'); "
    "print(f'   - Gels / Parfums : {Parfum.objects.count()}'); "
    "print(f'   - Formats : {Format.objects.count()}'); "
    "print(f'   - Commandes : {Commande.objects.count()}'); "
])

print("\n🎉 MIGRATION VERS SUPABASE TERMINÉE AVEC SUCCÈS !\n")
