import os
import sys
import shutil
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'parfum_project.settings')
django.setup()

from catalog.models import Marque, Collection, Parfum, Format, ParfumImage
from orders.models import LigneCommande, Commande

def run():
    print("=== SEEDING AURA COLLECTION (GEL DOUCHE PARFUMÉ) ===")
    
    # 1. Prepare media directories and copy files
    base_dir = os.path.dirname(os.path.abspath(__file__))
    proj_root = os.path.dirname(base_dir)
    media_dir = os.path.join(base_dir, 'media')
    parfums_media = os.path.join(media_dir, 'parfums')
    logos_media = os.path.join(media_dir, 'logos')
    collections_media = os.path.join(media_dir, 'collections')
    
    os.makedirs(parfums_media, exist_ok=True)
    os.makedirs(logos_media, exist_ok=True)
    os.makedirs(collections_media, exist_ok=True)
    
    # Copy source images to media/
    file_mappings = {
        'gelparfumbleuchannel.jpeg': os.path.join(parfums_media, 'bleu-chanel.jpeg'),
        'gelparfumjadore.jpeg': os.path.join(parfums_media, 'jadore.jpeg'),
        'gelparfummademoiselle.jpeg': os.path.join(parfums_media, 'mademoiselle.jpeg'),
        'gelparfumsmyway.jpeg': os.path.join(parfums_media, 'my-way.jpeg'),
        'packde3.png': os.path.join(parfums_media, 'pack-de-3.png'),
        'packde4.jpeg': os.path.join(parfums_media, 'pack-de-4.jpeg'),
        'offredispo.jpeg': os.path.join(parfums_media, 'offredispo.jpeg'),
        'logo.jpeg': os.path.join(logos_media, 'logo.jpeg'),
    }
    
    for src_name, dest_path in file_mappings.items():
        src_path = os.path.join(proj_root, src_name)
        if os.path.exists(src_path):
            shutil.copy2(src_path, dest_path)
            print(f"Copied {src_name} -> {dest_path}")
            
    # Also copy to collections/
    shutil.copy2(os.path.join(parfums_media, 'bleu-chanel.jpeg'), os.path.join(collections_media, 'homme-gel.jpeg'))
    shutil.copy2(os.path.join(parfums_media, 'mademoiselle.jpeg'), os.path.join(collections_media, 'femme-gel.jpeg'))
    shutil.copy2(os.path.join(parfums_media, 'pack-de-3.png'), os.path.join(collections_media, 'packs-gel.png'))
    shutil.copy2(os.path.join(parfums_media, 'offredispo.jpeg'), os.path.join(collections_media, 'promos-gel.jpeg'))

    # 2. Clear old data
    print("Clearing old order lines and parfums...")
    LigneCommande.objects.all().delete()
    Format.objects.all().delete()
    ParfumImage.objects.all().delete()
    Parfum.objects.all().delete()
    Collection.objects.all().delete()
    Marque.objects.all().delete()
    
    # 3. Create Marque AURA COLLECTION
    marque = Marque.objects.create(
        nom='AURA COLLECTION',
        logo='logos/logo.jpeg',
        description='Maison Aura - Haute Parfumerie & Gels Douche Parfumés d\'Exception. Des formules soyeuses sans sulfates ni parabènes.',
        actif=True
    )
    print(f"Created Marque: {marque.nom}")
    
    # 4. Create the 3 primary collections + Promotions
    col_homme = Collection.objects.create(
        nom='Gel Parfum Homme',
        slug='gel-parfum-homme',
        description='Nos gels douche parfumés masculins aux notes boisées, fraîches et affirmées.',
        image='collections/homme-gel.jpeg',
        actif=True,
        ordre=1
    )
    col_femme = Collection.objects.create(
        nom='Gel Parfum Femme',
        slug='gel-parfum-femme',
        description='Des créations florales, orientales et sensuelles pour sublimer votre rituel de douche quotidien.',
        image='collections/femme-gel.jpeg',
        actif=True,
        ordre=2
    )
    col_packs = Collection.objects.create(
        nom='Packs Spéciaux',
        slug='packs-speciaux',
        description='Profitez de nos offres groupées exclusives : Pack de 3 à 239 DH et Pack Complet de 4 à 299 DH.',
        image='collections/packs-gel.png',
        actif=True,
        ordre=3
    )
    col_promo = Collection.objects.create(
        nom='Promotions',
        slug='promotions',
        description='Découvrez toutes nos offres promotionnelles et packs avantageux.',
        image='collections/promos-gel.jpeg',
        actif=True,
        ordre=4
    )
    print("Created Collections: Gel Parfum Homme, Gel Parfum Femme, Packs Spéciaux, Promotions")

    # 5. Create 4 Individual Products
    p_bleu = Parfum.objects.create(
        nom='Bleu de Chanel',
        marque=marque,
        genre='homme',
        famille_olfactive='boisee',
        notes_tete='Citron vert, Menthe fraîche, Poivre rose',
        notes_coeur='Lavande, Gingembre, Jasmin',
        notes_fond='Bois de cèdre, Santal, Ambre, Encens',
        concentration='gel',
        description='Gel douche parfumé de luxe 250ml inspiré de Bleu de Chanel. Une formule onctueuse 0% sulfates, 0% parabènes qui nettoie délicatement tout en laissant une empreinte boisée et aromatique irrésistible sur la peau.',
        photo_principale='parfums/bleu-chanel.jpeg',
        actif=True,
        mis_en_avant=True,
        is_pack=False,
        is_promo=False,
    )
    Format.objects.create(
        parfum=p_bleu,
        type_format='flacon_250',
        contenance_ml=250,
        prix=89.00,
        stock=50
    )
    p_bleu.collections.add(col_homme)

    p_mademoiselle = Parfum.objects.create(
        nom='Mademoiselle',
        marque=marque,
        genre='femme',
        famille_olfactive='orientale',
        notes_tete='Orange vive, Mandarine, Bergamote',
        notes_coeur='Rose de Mai, Jasmin délicat, Ylang-ylang',
        notes_fond='Patchouli noble, Vétiver, Vanille bourbon, Musc blanc',
        concentration='gel',
        description='Gel douche parfumé de luxe 250ml inspiré de Coco Mademoiselle. Une texture soyeuse qui se transforme en mousse aérienne pour révéler des accords chyprés et floraux envoûtants.',
        photo_principale='parfums/mademoiselle.jpeg',
        actif=True,
        mis_en_avant=True,
        is_pack=False,
        is_promo=False,
    )
    Format.objects.create(
        parfum=p_mademoiselle,
        type_format='flacon_250',
        contenance_ml=250,
        prix=89.00,
        stock=50
    )
    p_mademoiselle.collections.add(col_femme)

    p_jadore = Parfum.objects.create(
        nom="J'adore",
        marque=marque,
        genre='femme',
        famille_olfactive='florale',
        notes_tete='Mandarine d\'Italie, Poire juteuse, Melon, Pêche',
        notes_coeur='Ylang-ylang des Comores, Rose Damascena, Jasmin Sambac',
        notes_fond='Cèdre blanc, Mûre, Muscs précieux',
        concentration='gel',
        description="Gel douche parfumé d'exception 250ml inspiré de J'adore. Un bouquet floral sensuel et lumineux qui enveloppe le corps d'une caresse parfumée raffinée et satinée.",
        photo_principale='parfums/jadore.jpeg',
        actif=True,
        mis_en_avant=True,
        is_pack=False,
        is_promo=False,
    )
    Format.objects.create(
        parfum=p_jadore,
        type_format='flacon_250',
        contenance_ml=250,
        prix=89.00,
        stock=50
    )
    p_jadore.collections.add(col_femme)

    p_myway = Parfum.objects.create(
        nom='My Way',
        marque=marque,
        genre='femme',
        famille_olfactive='florale',
        notes_tete='Bergamote de Calabre, Fleur d\'oranger d\'Égypte',
        notes_coeur='Tubéreuse éclatante, Jasmin d\'Inde',
        notes_fond='Bois de cèdre de Virginie, Vanille de Madagascar, Musc blanc',
        concentration='gel',
        description='Gel douche parfumé 250ml inspiré de My Way. Une invitation au voyage avec ses notes lumineuses de fleurs blanches et vanille pour un rituel de douche ressourçant.',
        photo_principale='parfums/my-way.jpeg',
        actif=True,
        mis_en_avant=True,
        is_pack=False,
        is_promo=False,
    )
    Format.objects.create(
        parfum=p_myway,
        type_format='flacon_250',
        contenance_ml=250,
        prix=89.00,
        stock=50
    )
    p_myway.collections.add(col_femme)

    print("Created 4 Gel Douche products (89 DH / 250ml)")

    # 6. Create the 2 Packs
    # Pack 1: Pack Spécial de 3 Gels (239 DH au lieu de 267 DH)
    pack_3 = Parfum.objects.create(
        nom='Pack Spécial (3 Gels Parfumés)',
        marque=marque,
        genre='mixte',
        famille_olfactive='fraiche',
        concentration='gel',
        description='Pack Spécial 3 Gels Douche Parfumés (3 x 250ml). Offre exclusive à 239 DH au lieu de 267 DH. Choisissez 3 de vos fragrances préférées pour varier les plaisirs sous la douche !',
        photo_principale='parfums/pack-de-3.png',
        actif=True,
        mis_en_avant=True,
        is_pack=True,
        is_promo=True,
        prix_promo=239.00
    )
    Format.objects.create(
        parfum=pack_3,
        type_format='pack_3',
        contenance_ml=250,
        prix=267.00,
        prix_promo=239.00,
        stock=30
    )
    pack_3.parfums_inclus.set([p_mademoiselle, p_jadore, p_myway])
    pack_3.collections.add(col_packs, col_promo)

    # Pack 2: Pack Spécial de 4 Gels (299 DH au lieu de 356 DH) - Meilleure Offre
    pack_4 = Parfum.objects.create(
        nom='Pack Spécial (4 Gels Parfumés)',
        marque=marque,
        genre='mixte',
        famille_olfactive='fraiche',
        concentration='gel',
        description='La Meilleure Offre AURA COLLECTION : L\'intégralité des 4 Gels Douche Parfumés 250ml (Mademoiselle, J\'adore, My Way et Bleu de Chanel) pour seulement 299 DH au lieu de 356 DH. Économisez 57 DH !',
        photo_principale='parfums/pack-de-4.jpeg',
        actif=True,
        mis_en_avant=True,
        is_pack=True,
        is_promo=True,
        prix_promo=299.00
    )
    Format.objects.create(
        parfum=pack_4,
        type_format='pack_4',
        contenance_ml=250,
        prix=356.00,
        prix_promo=299.00,
        stock=30
    )
    pack_4.parfums_inclus.set([p_bleu, p_mademoiselle, p_jadore, p_myway])
    pack_4.collections.add(col_packs, col_promo)

    print("Created 2 Special Packs (Pack de 3 @ 239 DH, Pack de 4 @ 299 DH)")
    print("=== SEEDING COMPLETED SUCCESSFULLY ===")

if __name__ == '__main__':
    run()
