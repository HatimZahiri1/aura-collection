from django.contrib import admin
from .models import Marque, Parfum, Format, ParfumImage


class FormatInline(admin.TabularInline):
    model = Format
    extra = 3


class ParfumImageInline(admin.TabularInline):
    model = ParfumImage
    extra = 1


@admin.register(Marque)
class MarqueAdmin(admin.ModelAdmin):
    list_display = ['nom', 'actif', 'created_at']
    list_filter = ['actif']
    search_fields = ['nom']


@admin.register(Parfum)
class ParfumAdmin(admin.ModelAdmin):
    list_display = ['nom', 'marque', 'genre', 'concentration', 'famille_olfactive', 'actif', 'mis_en_avant']
    list_filter = ['genre', 'concentration', 'famille_olfactive', 'actif', 'mis_en_avant', 'marque']
    search_fields = ['nom', 'marque__nom', 'description']
    inlines = [FormatInline, ParfumImageInline]


@admin.register(Format)
class FormatAdmin(admin.ModelAdmin):
    list_display = ['parfum', 'type_format', 'contenance_ml', 'prix', 'stock']
    list_filter = ['type_format']
    list_editable = ['prix', 'stock']
    search_fields = ['parfum__nom']
