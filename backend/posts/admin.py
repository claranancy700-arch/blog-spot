from django.contrib import admin
from .models import Post

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'created', 'published')
    list_filter = ('published', 'created')
    search_fields = ('title', 'body', 'author__username')
