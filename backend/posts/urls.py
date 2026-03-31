from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PostViewSet,
    register,
    get_csrf,
    tags,
    logout_view,
    change_password,
    password_reset,
    password_reset_confirm,
    confirm_email,
    public_profile,
    toggle_follow,
    user_followers,
    user_following,
    conversations,
    message_counts,
    messages_with_user,
)

router = DefaultRouter()
router.register(r'posts', PostViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('csrf/', get_csrf),
    path('register/', register),
    path('logout/', logout_view),
    path('change_password/', change_password),
    path('password_reset/', password_reset),
    path('password_reset_confirm/', password_reset_confirm),
    path('confirm_email/<str:uid>/<str:token>/', confirm_email),
    path('users/<str:username>/', public_profile),
    path('users/<str:username>/follow/', toggle_follow),
    path('users/<str:username>/followers/', user_followers),
    path('users/<str:username>/following/', user_following),
    path('messages/', conversations),
    path('messages/counts/', message_counts),
    path('messages/<str:username>/', messages_with_user),
    path('tags/', tags),
]
