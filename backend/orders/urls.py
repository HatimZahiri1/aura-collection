from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CommandeViewSet, ContactMessageViewSet

router = DefaultRouter()
router.register(r'commandes', CommandeViewSet)
router.register(r'contact', ContactMessageViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
