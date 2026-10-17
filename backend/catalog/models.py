from django.db import models


class Marque(models.Model):
    nom = models.CharField(max_length=200, unique=True)
    logo = models.ImageField(upload_to='marques/', blank=True, null=True)
    description = models.TextField(blank=True)
    actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nom']
        verbose_name = 'Marque'
        verbose_name_plural = 'Marques'

    def __str__(self):
        return self.nom


class Collection(models.Model):
    nom = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='collections/', blank=True, null=True)
    actif = models.BooleanField(default=True)
    ordre = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['ordre', 'nom']
        verbose_name = 'Collection'
        verbose_name_plural = 'Collections'

    def __str__(self):
        return self.nom


class Parfum(models.Model):
    GENRE_CHOICES = [
        ('homme', 'Homme'),
        ('femme', 'Femme'),
        ('mixte', 'Mixte'),
    ]

    CONCENTRATION_CHOICES = [
        ('gel', 'Gel Douche Parfumé'),
        ('EDP', 'Eau de Parfum'),
        ('EDT', 'Eau de Toilette'),
        ('extrait', 'Extrait de Parfum'),
        ('cologne', 'Eau de Cologne'),
    ]

    FAMILLE_CHOICES = [
        ('boisee', 'Boisée'),
        ('florale', 'Florale'),
        ('orientale', 'Orientale'),
        ('fraiche', 'Fraîche'),
        ('aromatique', 'Aromatique'),
        ('chypree', 'Chyprée'),
        ('fougere', 'Fougère'),
        ('gourmande', 'Gourmande'),
        ('cuiree', 'Cuirée'),
        ('musquee', 'Musquée'),
    ]

    nom = models.CharField(max_length=300)
    marque = models.ForeignKey(Marque, on_delete=models.CASCADE, related_name='parfums')
    collections = models.ManyToManyField(Collection, blank=True, related_name='parfums')
    description = models.TextField(blank=True)
    genre = models.CharField(max_length=10, choices=GENRE_CHOICES)
    famille_olfactive = models.CharField(max_length=20, choices=FAMILLE_CHOICES)
    notes_tete = models.CharField(max_length=500, blank=True, help_text='Notes de tête, séparées par des virgules')
    notes_coeur = models.CharField(max_length=500, blank=True, help_text='Notes de cœur, séparées par des virgules')
    notes_fond = models.CharField(max_length=500, blank=True, help_text='Notes de fond, séparées par des virgules')
    concentration = models.CharField(max_length=10, choices=CONCENTRATION_CHOICES)
    photo_principale = models.ImageField(upload_to='parfums/', blank=True, null=True)
    actif = models.BooleanField(default=True)
    mis_en_avant = models.BooleanField(default=False, help_text='Mettre en avant sur la page d\'accueil')
    is_pack = models.BooleanField(default=False, help_text='Pack spécial / Coffret')
    parfums_inclus = models.ManyToManyField('self', blank=True, symmetrical=False, related_name='inclus_dans_packs', help_text='Parfums inclus dans ce pack spécial')
    is_promo = models.BooleanField(default=False, help_text='Produit en promotion')
    prix_promo = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text='Prix promo en MAD')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Parfum'
        verbose_name_plural = 'Parfums'

    def __str__(self):
        return f"{self.marque.nom} - {self.nom}"

    @property
    def prix_min(self):
        """Retourne le prix minimum parmi les formats disponibles (en tenant compte des promotions)."""
        formats = self.formats.filter(stock__gt=0)
        if formats.exists():
            prix_list = [f.prix_effectif for f in formats if f.prix_effectif is not None]
            return min(prix_list) if prix_list else None
        return None

    @property
    def has_promo(self):
        """Indique si le parfum ou au moins un de ses formats est en promo."""
        if self.is_promo:
            return True
        return self.formats.filter(prix_promo__isnull=False, prix_promo__gt=0).exists()

    @property
    def en_stock(self):
        """Vérifie si au moins un format est en stock."""
        return self.formats.filter(stock__gt=0).exists()

    def sync_collections(self):
        """Synchronise automatiquement les relations M2M des collections avec le statut du produit."""
        if not self.pk:
            return

        # 1. Collection Promotions
        try:
            promo_col = Collection.objects.filter(slug='promotions').first()
            if not promo_col:
                promo_col = Collection.objects.create(nom='Promotions', slug='promotions', ordre=4)
            if self.is_promo or self.formats.filter(prix_promo__isnull=False, prix_promo__gt=0).exists():
                self.collections.add(promo_col)
            else:
                self.collections.remove(promo_col)
        except Exception:
            pass

        # 2. Collection Packs Spéciaux
        try:
            pack_col = Collection.objects.filter(slug='packs-speciaux').first()
            if not pack_col:
                pack_col = Collection.objects.create(nom='Packs Spéciaux', slug='packs-speciaux', ordre=5)
            if self.is_pack:
                self.collections.add(pack_col)
            else:
                self.collections.remove(pack_col)
        except Exception:
            pass

        # 3. Collections par Genre (pour les parfums individuels)
        try:
            homme_col = Collection.objects.filter(slug__in=['gel-parfum-homme', 'parfums-homme']).first()
            femme_col = Collection.objects.filter(slug__in=['gel-parfum-femme', 'parfums-femme']).first()
            unisexe_col = Collection.objects.filter(slug='parfums-unisexe').first()

            if self.is_pack:
                if homme_col:
                    self.collections.remove(homme_col)
                if femme_col:
                    self.collections.remove(femme_col)
                if unisexe_col:
                    self.collections.remove(unisexe_col)
            else:
                if self.genre == 'homme':
                    if homme_col:
                        self.collections.add(homme_col)
                    if femme_col:
                        self.collections.remove(femme_col)
                    if unisexe_col:
                        self.collections.remove(unisexe_col)
                elif self.genre == 'femme':
                    if femme_col:
                        self.collections.add(femme_col)
                    if homme_col:
                        self.collections.remove(homme_col)
                    if unisexe_col:
                        self.collections.remove(unisexe_col)
                elif self.genre == 'mixte':
                    if unisexe_col:
                        self.collections.add(unisexe_col)
                    if homme_col:
                        self.collections.remove(homme_col)
                    if femme_col:
                        self.collections.remove(femme_col)
        except Exception:
            pass

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.sync_collections()


class Format(models.Model):
    TYPE_CHOICES = [
        ('flacon_250', 'Flacon 250ml'),
        ('pack_3', 'Pack de 3 Gels (250ml)'),
        ('pack_4', 'Pack de 4 Gels (250ml)'),
        ('complet', 'Flacon Complet 250ml'),
        ('decant_10', 'Format 10ml'),
        ('decant_5', 'Format 5ml'),
    ]

    parfum = models.ForeignKey(Parfum, on_delete=models.CASCADE, related_name='formats')
    type_format = models.CharField(max_length=20, choices=TYPE_CHOICES)
    contenance_ml = models.PositiveIntegerField(help_text='Contenance en ml')
    prix = models.DecimalField(max_digits=10, decimal_places=2, help_text='Prix normal en MAD')
    prix_promo = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text='Prix promotionnel en MAD pour ce format')
    stock = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['contenance_ml']
        verbose_name = 'Format'
        verbose_name_plural = 'Formats'
        unique_together = ['parfum', 'type_format']

    def __str__(self):
        return f"{self.parfum.nom} - {self.get_type_format_display()} ({self.contenance_ml}ml)"

    @property
    def prix_effectif(self):
        if self.prix_promo and self.prix_promo > 0:
            return self.prix_promo
        return self.prix

    @property
    def en_promo(self):
        return bool(self.prix_promo and self.prix_promo > 0 and self.prix_promo < self.prix)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.parfum:
            self.parfum.sync_collections()


class ParfumImage(models.Model):
    parfum = models.ForeignKey(Parfum, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='parfums/gallery/')
    ordre = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['ordre']
        verbose_name = 'Image de parfum'
        verbose_name_plural = 'Images de parfum'

    def __str__(self):
        return f"Image {self.ordre} - {self.parfum.nom}"
