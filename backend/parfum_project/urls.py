from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from django.views.static import serve
from django.urls import re_path

from parfum_project.db_storage import serve_media_from_db
from parfum_project.auth_views import UserProfileView, ChangePasswordView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/profile/', UserProfileView.as_view(), name='auth_profile'),
    path('api/auth/change-password/', ChangePasswordView.as_view(), name='auth_change_password'),
    path('api/catalog/', include('catalog.urls')),
    path('api/orders/', include('orders.urls')),
    # Fallback si le préfixe /api est réécrit par Vercel
    path('token/', TokenObtainPairView.as_view()),
    path('token/refresh/', TokenRefreshView.as_view()),
    path('auth/profile/', UserProfileView.as_view()),
    path('auth/change-password/', ChangePasswordView.as_view()),
    path('catalog/', include('catalog.urls')),
    path('orders/', include('orders.urls')),
    # Servir les fichiers media depuis Supabase / base de données
    re_path(r'^media/(?P<path>.*)$', serve_media_from_db),
    re_path(r'^api/media/(?P<path>.*)$', serve_media_from_db),
]
