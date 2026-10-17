from django.db import models
from catalog.models import Format


class Commande(models.Model):
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('confirmee', 'Confirmée'),
        ('en_livraison', 'En livraison'),
        ('livree', 'Livrée'),
        ('annulee', 'Annulée'),
    ]

    nom_client = models.CharField(max_length=200)
    telephone = models.CharField(max_length=20)
    adresse = models.TextField()
    ville = models.CharField(max_length=100)
    frais_livraison = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='en_attente')
    notes = models.TextField(blank=True, help_text='Notes supplémentaires du client')
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Commande'
        verbose_name_plural = 'Commandes'

    def __str__(self):
        return f"Commande #{self.id} - {self.nom_client}"

    def calculer_total(self):
        """Recalcule le total depuis les lignes de commande + frais de livraison."""
        lignes_total = sum(
            ligne.prix_unitaire * ligne.quantite
            for ligne in self.lignes.all()
        )
        self.total = lignes_total + (self.frais_livraison or 0)
        self.save(update_fields=['total'])


class LigneCommande(models.Model):
    commande = models.ForeignKey(Commande, on_delete=models.CASCADE, related_name='lignes')
    format = models.ForeignKey(Format, on_delete=models.PROTECT, related_name='lignes_commande')
    quantite = models.PositiveIntegerField(default=1)
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)
    fragrances_choisies = models.TextField(blank=True, default='', help_text='Fragrances sélectionnées par le client pour les packs')

    class Meta:
        verbose_name = 'Ligne de commande'
        verbose_name_plural = 'Lignes de commande'

    def __str__(self):
        return f"{self.quantite}x {self.format} @ {self.prix_unitaire} MAD"

    @property
    def sous_total(self):
        return self.quantite * self.prix_unitaire


class ContactMessage(models.Model):
    """Messages reçus depuis le formulaire de contact du site."""
    nom = models.CharField(max_length=200)
    email = models.EmailField()
    telephone = models.CharField(max_length=20, blank=True)
    message = models.TextField()
    lu = models.BooleanField(default=False, verbose_name='Lu')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Message de contact'
        verbose_name_plural = 'Messages de contact'

    def __str__(self):
        return f"{self.nom} — {self.email} ({self.created_at:%d/%m/%Y})"
