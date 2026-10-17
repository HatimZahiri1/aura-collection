import django_filters
from .models import Parfum


class ParfumFilter(django_filters.FilterSet):
    prix_min = django_filters.NumberFilter(method='filter_prix_min')
    prix_max = django_filters.NumberFilter(method='filter_prix_max')
    marque = django_filters.NumberFilter(field_name='marque__id')
    marque_nom = django_filters.CharFilter(field_name='marque__nom', lookup_expr='icontains')

    class Meta:
        model = Parfum
        fields = ['genre', 'famille_olfactive', 'concentration', 'marque', 'actif', 'mis_en_avant', 'is_pack', 'is_promo']

    def filter_prix_min(self, queryset, name, value):
        """Filtre les parfums ayant au moins un format >= prix_min."""
        return queryset.filter(formats__prix__gte=value).distinct()

    def filter_prix_max(self, queryset, name, value):
        """Filtre les parfums ayant au moins un format <= prix_max."""
        return queryset.filter(formats__prix__lte=value).distinct()
