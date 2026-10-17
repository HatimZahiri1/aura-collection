from django.contrib import admin
from .models import Commande, LigneCommande, ContactMessage


class LigneCommandeInline(admin.TabularInline):
    model = LigneCommande
    extra = 0
    readonly_fields = ['format', 'quantite', 'prix_unitaire']


@admin.register(Commande)
class CommandeAdmin(admin.ModelAdmin):
    list_display = ['id', 'nom_client', 'telephone', 'ville', 'statut', 'total', 'created_at']
    list_filter = ['statut', 'ville', 'created_at']
    search_fields = ['nom_client', 'telephone']
    list_editable = ['statut']
    inlines = [LigneCommandeInline]
    readonly_fields = ['total', 'created_at', 'updated_at']


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ['nom', 'email', 'telephone', 'lu', 'created_at']
    list_filter = ['lu', 'created_at']
    search_fields = ['nom', 'email', 'message']
    list_editable = ['lu']
    readonly_fields = ['created_at']
