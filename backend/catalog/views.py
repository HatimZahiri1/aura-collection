from django.db.models import Q
from rest_framework import viewsets, permissions, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Marque, Parfum, Format, ParfumImage, Collection
from .serializers import (
    MarqueSerializer, ParfumListSerializer, ParfumDetailSerializer,
    ParfumAdminSerializer, FormatSerializer, ParfumImageSerializer,
    CollectionSerializer,
)
from .filters import ParfumFilter


class IsAdminOrReadOnly(permissions.BasePermission):
    """Lecture pour tous, écriture pour admin seulement."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


class MarqueViewSet(viewsets.ModelViewSet):
    queryset = Marque.objects.all()
    serializer_class = MarqueSerializer
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['nom']

    def get_queryset(self):
        qs = super().get_queryset()
        include_inactive = self.request.query_params.get('include_inactive')
        is_staff = bool(self.request.user and self.request.user.is_staff)
        show_inactive = is_staff and (
            str(include_inactive).lower() in ['true', '1']
            or self.action in ['update', 'partial_update', 'destroy']
        )
        if not show_inactive:
            qs = qs.filter(actif=True)
        return qs


class ParfumViewSet(viewsets.ModelViewSet):
    queryset = Parfum.objects.select_related('marque').prefetch_related(
        'formats', 'images', 'collections', 'parfums_inclus', 'parfums_inclus__marque'
    )
    permission_classes = [IsAdminOrReadOnly]
    filterset_class = ParfumFilter
    search_fields = ['nom', 'marque__nom', 'description', 'notes_tete', 'notes_coeur', 'notes_fond']
    ordering_fields = ['nom', 'created_at', 'marque__nom']
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_serializer_class(self):
        if self.action == 'list':
            return ParfumListSerializer
        if self.request.user and self.request.user.is_staff:
            return ParfumAdminSerializer
        return ParfumDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        include_inactive = self.request.query_params.get('include_inactive')
        is_staff = bool(self.request.user and self.request.user.is_staff)
        show_inactive = is_staff and (
            str(include_inactive).lower() in ['true', '1']
            or self.action in ['update', 'partial_update', 'destroy']
        )
        if not show_inactive:
            qs = qs.filter(actif=True)

        collection = self.request.query_params.get('collection')
        if collection:
            c_lower = collection.lower().strip()
            if c_lower in ['parfums-homme', 'homme', 'gel-parfum-homme']:
                qs = qs.filter(genre='homme', is_pack=False).distinct()
            elif c_lower in ['parfums-femme', 'femme', 'gel-parfum-femme']:
                qs = qs.filter(genre='femme', is_pack=False).distinct()
            elif c_lower in ['parfums-unisexe', 'mixte', 'unisexe']:
                qs = qs.filter(genre='mixte', is_pack=False).distinct()
            elif c_lower in ['promotions', 'promo']:
                qs = qs.filter(Q(is_promo=True) | Q(collections__slug='promotions') | Q(formats__prix_promo__isnull=False, formats__prix_promo__gt=0)).distinct()
            elif c_lower in ['packs-speciaux', 'packs', 'pack']:
                qs = qs.filter(Q(is_pack=True) | Q(collections__slug='packs-speciaux')).distinct()
            elif c_lower.isdigit():
                qs = qs.filter(collections__id=int(c_lower)).distinct()
            else:
                qs = qs.filter(collections__slug=c_lower).distinct()

        is_pack = self.request.query_params.get('is_pack')
        if is_pack is not None:
            if is_pack.lower() in ['true', '1']:
                qs = qs.filter(is_pack=True)
            elif is_pack.lower() in ['false', '0']:
                qs = qs.filter(is_pack=False)

        is_promo = self.request.query_params.get('is_promo')
        if is_promo is not None:
            if is_promo.lower() in ['true', '1']:
                qs = qs.filter(Q(is_promo=True) | Q(formats__prix_promo__isnull=False, formats__prix_promo__gt=0)).distinct()
            elif is_promo.lower() in ['false', '0']:
                qs = qs.filter(is_promo=False).exclude(formats__prix_promo__isnull=False, formats__prix_promo__gt=0).distinct()

        return qs

    def finalize_response(self, request, response, *args, **kwargs):
        res = super().finalize_response(request, response, *args, **kwargs)
        if request.method in ('GET', 'HEAD') and not (request.user and request.user.is_staff):
            res['Cache-Control'] = 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
        return res

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Retourne les parfums mis en avant."""
        featured = self.get_queryset().filter(mis_en_avant=True, actif=True)[:8]
        serializer = ParfumListSerializer(featured, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def nouveautes(self, request):
        """Retourne les derniers parfums ajoutés."""
        nouveautes = self.get_queryset().filter(actif=True).order_by('-created_at')[:8]
        serializer = ParfumListSerializer(nouveautes, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def create_pack(self, request):
        """Créer un Pack Spécial avec 2 à 4 parfums, un format et un prix total."""
        nom = request.data.get('nom')
        if not nom:
            return Response({'error': 'Le nom du pack est requis'}, status=status.HTTP_400_BAD_REQUEST)

        parfums_ids = request.data.getlist('parfums') if hasattr(request.data, 'getlist') and request.data.getlist('parfums') else request.data.get('parfums', [])
        if isinstance(parfums_ids, str):
            import json
            try:
                parfums_ids = json.loads(parfums_ids)
            except Exception:
                parfums_ids = [int(p) for p in parfums_ids.split(',') if p.strip().isdigit()]

        parfums_ids = [int(p) for p in parfums_ids if str(p).isdigit()]
        if len(parfums_ids) < 2 or len(parfums_ids) > 4:
            return Response({'error': 'Un pack spécial doit contenir entre 2 et 4 parfums.'}, status=status.HTTP_400_BAD_REQUEST)

        format_type = str(request.data.get('format_type', 'pack_3')).lower()
        if 'pack_4' in format_type or len(parfums_ids) == 4 or '4' in format_type:
            db_type = 'pack_4'
            ml = 250
        elif 'pack_3' in format_type or len(parfums_ids) == 3 or '3' in format_type:
            db_type = 'pack_3'
            ml = 250
        elif '5' in format_type:
            db_type = 'decant_5'
            ml = 5
        elif '10' in format_type:
            db_type = 'decant_10'
            ml = 10
        elif 'complet' in format_type or '250' in format_type:
            db_type = 'flacon_250'
            ml = 250
        else:
            db_type = 'flacon_250'
            ml = 250

        try:
            prix_total = float(request.data.get('prix', 0))
            if prix_total <= 0:
                return Response({'error': 'Le prix total du pack doit être supérieur à 0'}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({'error': 'Prix total invalide'}, status=status.HTTP_400_BAD_REQUEST)

        stock = int(request.data.get('stock', 10))

        marque, _ = Marque.objects.get_or_create(
            nom='AURA COLLECTION',
            defaults={'description': 'Coffrets & Packs Spéciaux AURA COLLECTION'}
        )
        pack_col, _ = Collection.objects.get_or_create(
            slug='packs-speciaux',
            defaults={'nom': 'Packs Spéciaux', 'description': 'Nos offres groupées exclusives et coffrets de gels douche parfumés'}
        )

        inclus_objs = list(Parfum.objects.filter(id__in=parfums_ids))
        if len(inclus_objs) < 2:
            return Response({'error': 'Parfums introuvables'}, status=status.HTTP_400_BAD_REQUEST)

        is_promo = request.data.get('is_promo')
        if isinstance(is_promo, str):
            is_promo = is_promo.lower() in ['true', '1', 'yes']
        else:
            is_promo = bool(is_promo)

        prix_promo = request.data.get('prix_promo')
        if prix_promo and is_promo:
            try:
                prix_promo = float(prix_promo)
            except (ValueError, TypeError):
                prix_promo = None
        else:
            prix_promo = None

        photo = request.FILES.get('photo_principale') or request.FILES.get('photo')
        parfum = Parfum(
            nom=nom,
            marque=marque,
            genre='mixte',
            famille_olfactive='fraiche',
            concentration='gel',
            description=request.data.get('description', f"Pack exclusif de {len(inclus_objs)} gels douche parfumés 250ml."),
            is_pack=True,
            mis_en_avant=bool(request.data.get('mis_en_avant', False)),
            actif=True,
            is_promo=is_promo,
            prix_promo=prix_promo,
        )
        if photo:
            parfum.photo_principale = photo
        elif inclus_objs[0].photo_principale:
            parfum.photo_principale = inclus_objs[0].photo_principale

        parfum.save()
        parfum.parfums_inclus.set(inclus_objs)
        parfum.collections.add(pack_col)
        parfum.sync_collections()

        Format.objects.create(
            parfum=parfum,
            type_format=db_type,
            contenance_ml=ml,
            prix=prix_total,
            prix_promo=prix_promo,
            stock=stock
        )

        serializer = ParfumDetailSerializer(parfum, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['put', 'patch', 'post'], permission_classes=[permissions.IsAdminUser])
    def update_pack(self, request, pk=None):
        """Modifier un Pack Spécial existant."""
        parfum = self.get_object()
        if not parfum.is_pack:
            return Response({'error': 'Ce produit n\'est pas un pack spécial'}, status=status.HTTP_400_BAD_REQUEST)

        nom = request.data.get('nom')
        if nom:
            parfum.nom = nom

        if 'description' in request.data:
            parfum.description = request.data.get('description')

        if 'mis_en_avant' in request.data:
            parfum.mis_en_avant = bool(request.data.get('mis_en_avant'))

        if 'actif' in request.data:
            parfum.actif = bool(request.data.get('actif'))

        if 'is_promo' in request.data:
            val = request.data.get('is_promo')
            if isinstance(val, str):
                parfum.is_promo = val.lower() in ['true', '1', 'yes']
            else:
                parfum.is_promo = bool(val)

        if 'prix_promo' in request.data:
            p_val = request.data.get('prix_promo')
            if p_val and parfum.is_promo:
                try:
                    parfum.prix_promo = float(p_val)
                except (ValueError, TypeError):
                    parfum.prix_promo = None
            else:
                parfum.prix_promo = None
        elif not parfum.is_promo:
            parfum.prix_promo = None

        photo = request.FILES.get('photo_principale') or request.FILES.get('photo')
        if photo:
            parfum.photo_principale = photo

        parfums_ids = request.data.getlist('parfums') if hasattr(request.data, 'getlist') and request.data.getlist('parfums') else request.data.get('parfums')
        if parfums_ids is not None:
            if isinstance(parfums_ids, str):
                import json
                try:
                    parfums_ids = json.loads(parfums_ids)
                except Exception:
                    parfums_ids = [int(p) for p in parfums_ids.split(',') if p.strip().isdigit()]
            parfums_ids = [int(p) for p in parfums_ids if str(p).isdigit()]
            if len(parfums_ids) >= 2 and len(parfums_ids) <= 4:
                parfum.parfums_inclus.set(Parfum.objects.filter(id__in=parfums_ids))

        parfum.save()
        parfum.sync_collections()

        format_type = request.data.get('format_type')
        prix = request.data.get('prix')
        stock = request.data.get('stock')

        fmt = parfum.formats.first()
        if not fmt:
            fmt = Format(parfum=parfum, type_format='decant_10', contenance_ml=10, prix=0, stock=0)

        if format_type:
            if '5' in format_type:
                fmt.type_format = 'decant_5'
                fmt.contenance_ml = 5
            elif 'complet' in format_type or '100' in format_type:
                fmt.type_format = 'complet'
                fmt.contenance_ml = 100
            else:
                fmt.type_format = 'decant_10'
                fmt.contenance_ml = 10

        if prix is not None:
            fmt.prix = float(prix)
        if stock is not None:
            fmt.stock = int(stock)
        fmt.prix_promo = parfum.prix_promo if parfum.is_promo else None
        fmt.save()

        serializer = ParfumDetailSerializer(parfum, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def upload_image(self, request, pk=None):
        """Upload une image secondaire pour un parfum."""
        parfum = self.get_object()
        image = request.FILES.get('image')
        if not image:
            return Response({'error': 'Aucune image fournie'}, status=status.HTTP_400_BAD_REQUEST)
        ordre = parfum.images.count()
        img = ParfumImage.objects.create(parfum=parfum, image=image, ordre=ordre)
        return Response(ParfumImageSerializer(img, context={'request': request}).data, status=status.HTTP_201_CREATED)


class FormatViewSet(viewsets.ModelViewSet):
    queryset = Format.objects.select_related('parfum', 'parfum__marque')
    serializer_class = FormatSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = super().get_queryset()
        parfum_id = self.request.query_params.get('parfum')
        if parfum_id:
            qs = qs.filter(parfum_id=parfum_id)
        genre = self.request.query_params.get('genre')
        if genre:
            qs = qs.filter(parfum__genre=genre)
        return qs

    @action(detail=False, methods=['post'])
    def bulk_update_stock(self, request):
        """Mise à jour rapide du stock de plusieurs formats."""
        updates = request.data  # [{"id": 1, "stock": 10}, ...]
        if not isinstance(updates, list):
            return Response({'error': 'Liste attendue'}, status=status.HTTP_400_BAD_REQUEST)

        updated = []
        for item in updates:
            try:
                fmt = Format.objects.get(id=item['id'])
                fmt.stock = item['stock']
                fmt.save(update_fields=['stock'])
                updated.append(FormatSerializer(fmt).data)
            except (Format.DoesNotExist, KeyError):
                continue

        return Response(updated)


class StatsView(viewsets.ViewSet):
    """Statistiques et données analytiques pour le dashboard admin."""
    permission_classes = [permissions.IsAdminUser]

    def list(self, request):
        from orders.models import Commande, LigneCommande
        from django.db.models import Sum, Count, Avg
        from django.utils import timezone
        from datetime import timedelta

        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        total_parfums = Parfum.objects.filter(actif=True).count()
        total_marques = Marque.objects.filter(actif=True).count()
        rupture_stock = Format.objects.filter(stock=0).count()
        stock_faible = Format.objects.filter(stock__gt=0, stock__lte=5).count()
        commandes_en_attente = Commande.objects.filter(statut='en_attente').count()
        commandes_total = Commande.objects.count()

        valid_orders = Commande.objects.exclude(statut='annulee')
        ca_total = valid_orders.aggregate(total=Sum('total'))['total'] or 0
        ca_mois = valid_orders.filter(created_at__gte=start_of_month).aggregate(total=Sum('total'))['total'] or 0
        panier_moyen = valid_orders.aggregate(avg=Avg('total'))['avg'] or 0

        # Données de la courbe des 7 derniers jours (revenus & volume de commandes)
        ventes_jours = []
        jours_fr = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
        for i in range(6, -1, -1):
            day_date = (now - timedelta(days=i)).date()
            day_orders = valid_orders.filter(created_at__date=day_date)
            day_rev = day_orders.aggregate(total=Sum('total'))['total'] or 0
            day_count = day_orders.count()
            jour_nom = jours_fr[day_date.weekday()]
            ventes_jours.append({
                'date': day_date.strftime('%Y-%m-%d'),
                'label': f"{jour_nom} {day_date.day}",
                'revenu': float(day_rev),
                'commandes': day_count,
            })

        # Données des 12 mois de l'année (revenus & volume mensuel)
        mois_fr = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
        ventes_mois = []
        current_year = now.year
        for m in range(1, 13):
            m_start = timezone.datetime(current_year, m, 1, tzinfo=timezone.get_current_timezone())
            if m == 12:
                m_end = timezone.datetime(current_year + 1, 1, 1, tzinfo=timezone.get_current_timezone())
            else:
                m_end = timezone.datetime(current_year, m + 1, 1, tzinfo=timezone.get_current_timezone())
            m_orders = valid_orders.filter(created_at__gte=m_start, created_at__lt=m_end)
            m_rev = m_orders.aggregate(total=Sum('total'))['total'] or 0
            m_count = m_orders.count()
            ventes_mois.append({
                'month': m,
                'label': mois_fr[m - 1],
                'revenu': float(m_rev),
                'commandes': m_count,
                'is_current': m == now.month,
            })

        # Palmarès de TOUS les Gels Douche Parfumés & Produits du catalogue (pour la courbe de bâtons / bar chart)
        # Calcule les ventes réelles, sorties de stock, et sélections dans les packs
        sales_map = {}
        fragrance_pack_counts = {}

        for ligne in (
            LigneCommande.objects.filter(commande__in=valid_orders, format__parfum__isnull=False)
            .select_related('format__parfum')
        ):
            parfum_obj = ligne.format.parfum
            p_id = parfum_obj.id
            if p_id not in sales_map:
                sales_map[p_id] = {'ventes': 0, 'ca': 0.0, 'ventes_solo': 0, 'ventes_pack': 0}

            sales_map[p_id]['ventes'] += ligne.quantite
            sales_map[p_id]['ca'] += float(ligne.prix_unitaire * ligne.quantite)

            if parfum_obj.is_pack:
                sales_map[p_id]['ventes_pack'] += ligne.quantite
                if ligne.fragrances_choisies:
                    parts = [f.strip() for f in ligne.fragrances_choisies.split(',') if f.strip()]
                    for fname in parts:
                        fk = fname.lower()
                        fragrance_pack_counts[fk] = fragrance_pack_counts.get(fk, 0) + ligne.quantite
            else:
                sales_map[p_id]['ventes_solo'] += ligne.quantite

        top_ventes = []
        for p in Parfum.objects.prefetch_related('formats').all().order_by('-is_pack', 'nom'):
            p_sales = sales_map.get(p.id, {'ventes': 0, 'ca': 0.0, 'ventes_solo': 0, 'ventes_pack': 0})
            total_stock = sum(f.stock for f in p.formats.all())

            if p.is_pack:
                ventes_total = p_sales['ventes']
                inclus_pack = 0
                solo_count = 0
            else:
                p_lower = p.nom.lower()
                inclus_pack = 0
                for fname_key, cnt in fragrance_pack_counts.items():
                    if fname_key == p_lower or fname_key in p_lower or p_lower in fname_key:
                        inclus_pack += cnt
                solo_count = p_sales['ventes_solo']
                ventes_total = solo_count + inclus_pack

            top_ventes.append({
                'id': p.id,
                'nom': p.nom,
                'genre': 'Pack Spécial' if p.is_pack else p.genre,
                'photo': request.build_absolute_uri(p.photo_principale.url) if p.photo_principale else None,
                'ventes': ventes_total,
                'ventes_solo': solo_count,
                'ventes_inclus_packs': inclus_pack,
                'ca': round(p_sales['ca'], 2),
                'stock_restant': total_stock,
                'actif': p.actif,
                'is_pack': p.is_pack,
            })

        # Trier par nombre d'unités vendues décroissant, puis chiffre d'affaires
        top_ventes.sort(key=lambda x: (x['ventes'], x['ca']), reverse=True)

        # Distribution dynamique par collection réelle
        collection_colors = ['#2fb49c', '#0f3d38', '#4e6b65', '#d97706', '#e11d48', '#7c3aed', '#0284c7', '#059669', '#dc2626', '#ea580c']
        all_collections = Collection.objects.filter(actif=True).order_by('ordre', 'nom')
        categories_stats = []
        for idx, col in enumerate(all_collections):
            prod_count = col.parfums.filter(actif=True).count()
            if prod_count > 0:
                categories_stats.append({
                    'name': col.nom,
                    'slug': col.slug,
                    'count': prod_count,
                    'color': collection_colors[idx % len(collection_colors)],
                })

        # Top Parfums pour la vitrine du dashboard
        top_parfums_qs = Parfum.objects.filter(actif=True).order_by('-mis_en_avant', '-created_at')[:8]
        top_parfums_data = []
        for p in top_parfums_qs:
            top_parfums_data.append({
                'id': p.id,
                'nom': p.nom,
                'marque_nom': p.marque.nom if p.marque else 'AURA COLLECTION',
                'genre': p.genre,
                'photo_principale': request.build_absolute_uri(p.photo_principale.url) if p.photo_principale else None,
                'prix_min': float(p.prix_min) if p.prix_min else 0,
                'is_promo': p.is_promo,
                'prix_promo': float(p.prix_promo) if p.prix_promo else None,
                'is_pack': p.is_pack,
                'en_stock': p.en_stock,
            })

        return Response({
            'total_parfums': total_parfums,
            'total_marques': total_marques,
            'rupture_stock': rupture_stock,
            'stock_faible': stock_faible,
            'commandes_en_attente': commandes_en_attente,
            'commandes_total': commandes_total,
            'chiffre_affaires_total': float(ca_total),
            'chiffre_affaires_mois': float(ca_mois),
            'panier_moyen': round(float(panier_moyen), 2),
            'ventes_jours': ventes_jours,
            'ventes_mois': ventes_mois,
            'top_ventes': top_ventes,
            'categories_stats': categories_stats,
            'top_parfums': top_parfums_data,
        })


class CollectionViewSet(viewsets.ModelViewSet):
    queryset = Collection.objects.prefetch_related('parfums').all()
    serializer_class = CollectionSerializer
    permission_classes = [IsAdminOrReadOnly]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        qs = super().get_queryset()
        include_inactive = self.request.query_params.get('include_inactive')
        is_staff = bool(self.request.user and self.request.user.is_staff)
        show_inactive = is_staff and (
            str(include_inactive).lower() in ['true', '1']
            or self.action in ['update', 'partial_update', 'destroy']
        )
        if not show_inactive:
            qs = qs.filter(actif=True)
        return qs

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def assign_parfums(self, request, pk=None):
        collection = self.get_object()
        raw_ids = request.data.get('parfum_ids', [])
        parfum_ids = [int(p) for p in raw_ids if str(p).isdigit()]

        c_slug = (collection.slug or '').lower()
        if c_slug in ['promotions', 'promo']:
            # Mettre en promo les sélectionnés
            Parfum.objects.filter(id__in=parfum_ids).update(is_promo=True)
            # Retirer de promo ceux qui ne sont plus dans la liste
            Parfum.objects.exclude(id__in=parfum_ids).filter(is_promo=True).update(is_promo=False, prix_promo=None)
        elif c_slug in ['packs-speciaux', 'packs']:
            Parfum.objects.filter(id__in=parfum_ids).update(is_pack=True)
            Parfum.objects.exclude(id__in=parfum_ids).filter(is_pack=True).update(is_pack=False)
        elif c_slug in ['parfums-homme', 'homme']:
            Parfum.objects.filter(id__in=parfum_ids, is_pack=False).update(genre='homme')
        elif c_slug in ['parfums-femme', 'femme']:
            Parfum.objects.filter(id__in=parfum_ids, is_pack=False).update(genre='femme')
        elif c_slug in ['parfums-unisexe', 'mixte', 'unisexe']:
            Parfum.objects.filter(id__in=parfum_ids, is_pack=False).update(genre='mixte')

        collection.parfums.set(parfum_ids)

        # Synchroniser tous les parfums
        for p in Parfum.objects.all():
            p.sync_collections()

        return Response({'success': True, 'count': collection.parfums.count()})

