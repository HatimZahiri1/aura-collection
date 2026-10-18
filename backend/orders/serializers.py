from rest_framework import serializers
from django.db import transaction
from .models import Commande, LigneCommande, ContactMessage
from catalog.models import Format, Parfum
from catalog.serializers import FormatSerializer


class LigneCommandeSerializer(serializers.ModelSerializer):
    format_detail = FormatSerializer(source='format', read_only=True)
    parfum_nom = serializers.CharField(source='format.parfum.nom', read_only=True)
    marque_nom = serializers.CharField(source='format.parfum.marque.nom', read_only=True)
    photo = serializers.ImageField(source='format.parfum.photo_principale', read_only=True)
    sous_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = LigneCommande
        fields = [
            'id', 'format', 'format_detail', 'parfum_nom', 'marque_nom',
            'photo', 'quantite', 'prix_unitaire', 'sous_total', 'fragrances_choisies',
        ]
        read_only_fields = ['prix_unitaire']


def calculate_gels_bundle_discount(items_info):
    """
    Calcule la remise automatique de pack pour les flacons individuels 250ml.
    items_info: list of dict {'is_pack': bool, 'prix': float, 'quantite': int}
    """
    single_count = 0
    single_raw_total = 0.0
    for item in items_info:
        if not item['is_pack']:
            single_count += item['quantite']
            single_raw_total += float(item['prix']) * item['quantite']

    if single_count < 3:
        return 0.0, ''

    # Programmation dynamique pour trouver le coût minimum exact
    dp = [float('inf')] * (single_count + 1)
    choice = [1] * (single_count + 1)
    dp[0] = 0.0

    for i in range(1, single_count + 1):
        # Option 1: 1 gel = 89 DH
        if dp[i - 1] + 89.0 < dp[i]:
            dp[i] = dp[i - 1] + 89.0
            choice[i] = 1
        # Option 2: Pack Trio (3 gels) = 239 DH
        if i >= 3 and dp[i - 3] + 239.0 < dp[i]:
            dp[i] = dp[i - 3] + 239.0
            choice[i] = 3
        # Option 3: Pack Complet (4 gels) = 299 DH
        if i >= 4 and dp[i - 4] + 299.0 < dp[i]:
            dp[i] = dp[i - 4] + 299.0
            choice[i] = 4

    curr = single_count
    packs4, packs3 = 0, 0
    while curr > 0:
        c = choice[curr]
        if c == 4:
            packs4 += 1
            curr -= 4
        elif c == 3:
            packs3 += 1
            curr -= 3
        else:
            curr -= 1

    optimal_total = dp[single_count]
    discount = max(0.0, single_raw_total - optimal_total)

    badge_desc = []
    if packs4 > 0:
        badge_desc.append(f"{packs4}x Pack 4 Gels (299 DH)")
    if packs3 > 0:
        badge_desc.append(f"{packs3}x Pack 3 Gels (239 DH)")

    note_str = f"Remise Pack automatique: -{int(discount)} DH ({', '.join(badge_desc)})" if discount > 0 else ""
    return discount, note_str


class CommandeCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création d'une commande par le client."""
    lignes = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
    )

    class Meta:
        model = Commande
        fields = ['nom_client', 'telephone', 'adresse', 'ville', 'notes', 'lignes']

    def _resolve_format(self, ligne_data, for_update=False):
        fmt_id = ligne_data.get('format_id')
        qs = Format.objects.select_for_update() if for_update else Format.objects

        if fmt_id:
            fmt = qs.filter(id=fmt_id).first()
            if fmt:
                return fmt

        # Fallback intelligent selon les fragrances choisies (pack 4 ou pack 3)
        frags = ligne_data.get('fragrances_choisies') or []
        count = len(frags) if isinstance(frags, list) else (len([f for f in frags.split(',') if f.strip()]) if isinstance(frags, str) else 0)

        if count >= 4:
            fmt_p4 = qs.filter(type_format='pack_4').first()
            if fmt_p4:
                return fmt_p4
        elif count == 3:
            fmt_p3 = qs.filter(type_format='pack_3').first()
            if fmt_p3:
                return fmt_p3

        return (
            qs.filter(type_format='flacon_250', stock__gt=0).first()
            or qs.filter(stock__gt=0).first()
            or qs.first()
        )

    def validate_lignes(self, value):
        if not value:
            raise serializers.ValidationError("La commande doit contenir au moins un article.")

        # Vérification globale des stocks (flacons seuls et fragrances dans packs)
        demand_per_format = {}
        demand_per_perfume = {}

        for i, ligne in enumerate(value):
            quantite = int(ligne.get('quantite', 1))
            if quantite <= 0:
                raise serializers.ValidationError(f"Ligne {i+1}: la quantité doit être supérieure à 0.")

            fmt = self._resolve_format(ligne, for_update=False)
            if not fmt:
                raise serializers.ValidationError(
                    f"Ligne {i+1}: produit ou format indisponible actuellement."
                )

            # Accumuler la demande sur le format direct
            if fmt.id not in demand_per_format:
                demand_per_format[fmt.id] = {'fmt': fmt, 'qty': 0}
            demand_per_format[fmt.id]['qty'] += quantite

            is_pack = bool(fmt.parfum.is_pack or 'pack' in (fmt.type_format or '').lower())
            if not is_pack:
                # Flacon individuel
                pid = fmt.parfum_id
                if pid not in demand_per_perfume:
                    demand_per_perfume[pid] = {'parfum': fmt.parfum, 'qty': 0}
                demand_per_perfume[pid]['qty'] += quantite
            else:
                # Pour les packs, vérifier les fragrances choisies
                frags = ligne.get('fragrances_choisies') or []
                if isinstance(frags, str):
                    frags = [f.strip() for f in frags.split(',') if f.strip()]
                for frag_name in frags:
                    if not frag_name:
                        continue
                    parfum_obj = Parfum.objects.filter(nom__iexact=frag_name.strip()).first()
                    if parfum_obj:
                        pid = parfum_obj.id
                        if pid not in demand_per_perfume:
                            demand_per_perfume[pid] = {'parfum': parfum_obj, 'qty': 0}
                        demand_per_perfume[pid]['qty'] += quantite

        # 1. Vérification des formats commandés
        for fmt_id, info in demand_per_format.items():
            fmt = info['fmt']
            qty = info['qty']
            if fmt.stock <= 0:
                raise serializers.ValidationError(
                    f"Le produit '{fmt.parfum.nom}' ({fmt.get_type_format_display()}) est actuellement en rupture de stock."
                )
            if fmt.stock < qty:
                raise serializers.ValidationError(
                    f"Stock insuffisant pour '{fmt.parfum.nom}' : seulement {fmt.stock} disponible(s) alors que votre commande en contient {qty}."
                )

        # 2. Vérification des stocks de chaque parfum (utilisé seul ou dans les packs)
        for pid, info in demand_per_perfume.items():
            parfum_obj = info['parfum']
            qty = info['qty']
            flacon_fmt = parfum_obj.formats.filter(type_format='flacon_250').first() or parfum_obj.formats.first()
            if flacon_fmt:
                if flacon_fmt.stock <= 0:
                    raise serializers.ValidationError(
                        f"Le parfum '{parfum_obj.nom}' est en rupture de stock (indisponible seul ou dans un pack)."
                    )
                if flacon_fmt.stock < qty:
                    raise serializers.ValidationError(
                        f"Stock insuffisant pour le parfum '{parfum_obj.nom}' : seulement {flacon_fmt.stock} flacon(s) disponible(s) en stock (vous en avez commandé {qty} au total)."
                    )

        return value

    @transaction.atomic
    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes')

        # Calcul automatique des frais de livraison: Casablanca = 0 DH, autres villes = 20 DH
        ville_clean = validated_data.get('ville', '').strip().lower()
        frais = 0 if 'casablanca' in ville_clean else 20

        # Nettoyage du numéro de téléphone
        raw_tel = validated_data.get('telephone', '').strip()
        validated_data['telephone'] = raw_tel[:20] if raw_tel else 'Non renseigné'

        commande = Commande.objects.create(
            frais_livraison=frais,
            **validated_data
        )

        total = 0.0
        items_info = []

        for ligne_data in lignes_data:
            quantite = max(1, int(ligne_data.get('quantite', 1)))
            fmt = self._resolve_format(ligne_data, for_update=True)

            if not fmt:
                continue

            if fmt.stock < quantite:
                raise serializers.ValidationError(
                    f"Stock insuffisant pour '{fmt.parfum.nom}' : seulement {fmt.stock} restant(s)."
                )

            # Créer la ligne avec les fragrances choisies par le client
            fragrances_raw = ligne_data.get('fragrances_choisies', '')
            if isinstance(fragrances_raw, list):
                fragrances_list = fragrances_raw
                fragrances_str = ', '.join(fragrances_raw)
            else:
                fragrances_str = str(fragrances_raw)
                fragrances_list = [f.strip() for f in fragrances_str.split(',') if f.strip()]

            # Prix effectif (si promo)
            has_promo = fmt.prix_promo and fmt.prix_promo > 0 and fmt.prix_promo < fmt.prix
            prix_ligne = fmt.prix_promo if has_promo else fmt.prix

            LigneCommande.objects.create(
                commande=commande,
                format=fmt,
                quantite=quantite,
                prix_unitaire=prix_ligne,
                fragrances_choisies=fragrances_str or '',
            )

            # Décrémenter le stock du format commandé
            fmt.stock -= quantite
            fmt.save(update_fields=['stock'])

            # Si c'est un pack, décrémenter aussi le stock de chaque fragrance choisie
            is_pack = bool(fmt.parfum.is_pack or 'pack' in (fmt.type_format or '').lower())
            if is_pack and fragrances_list:
                for frag_name in fragrances_list:
                    p_obj = Parfum.objects.filter(nom__iexact=frag_name.strip()).first()
                    if p_obj:
                        frag_fmt = (
                            Format.objects.select_for_update().filter(parfum=p_obj, type_format='flacon_250').first()
                            or Format.objects.select_for_update().filter(parfum=p_obj).first()
                        )
                        if frag_fmt:
                            frag_fmt.stock = max(0, frag_fmt.stock - quantite)
                            frag_fmt.save(update_fields=['stock'])

            items_info.append({
                'is_pack': is_pack,
                'prix': float(prix_ligne),
                'quantite': quantite,
            })

            total += float(prix_ligne) * quantite

        # Calculer et appliquer la remise de packs automatique si éligible
        bundle_discount, discount_note = calculate_gels_bundle_discount(items_info)
        final_total = max(0.0, total - bundle_discount) + frais

        commande.total = final_total
        if discount_note:
            if commande.notes:
                commande.notes = f"{commande.notes} | [{discount_note}]"
            else:
                commande.notes = f"[{discount_note}]"
            commande.save(update_fields=['total', 'notes'])
        else:
            commande.save(update_fields=['total'])

        return commande


class CommandeListSerializer(serializers.ModelSerializer):
    nombre_articles = serializers.SerializerMethodField()

    class Meta:
        model = Commande
        fields = [
            'id', 'nom_client', 'telephone', 'ville', 'frais_livraison',
            'statut', 'total', 'nombre_articles', 'created_at',
        ]

    def get_nombre_articles(self, obj):
        return obj.lignes.count()


class CommandeDetailSerializer(serializers.ModelSerializer):
    lignes = LigneCommandeSerializer(many=True, read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model = Commande
        fields = [
            'id', 'nom_client', 'telephone', 'adresse', 'ville', 'frais_livraison',
            'statut', 'statut_display', 'notes', 'total', 'lignes',
            'created_at', 'updated_at',
        ]


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'nom', 'email', 'telephone', 'message', 'lu', 'created_at']
        read_only_fields = ['id', 'lu', 'created_at']

