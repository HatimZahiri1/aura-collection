import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'parfum_project.settings')
django.setup()

from django.db import transaction
from django.utils import timezone
from datetime import timedelta
import random

from catalog.models import Marque, Collection, Parfum, Format, ParfumImage
from orders.models import Commande, LigneCommande

print("Début de l'initialisation des nouveaux parfums...")

with transaction.atomic():
    # 1. Nettoyage des anciennes commandes et anciens produits
    print("Suppression des anciennes données...")
    LigneCommande.objects.all().delete()
    Commande.objects.all().delete()
    ParfumImage.objects.all().delete()
    Format.objects.all().delete()
    Parfum.objects.all().delete()

    # 2. Création ou mise à jour des marques
    marques_data = {
        'Dior': 'Maison de haute couture et parfumerie d’exception française.',
        'Jean Paul Gaultier': 'L’enfant terrible de la mode française aux créations olfactives iconiques.',
        'Emporio Armani': 'L’élégance italienne moderne, sensuelle et passionnée.',
        'Valentino': 'Haute couture italienne alliant tradition romaine et modernité audacieuse.',
        'Viktor & Rolf': 'Maison avant-gardiste créatrice de sillages explosifs et addictifs.',
        'Yves Saint Laurent': 'L’audace, l’élégance et la liberté parisienne incarnées.',
        'Lattafa': 'Maison émiratie prestigieuse renommée pour ses sillages orientaux riches et envoûtants.',
        'Parfums de Marly': 'Haute parfumerie française inspirée de la splendeur du XVIIIe siècle.',
        'Carolina Herrera': 'Le raffinement new-yorkais intemporel et glamour.',
        'Givenchy': 'L’élégance aristocratique française et la séduction haute couture.',
        'Narciso Rodriguez': 'Le maître new-yorkais du musc pur et de la sensualité épurée.',
        'Luxury Fragrance': 'Nos coffrets cadeaux et packs découverte exclusifs.',
    }

    marques = {}
    for nom, desc in marques_data.items():
        m, _ = Marque.objects.update_or_create(
            nom=nom,
            defaults={'description': desc, 'actif': True}
        )
        marques[nom] = m

    # 3. Création ou mise à jour des 5 collections
    collections_data = [
        ('parfums-homme', 'Parfums Homme', 'Haute parfumerie masculine et sillages intenses.', 1),
        ('parfums-femme', 'Parfums Femme', 'Fragrances d’exception, florales, ambrées et sensuelles.', 2),
        ('promotions', 'Promotions', 'Nos offres exclusives et remises exceptionnelles du moment.', 3),
        ('packs-speciaux', 'Packs Spéciaux', 'Nos coffrets cadeaux et sélections de décants sur-mesure.', 4),
        ('parfums-unisexe', 'Parfums Unisexe', 'Créations prestigieuses mixtes et intemporelles.', 5),
    ]

    collections = {}
    for slug, nom, desc, ordre in collections_data:
        c, _ = Collection.objects.update_or_create(
            slug=slug,
            defaults={'nom': nom, 'description': desc, 'ordre': ordre, 'actif': True}
        )
        collections[slug] = c

    # 4. Liste complète et détaillée des NOUVEAUX PARFUMS avec les photos fournies
    parfums_data = [
        # ==================== PARFUMS HOMME (10 Parfums) ====================
        {
            'nom': 'Sauvage Elixir',
            'marque': 'Dior',
            'genre': 'homme',
            'famille_olfactive': 'boisee',
            'concentration': 'extrait',
            'description': 'Une fragrance extraordinairement concentrée et enivrante. L\'iconique fraîcheur de Sauvage est sublimée par un cœur d\'épices envoûtantes, une essence de lavande noble sur mesure et un riche assemblage de bois liquoreux.',
            'notes_tete': 'Pamplemousse, Cardamome, Cannelle, Noix de muscade',
            'notes_coeur': 'Essence de Lavande de Nyons sur mesure',
            'notes_fond': 'Ambre précieux, Bois de santal, Patchouli, Réglisse, Vétiver d\'Haïti',
            'photo': 'parfums/sauvage.jpeg',
            'mis_en_avant': True,
            'is_promo': False,
            'prix_promo': None,
            'formats': [
                ('decant_5', 5, 85, 25, 75),
                ('decant_10', 10, 160, 30, 140),
                ('complet', 100, 890, 10, None),
            ]
        },
        {
            'nom': 'Le Male Elixir',
            'marque': 'Jean Paul Gaultier',
            'genre': 'homme',
            'famille_olfactive': 'orientale',
            'concentration': 'EDP',
            'description': 'Un boisé aromatique ambré incandescent. Le marin emblématique s\'enflamme d\'une sensualité brûlante sur un torse doré sculpté de rayures brunes, laissant un sillage torride et irrésistible.',
            'notes_tete': 'Lavande noble, Menthe fraîche vivifiante',
            'notes_coeur': 'Vanille chaleureuse, Résine de Benjoin',
            'notes_fond': 'Miel doré, Fève tonka torréfiée, Accord Tabac blond',
            'photo': 'parfums/elexir.jpeg',
            'mis_en_avant': True,
            'is_promo': True,
            'prix_promo': 690,
            'formats': [
                ('decant_5', 5, 75, 20, 65),
                ('decant_10', 10, 140, 25, 120),
                ('complet', 125, 780, 8, 690),
            ]
        },
        {
            'nom': 'Le Beau Le Parfum',
            'marque': 'Jean Paul Gaultier',
            'genre': 'homme',
            'famille_olfactive': 'boisee',
            'concentration': 'EDP',
            'description': 'Le parfum d\'un jardin d\'Éden tentateur et ultra sensuel. Une alliance boisée orientale captivante où la fraîcheur du gingembre rencontre l\'addiction de la fève tonka et la douceur solaire du bois de coco.',
            'notes_tete': 'Ananas juteux, Iris délicat, Cyprès, Gingembre frais',
            'notes_coeur': 'Noix de coco crémeuse, Notes boisées nobles',
            'notes_fond': 'Fève tonka, Bois de santal, Ambre sensuel, Ambre gris',
            'photo': 'parfums/lebeau.jpeg',
            'mis_en_avant': False,
            'is_promo': False,
            'prix_promo': None,
            'formats': [
                ('decant_5', 5, 75, 18),
                ('decant_10', 10, 140, 22),
                ('complet', 125, 750, 7),
            ]
        },
        {
            'nom': 'Scandal Pour Homme',
            'marque': 'Jean Paul Gaultier',
            'genre': 'homme',
            'famille_olfactive': 'orientale',
            'concentration': 'EDT',
            'description': 'L\'élégance musclée coiffée d\'une couronne en or triomphante. Un coup de poing olfactif énergisant et addictif aux accords gourmands de caramel brun contrastant avec le vétiver chaud et la sauge.',
            'notes_tete': 'Sauge sclarée aromatique, Mandarine juteuse',
            'notes_coeur': 'Caramel brun gourmand, Fève tonka',
            'notes_fond': 'Vétiver terreux, Bois de cèdre noble',
            'photo': 'parfums/scandalhomme.jpeg',
            'mis_en_avant': False,
            'is_promo': False,
            'prix_promo': None,
            'formats': [
                ('decant_5', 5, 70, 15),
                ('decant_10', 10, 130, 20),
                ('complet', 100, 720, 6),
            ]
        },
        {
            'nom': 'Stronger With You Intensely',
            'marque': 'Emporio Armani',
            'genre': 'homme',
            'famille_olfactive': 'fougere',
            'concentration': 'EDP',
            'description': 'Une fragrance vibrante et audacieuse célébrant l\'amour passionné. Un sillage puissant associant l\'énergie des épices à la douceur addictive d\'un accord marron glacé et de vanille veloutée.',
            'notes_tete': 'Poivre rose épicé, Baies de genièvre, Violette',
            'notes_coeur': 'Lavande douce, Sauge, Caramel croquant, Cannelle',
            'notes_fond': 'Vanille de Madagascar, Daim velouté, Ambre, Fève tonka',
            'photo': 'parfums/stronger.jpeg',
            'mis_en_avant': True,
            'is_promo': False,
            'prix_promo': None,
            'formats': [
                ('decant_5', 5, 70, 20, None),
                ('decant_10', 10, 130, 28, 115),
                ('complet', 100, 740, 9, 680),
            ]
        },
        {
            'nom': 'Stronger With You Absolutely',
            'marque': 'Emporio Armani',
            'genre': 'homme',
            'famille_olfactive': 'orientale',
            'concentration': 'EDP',
            'description': 'L\'incarnation de l\'amour absolu et irrésistible. Une eau de parfum raffinée enrichie d\'un accord rhum ambré envoûtant, de lavande française noble et d\'une touche fumée de bois de cèdre.',
            'notes_tete': 'Accord Rhum ambré, Élémi subtil, Bergamote fraîche',
            'notes_coeur': 'Lavande diva de France, Essence de Davana',
            'notes_fond': 'Châtaigne glacée, Vanille de Madagascar, Bois de cèdre, Patchouli',
            'photo': 'parfums/absolutely.jpeg',
            'mis_en_avant': False,
            'is_promo': False,
            'prix_promo': None,
            'formats': [
                ('decant_5', 5, 75, 18),
                ('decant_10', 10, 140, 24),
                ('complet', 100, 780, 8),
            ]
        },
        {
            'nom': 'Born in Roma Intense Uomo',
            'marque': 'Valentino',
            'genre': 'homme',
            'famille_olfactive': 'fougere',
            'concentration': 'EDP',
            'description': 'Un hommage vibrant à la nuit romaine et à la haute couture. Cette fragrance ambrée et fougère intensifie le magnétisme du vétiver fumé avec une infusion de vanille bourbon opulente.',
            'notes_tete': 'Vanille Bourbon riche, Bergamote de Calabre pétillante',
            'notes_coeur': 'Cœur de Lavandin aromatique noble',
            'notes_fond': 'Vétiver fumé d\'Haïti, Résine ambrée',
            'photo': 'parfums/valentino.jpeg',
            'mis_en_avant': True,
            'is_promo': False,
            'prix_promo': None,
            'formats': [
                ('decant_5', 5, 80, 22),
                ('decant_10', 10, 150, 30),
                ('complet', 100, 820, 11),
            ]
        },
        {
            'nom': 'Spicebomb Extreme',
            'marque': 'Viktor & Rolf',
            'genre': 'homme',
            'famille_olfactive': 'orientale',
            'concentration': 'EDP',
            'description': 'Une grenade explosive d\'intensité et de sensualité masculine. Les épices ardentes s\'enflamment avec la vanille noire et un accord tabac captivant pour un sillage d\'une tenue remarquable.',
            'notes_tete': 'Poivre noir ardent, Pamplemousse vif',
            'notes_coeur': 'Safran précieux, Cannelle chaude, Cumin',
            'notes_fond': 'Tabac blond, Vanille Bourbon noire, Ambre intense',
            'photo': 'parfums/spicy.jpeg',
            'mis_en_avant': False,
            'is_promo': False,
            'prix_promo': None,
            'formats': [
                ('decant_5', 5, 80, 16),
                ('decant_10', 10, 150, 20),
                ('complet', 90, 790, 7),
            ]
        },
        {
            'nom': 'Y Eau de Parfum',
            'marque': 'Yves Saint Laurent',
            'genre': 'homme',
            'famille_olfactive': 'fougere',
            'concentration': 'EDP',
            'description': 'Le parfum des hommes accomplis et déterminés. Un contraste éclatant et audacieux entre la fraîcheur vive de la sauge et de la pomme croquante, et l\'intensité raffinée des bois ambrés.',
            'notes_tete': 'Pomme croquante, Bergamote fraîche, Gingembre piquant',
            'notes_coeur': 'Sauge blanche aromatique, Baie de genièvre, Géranium',
            'notes_fond': 'Bois ambrés profonds, Fève tonka, Oliban, Cèdre',
            'photo': 'parfums/ysaintlaurant.jpeg',
            'mis_en_avant': True,
            'is_promo': False,
            'prix_promo': None,
            'formats': [
                ('decant_5', 5, 75, 25),
                ('decant_10', 10, 140, 35),
                ('complet', 100, 790, 12),
            ]
        },
        {
            'nom': 'Asad Eau de Parfum',
            'marque': 'Lattafa',
            'genre': 'homme',
            'famille_olfactive': 'orientale',
            'concentration': 'EDP',
            'description': 'Une signature orientale intense, chaleureuse et majestueuse. Reconnu mondialement pour sa tenue exceptionnelle et son sillage puissant de café torréfié, tabac épicé et bois précieux.',
            'notes_tete': 'Poivre noir étincelant, Ananas mûr, Tabac doux',
            'notes_coeur': 'Café torréfié gourmand, Patchouli d\'Indonésie, Iris poudré',
            'notes_fond': 'Ambre chaud, Vanille douce, Bois de santal, Benjoin',
            'photo': 'parfums/asad.jpeg',
            'mis_en_avant': False,
            'is_promo': False,
            'prix_promo': None,
            'formats': [
                ('decant_5', 5, 45, 30),
                ('decant_10', 10, 80, 40),
                ('complet', 100, 380, 15),
            ]
        },

        # ==================== PARFUMS FEMME (9 Parfums) ====================
        {
            'nom': 'Delina Royal Essence',
            'marque': 'Parfums de Marly',
            'genre': 'femme',
            'famille_olfactive': 'florale',
            'concentration': 'EDP',
            'description': 'Le chef-d\'œuvre floral sensuel par excellence de la haute parfumerie. Un bouquet somptueux dominé par la rose turque, la pivoine veloutée et la douceur fruitée du litchi, enveloppé de vanille et de cachemire.',
            'notes_tete': 'Litchi frais, Rhubarbe acidulée, Bergamote, Noix de muscade',
            'notes_coeur': 'Rose de Turquie royale, Pivoine veloutée, Musc blanc, Pétalia',
            'notes_fond': 'Vanille onctueuse, Bois de cachemire, Cèdre, Encens mystique',
            'photo': 'parfums/demarly.jpeg',
            'mis_en_avant': True,
            'is_promo': False,
            'prix_promo': None,
            'formats': [
                ('decant_5', 5, 110, 15, 95),
                ('decant_10', 10, 210, 20, 185),
                ('complet', 75, 1250, 5, None),
            ]
        },
        {
            'nom': 'Libre Eau de Parfum',
            'marque': 'Yves Saint Laurent',
            'genre': 'femme',
            'famille_olfactive': 'florale',
            'concentration': 'EDP',
            'description': 'Le parfum d\'une femme forte, libre et audacieuse. La tension sensuelle entre la fleur d\'oranger brûlante du Maroc et l\'audace rafraîchissante d\'une lavande de France au féminin.',
            'notes_tete': 'Essence de Mandarine, Néroli vif, Lavande diva',
            'notes_coeur': 'Absolue de Fleur d\'oranger du Maroc, Jasmin Sambac',
            'notes_fond': 'Extrait de Vanille de Madagascar, Bois de cèdre, Muscs blancs, Ambre',
            'photo': 'parfums/libre.jpeg',
            'mis_en_avant': True,
            'is_promo': False,
            'prix_promo': None,
            'formats': [
                ('decant_5', 5, 80, 25),
                ('decant_10', 10, 150, 32),
                ('complet', 90, 850, 10),
            ]
        },
        {
            'nom': 'Good Girl Eau de Parfum',
            'marque': 'Carolina Herrera',
            'genre': 'femme',
            'famille_olfactive': 'orientale',
            'concentration': 'EDP',
            'description': 'L\'iconique escarpin de luxe qui magnifie la dualité féminine. La fraîcheur éclatante de la tubéreuse et du jasmin blanc se heurte à la séduction sombre et gourmande de la fève tonka et du cacao.',
            'notes_tete': 'Amande douce, Café torréfié, Bergamote, Citron',
            'notes_coeur': 'Tubéreuse d\'Inde charnelle, Jasmin Sambac, Fleur d\'oranger, Iris',
            'notes_fond': 'Fève tonka torréfiée, Cacao noir, Vanille Bourbon, Praline, Santal',
            'photo': 'parfums/goodgirl.jpeg',
            'mis_en_avant': True,
            'is_promo': True,
            'prix_promo': 740,
            'formats': [
                ('decant_5', 5, 80, 20, 70),
                ('decant_10', 10, 150, 28, 130),
                ('complet', 80, 820, 9, 740),
            ]
        },
        {
            'nom': 'Miss Dior Eau de Parfum',
            'marque': 'Dior',
            'genre': 'femme',
            'famille_olfactive': 'florale',
            'concentration': 'EDP',
            'description': 'Un souffle d\'optimisme et d\'amour fleuri. Un bouquet éclatant aux mille fleurs colorées : la rose Centifolia brodée de muguet frais, de pivoine abricotée et enveloppée de bois tendres.',
            'notes_tete': 'Muguet frais, Pivoine éclatante, Iris noble',
            'notes_coeur': 'Rose Centifolia de Grasse voluptueuse, Pêche veloutée',
            'notes_fond': 'Muscs blancs soyeux, Vanille de Papouasie, Benjoin, Bois de santal',
            'photo': 'parfums/missdior.jpeg',
            'mis_en_avant': False,
            'is_promo': False,
            'prix_promo': None,
            'formats': [
                ('decant_5', 5, 80, 22),
                ('decant_10', 10, 150, 26),
                ('complet', 100, 850, 8),
            ]
        },
        {
            'nom': 'L\'Interdit Rouge Ultime',
            'marque': 'Givenchy',
            'genre': 'femme',
            'famille_olfactive': 'florale',
            'concentration': 'EDP',
            'description': 'Le frisson de l\'interdit poussé à son paroxysme. Une fleur blanche charnelle hypnotisée par l\'ardeur d\'une coque de cacao tiède et d\'un patchouli ténébreux d\'une rare élégance.',
            'notes_tete': 'Fleur d\'oranger éclatante, Néroli de Tunisie, Jasmin Sambac',
            'notes_coeur': 'Tubéreuse charnelle, Écorce de fève de cacao tiède',
            'notes_fond': 'Cœur de Patchouli d\'Indonésie, Bois de santal, Vétiver, Ambroxan',
            'photo': 'parfums/interdit.jpeg',
            'mis_en_avant': False,
            'is_promo': False,
            'prix_promo': None,
            'formats': [
                ('decant_5', 5, 80, 18),
                ('decant_10', 10, 150, 24),
                ('complet', 80, 840, 7),
            ]
        },
        {
            'nom': 'La Belle Le Parfum',
            'marque': 'Jean Paul Gaultier',
            'genre': 'femme',
            'famille_olfactive': 'gourmande',
            'concentration': 'EDP',
            'description': 'Le fruit défendu dans toute sa splendeur voluptueuse. Une poire juteuse et dorée sublimée par la volupté d\'une vanille charnelle et la profondeur liquoreuse de la fève tonka.',
            'notes_tete': 'Poire vanillée caramélisée ultra gourmande',
            'notes_coeur': 'Fève tonka torréfiée, Jasmin blanc',
            'notes_fond': 'Vanille noire opulente, Ambre chaud velouté',
            'photo': 'parfums/labelle.jpeg',
            'mis_en_avant': False,
            'is_promo': False,
            'prix_promo': None,
            'formats': [
                ('decant_5', 5, 75, 20),
                ('decant_10', 10, 140, 25),
                ('complet', 100, 790, 8),
            ]
        },
        {
            'nom': 'Scandal Le Parfum Pour Femme',
            'marque': 'Jean Paul Gaultier',
            'genre': 'femme',
            'famille_olfactive': 'orientale',
            'concentration': 'EDP',
            'description': 'Osez le scandale absolu avec ce parfum rouge passion. Un floral ambré incandescent où le jasmin envoûtant s\'associe au caramel au beurre salé et à une vanille noire étourdissante.',
            'notes_tete': 'Jasmin éclatant et solaire',
            'notes_coeur': 'Caramel au beurre salé fondant',
            'notes_fond': 'Gousse de Vanille noire, Fève tonka',
            'photo': 'parfums/scandalfemme.jpeg',
            'mis_en_avant': False,
            'is_promo': False,
            'prix_promo': None,
            'formats': [
                ('decant_5', 5, 75, 19),
                ('decant_10', 10, 140, 23),
                ('complet', 80, 790, 7),
            ]
        },
        {
            'nom': 'Donna Born in Roma Intense',
            'marque': 'Valentino',
            'genre': 'femme',
            'famille_olfactive': 'florale',
            'concentration': 'EDP',
            'description': 'L\'intensité de la nuit romaine sculptée dans le verre à picots Valentino. Une vanille bourbon magnétique magnifiée par un trio de jasmins lumineux et une résine de benjoin chaleureuse.',
            'notes_tete': 'Vanille Bourbon opulente, Bergamote fraîche',
            'notes_coeur': 'Trio de Jasmins précieux (Jasmin grandiflorum)',
            'notes_fond': 'Résine de Benjoin ambrée, Muscs sensuels soyeux',
            'photo': 'parfums/valentinofemme.jpeg',
            'mis_en_avant': False,
            'is_promo': False,
            'prix_promo': None,
            'formats': [
                ('decant_5', 5, 80, 18),
                ('decant_10', 10, 150, 25),
                ('complet', 100, 850, 8),
            ]
        },
        {
            'nom': 'Narciso Eau de Parfum Cristal',
            'marque': 'Narciso Rodriguez',
            'genre': 'femme',
            'famille_olfactive': 'musquee',
            'concentration': 'EDP',
            'description': 'Une sensualité pure, intime et lumineuse. Un cœur de musc blanc emblématique enluminé de pétales de rose, de fleurs blanches délicates et de bois de cèdre soyeux.',
            'notes_tete': 'Freesia délicat, Fleur d\'oranger, Bergamote',
            'notes_coeur': 'Cœur de Musc signature, Rose éclatante, Jasmin',
            'notes_fond': 'Bois de cèdre blanc, Bois de cachemire, Benjoin, Ambre',
            'photo': 'parfums/narciso.jpeg',
            'mis_en_avant': False,
            'is_promo': False,
            'prix_promo': None,
            'formats': [
                ('decant_5', 5, 70, 20),
                ('decant_10', 10, 130, 25),
                ('complet', 90, 760, 9),
            ]
        },
    ]

    created_parfums = {}
    for p_info in parfums_data:
        parfum = Parfum.objects.create(
            nom=p_info['nom'],
            marque=marques[p_info['marque']],
            genre=p_info['genre'],
            famille_olfactive=p_info['famille_olfactive'],
            concentration=p_info['concentration'],
            description=p_info['description'],
            notes_tete=p_info['notes_tete'],
            notes_coeur=p_info['notes_coeur'],
            notes_fond=p_info['notes_fond'],
            photo_principale=p_info['photo'],
            mis_en_avant=p_info['mis_en_avant'],
            is_promo=p_info['is_promo'],
            prix_promo=p_info['prix_promo'],
            actif=True
        )

        # Création des formats (avec prix_promo par format si défini)
        for fmt_item in p_info['formats']:
            if len(fmt_item) == 5:
                type_fmt, ml, prix, stock, p_promo = fmt_item
            else:
                type_fmt, ml, prix, stock = fmt_item
                p_promo = None
            Format.objects.create(
                parfum=parfum,
                type_format=type_fmt,
                contenance_ml=ml,
                prix=prix,
                prix_promo=p_promo,
                stock=stock
            )

        parfum.sync_collections()
        created_parfums[parfum.nom] = parfum
        print(f"-> Parfum créé : [{parfum.genre.upper()}] {parfum.marque.nom} - {parfum.nom}")

    # 5. Création des PACKS SPÉCIAUX (Coffrets sur-mesure combinant ces nouveaux parfums)
    print("Création des Packs Spéciaux...")
    pack_homme = Parfum.objects.create(
        nom='Coffret Trio Prestige Homme (10ml)',
        marque=marques['Luxury Fragrance'],
        genre='homme',
        famille_olfactive='boisee',
        concentration='EDP',
        description='Notre sélection ultime des 3 plus grands chefs-d\'œuvre masculins en décants vaporisateurs 10ml : Sauvage Elixir, Le Male Elixir et Y Eau de Parfum. Idéal pour varier les sillages selon vos occasions.',
        photo_principale='parfums/lemale.jpeg',
        is_pack=True,
        is_promo=True,
        prix_promo=390,
        mis_en_avant=True,
        actif=True
    )
    Format.objects.create(parfum=pack_homme, type_format='decant_10', contenance_ml=30, prix=440, prix_promo=390, stock=20)
    pack_homme.parfums_inclus.set([
        created_parfums['Sauvage Elixir'],
        created_parfums['Le Male Elixir'],
        created_parfums['Y Eau de Parfum'],
    ])
    pack_homme.sync_collections()
    print("-> Pack créé : Coffret Trio Prestige Homme")

    pack_femme = Parfum.objects.create(
        nom='Coffret Duo Élégance Femme (10ml)',
        marque=marques['Luxury Fragrance'],
        genre='femme',
        famille_olfactive='florale',
        concentration='EDP',
        description='L\'alliance de la haute séduction féminine : deux flacons 10ml nomades comprenant le somptueux Delina Royal Essence de Parfums de Marly et l\'irrésistible Good Girl de Carolina Herrera.',
        photo_principale='parfums/goodgirl.jpeg',
        is_pack=True,
        is_promo=True,
        prix_promo=340,
        mis_en_avant=True,
        actif=True
    )
    Format.objects.create(parfum=pack_femme, type_format='decant_10', contenance_ml=20, prix=360, prix_promo=340, stock=15)
    pack_femme.parfums_inclus.set([
        created_parfums['Delina Royal Essence'],
        created_parfums['Good Girl Eau de Parfum'],
    ])
    pack_femme.sync_collections()
    print("-> Pack créé : Coffret Duo Élégance Femme")

    # 6. Recréation de commandes d'exemple récentes pour le tableau de bord et les filtres (Jour, Semaine, Mois)
    print("Génération de commandes récentes d'exemple...")
    now = timezone.now()
    formats_homme = list(Format.objects.filter(parfum__genre='homme'))
    formats_femme = list(Format.objects.filter(parfum__genre='femme'))

    clients = [
        ('Yassine Benjelloun', '0661234567', 'Boulevard d\'Anfa', 'Casablanca', 'livree', 6),
        ('Sara El Amrani', '0662345678', 'Avenue Mohammed V', 'Rabat', 'livree', 5),
        ('Mehdi Tazi', '0663456789', 'Quartier Guéliz', 'Marrakech', 'confirmee', 4),
        ('Fatima Zahra Mansouri', '0664567890', 'Malabata', 'Tanger', 'en_livraison', 3),
        ('Omar Chraibi', '0665678901', 'Quartier Racine', 'Casablanca', 'confirmee', 2),
        ('Houda Berrada', '0666789012', 'Agdal', 'Rabat', 'en_attente', 1),
        ('Amine Alaoui', '0667890123', 'Bourgogne', 'Casablanca', 'en_attente', 0),
        ('Kenza Kabbaj', '0668901234', 'Hivernage', 'Marrakech', 'en_attente', 0),
    ]

    for nom_client, tel, adr, ville, statut, days_ago in clients:
        created_date = now - timedelta(days=days_ago, hours=random.randint(1, 8), minutes=random.randint(5, 50))
        commande = Commande.objects.create(
            nom_client=nom_client,
            telephone=tel,
            adresse=adr,
            ville=ville,
            frais_livraison=0 if ville == 'Casablanca' else 20,
            statut=statut,
            total=0
        )
        Commande.objects.filter(id=commande.id).update(created_at=created_date)

        # Ajouter 1 ou 2 lignes de commande
        sample_fmts = random.sample(formats_homme + formats_femme, 2)
        total_cmd = 0
        for fmt in sample_fmts:
            eff_prix = float(fmt.parfum.prix_promo) if (fmt.parfum.is_promo and fmt.type_format == 'complet') else float(fmt.prix)
            LigneCommande.objects.create(
                commande=commande,
                format=fmt,
                quantite=1,
                prix_unitaire=eff_prix
            )
            total_cmd += eff_prix

        total_cmd += float(commande.frais_livraison)
        commande.total = total_cmd
        commande.save(update_fields=['total'])

    print("Initialisation terminée avec succès !")
    print(f"Total Parfums créés : {Parfum.objects.count()}")
    print(f"Total Parfums Homme : {Parfum.objects.filter(genre='homme', is_pack=False).count()}")
    print(f"Total Parfums Femme : {Parfum.objects.filter(genre='femme', is_pack=False).count()}")
    print(f"Total Packs Spéciaux : {Parfum.objects.filter(is_pack=True).count()}")
    print(f"Total Formats : {Format.objects.count()}")
    print(f"Total Commandes de test : {Commande.objects.count()}")
