from rest_framework import serializers
from .models import Marque, Parfum, Format, ParfumImage, Collection


class MarqueSerializer(serializers.ModelSerializer):
    nombre_parfums = serializers.SerializerMethodField()

    class Meta:
        model = Marque
        fields = ['id', 'nom', 'logo', 'description', 'actif', 'nombre_parfums']

    def get_nombre_parfums(self, obj):
        return obj.parfums.filter(actif=True).count()


class CollectionSerializer(serializers.ModelSerializer):
    nombre_parfums = serializers.SerializerMethodField()

    class Meta:
        model = Collection
        fields = ['id', 'nom', 'slug', 'description', 'image', 'actif', 'ordre', 'nombre_parfums']

    def get_nombre_parfums(self, obj):
        slug = (obj.slug or '').lower()
        if slug in ['promotions', 'promo']:
            return Parfum.objects.filter(is_promo=True, actif=True).count()
        elif slug in ['packs-speciaux', 'packs']:
            return Parfum.objects.filter(is_pack=True, actif=True).count()
        elif slug in ['parfums-homme', 'homme', 'gel-parfum-homme']:
            return Parfum.objects.filter(genre='homme', is_pack=False, actif=True).count()
        elif slug in ['parfums-femme', 'femme', 'gel-parfum-femme']:
            return Parfum.objects.filter(genre='femme', is_pack=False, actif=True).count()
        elif slug in ['parfums-unisexe', 'unisexe']:
            return Parfum.objects.filter(genre='mixte', is_pack=False, actif=True).count()
        return obj.parfums.filter(actif=True).count()


class FormatSerializer(serializers.ModelSerializer):
    type_format_display = serializers.CharField(source='get_type_format_display', read_only=True)
    parfum_nom = serializers.CharField(source='parfum.nom', read_only=True)
    parfum_genre = serializers.CharField(source='parfum.genre', read_only=True)
    parfum_marque = serializers.CharField(source='parfum.marque.nom', read_only=True)
    parfum_photo = serializers.ImageField(source='parfum.photo_principale', read_only=True)
    prix_effectif = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    en_promo = serializers.BooleanField(read_only=True)

    class Meta:
        model = Format
        fields = [
            'id', 'parfum', 'parfum_nom', 'parfum_genre', 'parfum_marque',
            'parfum_photo', 'type_format', 'type_format_display',
            'contenance_ml', 'prix', 'prix_promo', 'prix_effectif', 'en_promo', 'stock'
        ]


class ParfumImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParfumImage
        fields = ['id', 'image', 'ordre']


class ParfumMiniSerializer(serializers.ModelSerializer):
    marque_nom = serializers.CharField(source='marque.nom', read_only=True)

    class Meta:
        model = Parfum
        fields = ['id', 'nom', 'marque_nom', 'photo_principale', 'genre']


class ParfumListSerializer(serializers.ModelSerializer):
    """Serializer léger pour la liste des parfums."""
    marque_nom = serializers.CharField(source='marque.nom', read_only=True)
    prix_min = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    en_stock = serializers.BooleanField(read_only=True)
    genre_display = serializers.CharField(source='get_genre_display', read_only=True)
    famille_display = serializers.CharField(source='get_famille_olfactive_display', read_only=True)
    collections_detail = CollectionSerializer(source='collections', many=True, read_only=True)
    parfums_inclus_detail = ParfumMiniSerializer(source='parfums_inclus', many=True, read_only=True)
    formats = FormatSerializer(many=True, read_only=True)
    has_promo = serializers.BooleanField(read_only=True)

    class Meta:
        model = Parfum
        fields = [
            'id', 'nom', 'marque', 'marque_nom', 'genre', 'genre_display',
            'famille_olfactive', 'famille_display', 'concentration',
            'photo_principale', 'prix_min', 'en_stock', 'actif',
            'mis_en_avant', 'is_pack', 'is_promo', 'prix_promo', 'has_promo',
            'parfums_inclus', 'parfums_inclus_detail',
            'collections', 'collections_detail', 'formats', 'created_at',
        ]


class ParfumDetailSerializer(serializers.ModelSerializer):
    """Serializer complet pour la fiche produit."""
    marque_nom = serializers.CharField(source='marque.nom', read_only=True)
    formats = FormatSerializer(many=True, read_only=True)
    images = ParfumImageSerializer(many=True, read_only=True)
    collections_detail = CollectionSerializer(source='collections', many=True, read_only=True)
    parfums_inclus_detail = ParfumMiniSerializer(source='parfums_inclus', many=True, read_only=True)
    genre_display = serializers.CharField(source='get_genre_display', read_only=True)
    famille_display = serializers.CharField(source='get_famille_olfactive_display', read_only=True)
    concentration_display = serializers.CharField(source='get_concentration_display', read_only=True)
    has_promo = serializers.BooleanField(read_only=True)

    class Meta:
        model = Parfum
        fields = [
            'id', 'nom', 'marque', 'marque_nom', 'description',
            'genre', 'genre_display', 'famille_olfactive', 'famille_display',
            'notes_tete', 'notes_coeur', 'notes_fond',
            'concentration', 'concentration_display',
            'photo_principale', 'images', 'formats',
            'is_pack', 'is_promo', 'prix_promo', 'has_promo',
            'parfums_inclus', 'parfums_inclus_detail',
            'collections', 'collections_detail',
            'actif', 'mis_en_avant', 'created_at', 'updated_at',
        ]


class ParfumAdminSerializer(serializers.ModelSerializer):
    """Serializer pour l'admin - avec formats, collections et parfums_inclus."""
    formats = FormatSerializer(many=True, required=False)
    marque_nom = serializers.CharField(source='marque.nom', read_only=True)
    collections_detail = CollectionSerializer(source='collections', many=True, read_only=True)
    parfums_inclus_detail = ParfumMiniSerializer(source='parfums_inclus', many=True, read_only=True)

    class Meta:
        model = Parfum
        fields = [
            'id', 'nom', 'marque', 'marque_nom', 'description',
            'genre', 'famille_olfactive',
            'notes_tete', 'notes_coeur', 'notes_fond',
            'concentration', 'photo_principale',
            'is_pack', 'is_promo', 'prix_promo',
            'parfums_inclus', 'parfums_inclus_detail',
            'collections', 'collections_detail',
            'actif', 'mis_en_avant', 'formats',
            'created_at', 'updated_at',
        ]

    def to_internal_value(self, data):
        ret = super().to_internal_value(data)
        if hasattr(data, 'getlist'):
            if 'parfums_inclus' in data:
                inclus_ids = data.getlist('parfums_inclus')
                ret['parfums_inclus'] = [int(i) for i in inclus_ids if str(i).isdigit()]
            elif self.instance and self.instance.is_pack:
                ret['parfums_inclus'] = []
            if 'collections' in data:
                col_ids = data.getlist('collections')
                ret['collections'] = [int(i) for i in col_ids if str(i).isdigit()]
        return ret

    def create(self, validated_data):
        formats_data = validated_data.pop('formats', [])
        collections = validated_data.pop('collections', [])
        parfums_inclus = validated_data.pop('parfums_inclus', [])
        parfum = Parfum.objects.create(**validated_data)
        if collections:
            parfum.collections.set(collections)
        if parfums_inclus:
            parfum.parfums_inclus.set(parfums_inclus)
        for format_data in formats_data:
            Format.objects.create(parfum=parfum, **format_data)
        parfum.sync_collections()
        return parfum

    def update(self, instance, validated_data):
        formats_data = validated_data.pop('formats', None)
        collections = validated_data.pop('collections', None)
        parfums_inclus = validated_data.pop('parfums_inclus', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if collections is not None:
            instance.collections.set(collections)

        if parfums_inclus is not None:
            instance.parfums_inclus.set(parfums_inclus)

        if formats_data is not None:
            existing_ids = set(instance.formats.values_list('id', flat=True))
            for format_data in formats_data:
                fmt_id = format_data.get('id')
                if fmt_id and fmt_id in existing_ids:
                    fmt = Format.objects.get(id=fmt_id)
                    for k, v in format_data.items():
                        setattr(fmt, k, v)
                    fmt.save()
                else:
                    Format.objects.create(parfum=instance, **format_data)

        instance.sync_collections()
        return instance
