from django.contrib import admin
from .models import Post


def publish_posts(modeladmin, request, queryset):
    queryset.update(published=True)
publish_posts.short_description = 'Mark selected posts as published'


def unpublish_posts(modeladmin, request, queryset):
    queryset.update(published=False)
unpublish_posts.short_description = 'Mark selected posts as unpublished'


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'created', 'published')
    list_filter = ('published', 'created')
    search_fields = ('title', 'body', 'author__username')
    actions = [publish_posts, unpublish_posts]
