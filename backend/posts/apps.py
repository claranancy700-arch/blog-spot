from django.apps import AppConfig


class PostsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'posts'
    def ready(self):
        # import signals so they get registered
        from . import signals  # noqa: F401