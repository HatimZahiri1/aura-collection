from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MarqueViewSet, ParfumViewSet, FormatViewSet, StatsView, CollectionViewSet

router = DefaultRouter()
router.register(r'marques', MarqueViewSet)
router.register(r'collections', CollectionViewSet)
router.register(r'parfums', ParfumViewSet)
router.register(r'formats', FormatViewSet)
router.register(r'stats', StatsView, basename='stats')

urlpatterns = [
    path('', include(router.urls)),
]
