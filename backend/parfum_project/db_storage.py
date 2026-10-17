import os
import mimetypes
from django.core.files.storage import Storage
from django.core.files.base import ContentFile
from django.db import connection
from django.http import HttpResponse, HttpResponseNotFound
from django.utils.deconstruct import deconstructible

@deconstructible
class DatabaseMediaStorage(Storage):
    """
    Stocke et sert les fichiers médias directement via PostgreSQL (Supabase).
    Évite les erreurs de système de fichiers en lecture seule sur Vercel serverless.
    """
    def _clean_name(self, name):
        return str(name).replace('\\', '/').lstrip('/')

    def _save(self, name, content):
        clean_name = self._clean_name(name)
        if hasattr(content, 'chunks'):
            content_bytes = b''.join(chunk for chunk in content.chunks())
        elif hasattr(content, 'read'):
            content_bytes = content.read()
        else:
            content_bytes = bytes(content)

        mime_type, _ = mimetypes.guess_type(clean_name)
        mime_type = mime_type or 'application/octet-stream'

        try:
            with connection.cursor() as cursor:
                cursor.execute('''
                    INSERT INTO public.stored_media_files (name, content, mime_type, size)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (name) DO UPDATE SET content = EXCLUDED.content, size = EXCLUDED.size, mime_type = EXCLUDED.mime_type;
                ''', [clean_name, content_bytes, mime_type, len(content_bytes)])
        except Exception as e:
            # En cas de problème de connexion temporaire, log l'erreur
            print(f"[DatabaseMediaStorage] Save error for {clean_name}: {e}")

        return clean_name

    def _open(self, name, mode='rb'):
        clean_name = self._clean_name(name)
        try:
            with connection.cursor() as cursor:
                cursor.execute('SELECT content FROM public.stored_media_files WHERE name = %s', [clean_name])
                row = cursor.fetchone()
                if row and row[0]:
                    return ContentFile(bytes(row[0]), name=clean_name)
        except Exception as e:
            print(f"[DatabaseMediaStorage] Open error for {clean_name}: {e}")

        # Fallback fichier physique local si présent
        from django.conf import settings
        local_path = os.path.join(settings.MEDIA_ROOT, clean_name)
        if os.path.exists(local_path):
            with open(local_path, 'rb') as f:
                return ContentFile(f.read(), name=clean_name)

        raise FileNotFoundError(f"File '{clean_name}' not found in database or local media.")

    def exists(self, name):
        clean_name = self._clean_name(name)
        try:
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1 FROM public.stored_media_files WHERE name = %s', [clean_name])
                if cursor.fetchone():
                    return True
        except Exception:
            pass

        from django.conf import settings
        local_path = os.path.join(settings.MEDIA_ROOT, clean_name)
        return os.path.exists(local_path)

    def url(self, name):
        clean_name = self._clean_name(name)
        return f"/media/{clean_name}"

    def size(self, name):
        clean_name = self._clean_name(name)
        try:
            with connection.cursor() as cursor:
                cursor.execute('SELECT size FROM public.stored_media_files WHERE name = %s', [clean_name])
                row = cursor.fetchone()
                if row:
                    return row[0]
        except Exception:
            pass
        return 0

    def delete(self, name):
        clean_name = self._clean_name(name)
        try:
            with connection.cursor() as cursor:
                cursor.execute('DELETE FROM public.stored_media_files WHERE name = %s', [clean_name])
        except Exception as e:
            print(f"[DatabaseMediaStorage] Delete error: {e}")

    def get_available_name(self, name, max_length=None):
        return self._clean_name(name)


def serve_media_from_db(request, path):
    """Vue pour servir les fichiers médias depuis Supabase avec mise en cache CDN/navigateur."""
    clean_path = str(path).replace('\\', '/').lstrip('/')

    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT content, mime_type FROM public.stored_media_files WHERE name = %s', [clean_path])
            row = cursor.fetchone()
            if row and row[0]:
                content, mime_type = row
                res = HttpResponse(bytes(content), content_type=mime_type or 'image/jpeg')
                res['Cache-Control'] = 'public, max-age=31536000, immutable'
                return res
    except Exception as e:
        print(f"[serve_media_from_db] DB query error: {e}")

    # Fallback vers fichier local si disponible
    from django.conf import settings
    local_path = os.path.join(settings.MEDIA_ROOT, clean_path)
    if os.path.exists(local_path) and os.path.isfile(local_path):
        mime_type, _ = mimetypes.guess_type(local_path)
        with open(local_path, 'rb') as f:
            res = HttpResponse(f.read(), content_type=mime_type or 'image/jpeg')
            res['Cache-Control'] = 'public, max-age=31536000, immutable'
            return res

    return HttpResponseNotFound(f"Media file not found: {clean_path}")
