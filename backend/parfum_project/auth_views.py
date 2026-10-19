from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError


class UserProfileView(APIView):
    """
    Gestion du profil administrateur :
    - GET : Récupère les infos de l'utilisateur connecté
    - PATCH / PUT : Met à jour le nom d'utilisateur et l'email
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email or '',
            'is_superuser': user.is_superuser,
            'date_joined': user.date_joined,
            'last_login': user.last_login,
        })

    def patch(self, request):
        user = request.user
        data = request.data

        new_username = data.get('username')
        if new_username is not None:
            new_username = str(new_username).strip()
            if len(new_username) < 3:
                return Response(
                    {'username': ["Le nom d'utilisateur doit comporter au moins 3 caractères."]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if User.objects.filter(username__iexact=new_username).exclude(pk=user.pk).exists():
                return Response(
                    {'username': ["Ce nom d'utilisateur est déjà utilisé par un autre compte."]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.username = new_username

        if 'email' in data:
            user.email = str(data.get('email', '')).strip()

        user.save()

        # Nouveaux tokens JWT pour synchroniser la session
        refresh = RefreshToken.for_user(user)

        return Response({
            'detail': "Profil mis à jour avec succès.",
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email or '',
                'is_superuser': user.is_superuser,
            },
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })

    def put(self, request):
        return self.patch(request)


class ChangePasswordView(APIView):
    """
    Changement du mot de passe administrateur :
    - POST : Vérifie l'ancien mot de passe et applique le nouveau mot de passe
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data

        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        confirm_password = data.get('confirm_password', '')

        # 1. Vérification mot de passe actuel
        if not current_password:
            return Response(
                {'current_password': ["Veuillez renseigner votre mot de passe actuel."]},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not user.check_password(current_password):
            return Response(
                {'current_password': ["Le mot de passe actuel est incorrect."]},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Vérification nouveau mot de passe
        if not new_password:
            return Response(
                {'new_password': ["Veuillez renseigner un nouveau mot de passe."]},
                status=status.HTTP_400_BAD_REQUEST
            )
        if len(new_password) < 6:
            return Response(
                {'new_password': ["Le nouveau mot de passe doit comporter au moins 6 caractères."]},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Confirmation
        if new_password != confirm_password:
            return Response(
                {'confirm_password': ["Les deux nouveaux mots de passe ne correspondent pas."]},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Enregistrement sécurisé
        user.set_password(new_password)
        user.save()

        # 5. Régénération automatique des tokens pour maintenir la session connectée
        refresh = RefreshToken.for_user(user)

        return Response({
            'detail': "Mot de passe modifié avec succès.",
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })
