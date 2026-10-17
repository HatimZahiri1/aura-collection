import json
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from catalog.models import Marque, Parfum, Format


SEED_DATA = {
    "marques": [
        {"nom": "Dior", "description": "Maison de luxe française fondée en 1946"},
        {"nom": "Chanel", "description": "Maison de haute couture et parfumerie française"},
        {"nom": "Tom Ford", "description": "Marque de luxe américaine"},
        {"nom": "Creed", "description": "Maison de parfumerie de niche fondée en 1760"},
        {"nom": "Yves Saint Laurent", "description": "Maison de couture et parfumerie française"},
        {"nom": "Versace", "description": "Maison de mode italienne"},
        {"nom": "Giorgio Armani", "description": "Maison de mode et parfumerie italienne"},
        {"nom": "Hermès", "description": "Maison de luxe française"},
        {"nom": "Maison Francis Kurkdjian", "description": "Maison de parfumerie de niche française"},
        {"nom": "Parfums de Marly", "description": "Maison de parfumerie de luxe française"},
    ],
    "parfums": [
        {
            "nom": "Sauvage",
            "marque": "Dior",
            "description": "Un parfum masculin audacieux et noble. Sauvage est une composition brute et fraîche, inspirée par les grands espaces désertiques sous un ciel brûlant de bleu.",
            "genre": "homme",
            "famille_olfactive": "fraiche",
            "notes_tete": "Bergamote de Calabre, Poivre",
            "notes_coeur": "Poivre de Sichuan, Lavande, Géranium",
            "notes_fond": "Ambroxan, Cèdre, Labdanum",
            "concentration": "EDP",
            "actif": True,
            "mis_en_avant": True,
            "formats": [
                {"type_format": "decant_5", "contenance_ml": 5, "prix": 85, "stock": 25},
                {"type_format": "decant_10", "contenance_ml": 10, "prix": 150, "stock": 20},
                {"type_format": "complet", "contenance_ml": 100, "prix": 1350, "stock": 8},
            ],
        },
        {
            "nom": "Bleu de Chanel",
            "marque": "Chanel",
            "description": "Un parfum boisé et aromatique qui révèle l'esprit de l'homme libre. Bleu de Chanel est une fragrance qui allie élégance et modernité.",
            "genre": "homme",
            "famille_olfactive": "boisee",
            "notes_tete": "Citron, Menthe, Pamplemousse rose",
            "notes_coeur": "Gingembre, Jasmin, Noix de muscade",
            "notes_fond": "Cèdre, Santal, Bois de Cachemire, Encens",
            "concentration": "EDP",
            "actif": True,
            "mis_en_avant": True,
            "formats": [
                {"type_format": "decant_5", "contenance_ml": 5, "prix": 90, "stock": 18},
                {"type_format": "decant_10", "contenance_ml": 10, "prix": 160, "stock": 15},
                {"type_format": "complet", "contenance_ml": 100, "prix": 1500, "stock": 5},
            ],
        },
        {
            "nom": "Tobacco Vanille",
            "marque": "Tom Ford",
            "description": "Un parfum opulent qui mêle les feuilles de tabac aux épices douces et à la vanille crémeuse. Sophistiqué et envoûtant.",
            "genre": "mixte",
            "famille_olfactive": "orientale",
            "notes_tete": "Tabac, Épices",
            "notes_coeur": "Vanille, Fève tonka, Cacao",
            "notes_fond": "Fruits secs, Bois sucrés",
            "concentration": "EDP",
            "actif": True,
            "mis_en_avant": True,
            "formats": [
                {"type_format": "decant_5", "contenance_ml": 5, "prix": 120, "stock": 12},
                {"type_format": "decant_10", "contenance_ml": 10, "prix": 220, "stock": 10},
                {"type_format": "complet", "contenance_ml": 50, "prix": 2800, "stock": 3},
            ],
        },
        {
            "nom": "Aventus",
            "marque": "Creed",
            "description": "Le parfum de la victoire et du pouvoir. Aventus célèbre la force, la vision et le succès avec un accord fruité boisé unique.",
            "genre": "homme",
            "famille_olfactive": "boisee",
            "notes_tete": "Ananas, Cassis, Pomme verte, Bergamote",
            "notes_coeur": "Rose, Jasmin, Bouleau, Patchouli",
            "notes_fond": "Musc, Mousse de chêne, Ambre gris, Vanille",
            "concentration": "EDP",
            "actif": True,
            "mis_en_avant": True,
            "formats": [
                {"type_format": "decant_5", "contenance_ml": 5, "prix": 150, "stock": 10},
                {"type_format": "decant_10", "contenance_ml": 10, "prix": 280, "stock": 8},
                {"type_format": "complet", "contenance_ml": 100, "prix": 3500, "stock": 2},
            ],
        },
        {
            "nom": "La Nuit de L'Homme",
            "marque": "Yves Saint Laurent",
            "description": "Un parfum magnétique et séduisant qui capture l'essence de la nuit parisienne. Intense et mystérieux.",
            "genre": "homme",
            "famille_olfactive": "orientale",
            "notes_tete": "Cardamome, Bergamote, Lavande",
            "notes_coeur": "Cèdre de Virginie, Cumin",
            "notes_fond": "Vétiver, Fève tonka",
            "concentration": "EDT",
            "actif": True,
            "mis_en_avant": False,
            "formats": [
                {"type_format": "decant_5", "contenance_ml": 5, "prix": 70, "stock": 30},
                {"type_format": "decant_10", "contenance_ml": 10, "prix": 120, "stock": 22},
                {"type_format": "complet", "contenance_ml": 100, "prix": 950, "stock": 10},
            ],
        },
        {
            "nom": "Eros",
            "marque": "Versace",
            "description": "Un parfum inspiré de la mythologie grecque et du dieu de l'amour. Frais, boisé et envoûtant.",
            "genre": "homme",
            "famille_olfactive": "fraiche",
            "notes_tete": "Menthe, Pomme verte, Citron",
            "notes_coeur": "Fève tonka, Ambroxan, Géranium",
            "notes_fond": "Vanille, Vétiver, Mousse de chêne, Cèdre",
            "concentration": "EDT",
            "actif": True,
            "mis_en_avant": False,
            "formats": [
                {"type_format": "decant_5", "contenance_ml": 5, "prix": 60, "stock": 35},
                {"type_format": "decant_10", "contenance_ml": 10, "prix": 100, "stock": 25},
                {"type_format": "complet", "contenance_ml": 100, "prix": 800, "stock": 12},
            ],
        },
        {
            "nom": "Acqua di Giò Profondo",
            "marque": "Giorgio Armani",
            "description": "La profondeur de l'océan capturée dans un parfum. Un aquatique moderne et intense.",
            "genre": "homme",
            "famille_olfactive": "fraiche",
            "notes_tete": "Bergamote, Mandarine verte, Notes aquatiques",
            "notes_coeur": "Cyprès, Lavande, Romarin",
            "notes_fond": "Ambre, Musc, Patchouli, Bois de cachemire",
            "concentration": "EDP",
            "actif": True,
            "mis_en_avant": False,
            "formats": [
                {"type_format": "decant_5", "contenance_ml": 5, "prix": 75, "stock": 20},
                {"type_format": "decant_10", "contenance_ml": 10, "prix": 135, "stock": 15},
                {"type_format": "complet", "contenance_ml": 75, "prix": 1100, "stock": 7},
            ],
        },
        {
            "nom": "Coco Mademoiselle",
            "marque": "Chanel",
            "description": "Un parfum féminin frais et oriental. L'incarnation de l'élégance parisienne moderne.",
            "genre": "femme",
            "famille_olfactive": "orientale",
            "notes_tete": "Orange, Mandarine, Bergamote",
            "notes_coeur": "Rose, Jasmin, Litchi, Mimosa",
            "notes_fond": "Patchouli, Vétiver, Vanille, Musc blanc",
            "concentration": "EDP",
            "actif": True,
            "mis_en_avant": True,
            "formats": [
                {"type_format": "decant_5", "contenance_ml": 5, "prix": 95, "stock": 20},
                {"type_format": "decant_10", "contenance_ml": 10, "prix": 170, "stock": 15},
                {"type_format": "complet", "contenance_ml": 100, "prix": 1600, "stock": 6},
            ],
        },
        {
            "nom": "Miss Dior",
            "marque": "Dior",
            "description": "Un bouquet de fleurs fraîches et lumineuses. Miss Dior est une déclaration d'amour à la vie.",
            "genre": "femme",
            "famille_olfactive": "florale",
            "notes_tete": "Rose de Grasse, Pivoine",
            "notes_coeur": "Iris, Muguet, Jasmin",
            "notes_fond": "Musc, Bois de rosier",
            "concentration": "EDP",
            "actif": True,
            "mis_en_avant": True,
            "formats": [
                {"type_format": "decant_5", "contenance_ml": 5, "prix": 85, "stock": 22},
                {"type_format": "decant_10", "contenance_ml": 10, "prix": 155, "stock": 18},
                {"type_format": "complet", "contenance_ml": 100, "prix": 1400, "stock": 7},
            ],
        },
        {
            "nom": "Baccarat Rouge 540",
            "marque": "Maison Francis Kurkdjian",
            "description": "Un parfum d'exception. Baccarat Rouge 540 est un joyau olfactif lumineux et cristallin, à la fois poétique et saisissant.",
            "genre": "mixte",
            "famille_olfactive": "orientale",
            "notes_tete": "Safran, Jasmin",
            "notes_coeur": "Ambre gris, Cèdre de Virginie",
            "notes_fond": "Bois de sapin, Musc, Caramel",
            "concentration": "EDP",
            "actif": True,
            "mis_en_avant": True,
            "formats": [
                {"type_format": "decant_5", "contenance_ml": 5, "prix": 180, "stock": 8},
                {"type_format": "decant_10", "contenance_ml": 10, "prix": 340, "stock": 6},
                {"type_format": "complet", "contenance_ml": 70, "prix": 4200, "stock": 2},
            ],
        },
        {
            "nom": "Terre d'Hermès",
            "marque": "Hermès",
            "description": "Un partage entre ciel et terre. Terre d'Hermès est une métaphore de la matière, un parfum tellurique et aérien.",
            "genre": "homme",
            "famille_olfactive": "boisee",
            "notes_tete": "Orange, Pamplemousse, Silex",
            "notes_coeur": "Poivre, Géranium, Patchouli",
            "notes_fond": "Cèdre, Benzoin, Vétiver",
            "concentration": "EDT",
            "actif": True,
            "mis_en_avant": False,
            "formats": [
                {"type_format": "decant_5", "contenance_ml": 5, "prix": 80, "stock": 18},
                {"type_format": "decant_10", "contenance_ml": 10, "prix": 140, "stock": 14},
                {"type_format": "complet", "contenance_ml": 100, "prix": 1200, "stock": 6},
            ],
        },
        {
            "nom": "Layton",
            "marque": "Parfums de Marly",
            "description": "Un parfum royal et opulent. Layton est un mélange magistral de notes épicées, florales et vanillées.",
            "genre": "homme",
            "famille_olfactive": "orientale",
            "notes_tete": "Pomme, Mandarine, Bergamote, Lavande",
            "notes_coeur": "Jasmin, Géranium, Violet",
            "notes_fond": "Vanille, Bois de santal, Caramel, Poivre, Guaiac",
            "concentration": "EDP",
            "actif": True,
            "mis_en_avant": True,
            "formats": [
                {"type_format": "decant_5", "contenance_ml": 5, "prix": 130, "stock": 10},
                {"type_format": "decant_10", "contenance_ml": 10, "prix": 240, "stock": 8},
                {"type_format": "complet", "contenance_ml": 125, "prix": 2900, "stock": 3},
            ],
        },
    ],
}


class Command(BaseCommand):
    help = 'Populate the database with sample perfume data'

    def handle(self, *args, **kwargs):
        self.stdout.write('🌱 Seeding database...')

        # Create superuser
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@parfum.ma', 'admin123')
            self.stdout.write(self.style.SUCCESS('✅ Admin user created (admin/admin123)'))

        # Create brands
        marques = {}
        for marque_data in SEED_DATA['marques']:
            marque, created = Marque.objects.get_or_create(
                nom=marque_data['nom'],
                defaults={'description': marque_data['description']},
            )
            marques[marque.nom] = marque
            if created:
                self.stdout.write(f'  ✅ Marque: {marque.nom}')

        # Create perfumes with formats
        for parfum_data in SEED_DATA['parfums']:
            formats_data = parfum_data.pop('formats')
            marque = marques[parfum_data.pop('marque')]

            parfum, created = Parfum.objects.get_or_create(
                nom=parfum_data['nom'],
                marque=marque,
                defaults=parfum_data,
            )

            if created:
                for fmt_data in formats_data:
                    Format.objects.create(parfum=parfum, **fmt_data)
                self.stdout.write(f'  🧴 Parfum: {parfum.nom} ({len(formats_data)} formats)')

        self.stdout.write(self.style.SUCCESS(f'\n🎉 Seeding complete! {Parfum.objects.count()} parfums in database.'))
