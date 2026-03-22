from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth.views import LoginView, LogoutView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from posts.models import Profile
import json

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Login endpoint - authenticate user and return their info"""
    try:
        data = request.data
        # debug logging
        print(f"DEBUG login request data: {data}")
        username = data.get('username')
        password = data.get('password')
        print(f"DEBUG login attempt username={username!r} password={password!r}")
        
        # try authenticating by username first
        user = authenticate(username=username, password=password)
        if user is None:
            # fallback: if the identifier looks like an email, try finding the user and authenticate again
            from django.contrib.auth.models import User as DjangoUser
            try:
                candidate = DjangoUser.objects.get(email=username)
            except DjangoUser.DoesNotExist:
                candidate = None
            if candidate:
                user = authenticate(username=candidate.username, password=password)
        if user is not None:
            if not user.is_active:
                # provide guidance
                return Response({'error': 'Account inactive. Please confirm your email or contact support.'}, status=403)
            from django.contrib.auth import login
            login(request, user)
            return Response({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            })
        else:
            return Response({'error': 'Invalid credentials'}, status=401)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['GET','PATCH'])
@permission_classes([IsAuthenticated])
def user_detail(request):
    """Return or update current user info (and profile)."""
    user = request.user
    if request.method == 'PATCH':
        # update basic fields
        user.email = request.data.get('email', user.email)
        user.first_name = request.data.get('first_name', user.first_name)
        user.last_name = request.data.get('last_name', user.last_name)
        user.save()
        # profile fields - get or create profile
        profile, created = Profile.objects.get_or_create(user=user)
        bio = request.data.get('bio')
        if bio is not None:
            profile.bio = bio
        # avatar file may come from request.FILES
        if hasattr(request, 'FILES') and 'avatar' in request.FILES:
            profile.avatar = request.FILES['avatar']
        profile.save()
    resp = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
    }
    # include profile data - get or create
    profile, _ = Profile.objects.get_or_create(user=user)
    resp['profile'] = {
        'bio': profile.bio,
        'avatar_url': request.build_absolute_uri(profile.avatar.url) if profile.avatar else ''
    }
    return Response(resp)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('posts.urls')),
    path('api/login/', login_view),
    path('api/user/', user_detail),
]

# serve media during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

