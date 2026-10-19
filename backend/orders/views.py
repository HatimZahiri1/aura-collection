from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Commande, ContactMessage
from .serializers import (
    CommandeCreateSerializer, CommandeListSerializer, CommandeDetailSerializer,
    ContactMessageSerializer,
)


class CommandeViewSet(viewsets.ModelViewSet):
    queryset = Commande.objects.prefetch_related('lignes', 'lignes__format', 'lignes__format__parfum')

    def get_queryset(self):
        qs = super().get_queryset()
        from django.utils import timezone
        from datetime import timedelta
        now = timezone.now()

        periode = self.request.query_params.get('periode')
        if periode in ['jour', 'today']:
            qs = qs.filter(created_at__date=now.date())
        elif periode in ['semaine', 'week']:
            week_start = (now - timedelta(days=7)).replace(hour=0, minute=0, second=0)
            qs = qs.filter(created_at__gte=week_start)
        elif periode in ['mois', 'month']:
            month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            qs = qs.filter(created_at__gte=month_start)

        statut = self.request.query_params.get('statut')
        if statut:
            qs = qs.filter(statut=statut)

        ordering = self.request.query_params.get('ordering')
        if ordering:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by('-created_at')

        return qs

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_serializer_class(self):
        if self.action == 'create':
            return CommandeCreateSerializer
        if self.action == 'list':
            return CommandeListSerializer
        return CommandeDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        commande = serializer.save()
        return Response(
            CommandeDetailSerializer(commande, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    def partial_update(self, request, *args, **kwargs):
        """Permet à l'admin de modifier le statut."""
        instance = self.get_object()
        new_statut = request.data.get('statut')
        if new_statut and new_statut in dict(Commande.STATUT_CHOICES):
            instance.statut = new_statut
            instance.save(update_fields=['statut', 'updated_at'])
        return Response(CommandeDetailSerializer(instance, context={'request': request}).data)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def bulk_delete(self, request):
        """Suppression groupée de plusieurs commandes sélectionnées."""
        ids = request.data.get('ids', [])
        if not ids or not isinstance(ids, list):
            return Response(
                {'error': "Une liste d'identifiants 'ids' est requise."},
                status=status.HTTP_400_BAD_REQUEST
            )
        qs = Commande.objects.filter(id__in=ids)
        count = qs.count()
        qs.delete()
        return Response({
            'detail': f"{count} commande(s) supprimée(s) avec succès.",
            'deleted_count': count,
        })


class ContactMessageViewSet(viewsets.ModelViewSet):
    """Formulaire de contact: création publique, lecture admin."""
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def partial_update(self, request, *args, **kwargs):
        """Permet à l'admin de marquer comme lu."""
        instance = self.get_object()
        lu = request.data.get('lu')
        if lu is not None:
            instance.lu = lu
            instance.save(update_fields=['lu'])
        return Response(ContactMessageSerializer(instance).data)
