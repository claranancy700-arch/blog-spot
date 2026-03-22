from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from rest_framework.response import Response
from django.contrib.auth import get_user_model, login
from django.db.models import Q
from django.utils import timezone
from .models import Post, Profile, Follow, Comment, Like, Tag, Message
from .serializers import PostSerializer, RegisterSerializer, ProfileSerializer, CommentSerializer, MessageSerializer
User = get_user_model()


class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().order_by('-created')
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Post.objects.all().order_by('-created')
        # search text
        search = self.request.GET.get('search')
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(body__icontains=search) |
                Q(author__username__icontains=search)
            )
        # tag filter
        tag = self.request.GET.get('tag')
        if tag:
            qs = qs.filter(tags__name=tag)
        # filter by video content
        has_video = self.request.GET.get('has_video')
        if has_video and has_video.lower() == 'true':
            qs = qs.filter(
                Q(video_file__isnull=False) |
                Q(video_url__isnull=False) & ~Q(video_url='')
            )
        # if requesting only following posts, and user is authenticated
        if self.request.user.is_authenticated and self.request.GET.get('following'):
            followees = self.request.user.following.values_list('followee_id', flat=True)
            qs = qs.filter(author_id__in=followees)
        # filter by explicit author id
        author_id = self.request.GET.get('author')
        if author_id:
            qs = qs.filter(author_id=author_id)
        return qs

    def perform_create(self, serializer):
        # set author to request user
        if self.request.user.is_authenticated:
            serializer.save(author=self.request.user)
        else:
            serializer.save()

    @action(detail=True, methods=['get', 'post'], permission_classes=[permissions.IsAuthenticatedOrReadOnly])
    def comments(self, request, pk=None):
        post = self.get_object()
        if request.method == 'GET':
            qs = post.comments.all().order_by('created')
            serializer = CommentSerializer(qs, many=True, context={'request': request})
            return Response(serializer.data)
        # POST create comment
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = CommentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(author=request.user, post=post)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        post = self.get_object()
        obj, created = Like.objects.get_or_create(post=post, user=request.user)
        if not created:
            obj.delete()
            return Response({'detail': 'unliked', 'liked': False, 'count': post.likes.count()})
        return Response({'detail': 'liked', 'liked': True, 'count': post.likes.count()})


@api_view(['GET'])
@ensure_csrf_cookie
def get_csrf(request):
    """Simple endpoint to set a CSRF cookie for frontend apps."""
    return Response({'detail': 'CSRF cookie set'})


@api_view(['GET'])
@permission_classes([AllowAny])
def tags(request):
    """Return list of available tags (names)."""
    names = list(Tag.objects.values_list('name', flat=True))
    return Response(names)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_profile(request, username):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    profile = ProfileSerializer(user.profile, context={'request': request}).data
    # count followers/following
    followers = user.followers.count()
    following = user.following.count()
    is_following = False
    if request.user.is_authenticated:
        is_following = Follow.objects.filter(follower=request.user, followee=user).exists()
    return Response({
        'username': user.username,
        'id': user.id,
        'profile': profile,
        'followers': followers,
        'following': following,
        'is_following': is_following,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_follow(request, username):
    try:
        target = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    if target == request.user:
        return Response({'error': 'Cannot follow yourself'}, status=status.HTTP_400_BAD_REQUEST)
    obj, created = Follow.objects.get_or_create(follower=request.user, followee=target)
    if not created:
        obj.delete()
        return Response({'detail': 'unfollowed'})
    return Response({'detail': 'followed'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def conversations(request):
    user = request.user
    # get messages involving this user, newest first
    messages = Message.objects.filter(Q(sender=user) | Q(recipient=user)).order_by('-created')
    partners = {}
    for msg in messages:
        partner = msg.recipient if msg.sender == user else msg.sender
        if partner.id not in partners:
            unread = Message.objects.filter(sender=partner, recipient=user, read=False).count()
            partners[partner.id] = {
                'id': partner.id,
                'username': partner.username,
                'last_message': msg.body,
                'last_message_at': msg.created,
                'sent_by_me': msg.sender == user,
                'unread_count': unread,
            }
    convo_list = sorted(partners.values(), key=lambda x: x['last_message_at'], reverse=True)
    for c in convo_list:
        c.pop('last_message_at', None)
    return Response(convo_list)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def messages_with_user(request, username):
    try:
        other = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user

    if request.method == 'POST':
        body = request.data.get('body', '').strip()
        if not body:
            return Response({'error': 'Message body is required'}, status=status.HTTP_400_BAD_REQUEST)
        message = Message.objects.create(sender=user, recipient=other, body=body)
        return Response(MessageSerializer(message, context={'request': request}).data, status=status.HTTP_201_CREATED)

    # Mark any unread messages addressed to current user in this thread as read
    unseen = Message.objects.filter(sender=other, recipient=user, read=False)
    if unseen.exists():
        unseen.update(read=True, read_at=timezone.now())

    msgs = Message.objects.filter(
        Q(sender=user, recipient=other) | Q(sender=other, recipient=user)
    ).order_by('created')
    serializer = MessageSerializer(msgs, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def message_counts(request):
    user = request.user
    unread_total = Message.objects.filter(recipient=user, read=False).count()
    inbox_total = Message.objects.filter(recipient=user).count()
    sent_total = Message.objects.filter(sender=user).count()
    return Response({
        'unread_total': unread_total,
        'inbox_total': inbox_total,
        'sent_total': sent_total,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # if account is active (no email confirmation), log in automatically
        if user.is_active:
            try:
                login(request, user)
            except Exception:
                pass
        # return the user's public data (password is write_only so excluded)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    """Invalidate the current session."""
    from django.contrib.auth import logout
    logout(request)
    return Response({'detail': 'Logged out'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """Allow authenticated user to change their password."""
    user = request.user
    old = request.data.get('old_password')
    new = request.data.get('new_password')
    if not user.check_password(old):
        return Response({'error': 'Old password incorrect'}, status=status.HTTP_400_BAD_REQUEST)
    if not new:
        return Response({'error': 'New password required'}, status=status.HTTP_400_BAD_REQUEST)
    user.set_password(new)
    user.save()
    return Response({'detail': 'Password changed'})


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset(request):
    """Send a password reset email (console backend in dev)."""
    from django.contrib.auth.forms import PasswordResetForm
    form = PasswordResetForm(request.data)
    if form.is_valid():
        form.save(
            request=request,
            use_https=request.is_secure(),
            email_template_name='password_reset_email.html',
        )
        return Response({'detail': 'Password reset email sent'})
    return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    """Endpoint to actually set a new password after clicking reset link."""
    uid = request.data.get('uid')
    token = request.data.get('token')
    new = request.data.get('new_password')
    if not uid or not token or not new:
        return Response({'error': 'uid, token, and new_password are required'}, status=status.HTTP_400_BAD_REQUEST)
    from django.contrib.auth.tokens import default_token_generator
    from django.utils.http import urlsafe_base64_decode
    from django.utils.encoding import force_str
    try:
        uid_decoded = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=uid_decoded)
    except Exception:
        return Response({'error': 'Invalid uid'}, status=status.HTTP_400_BAD_REQUEST)
    if not default_token_generator.check_token(user, token):
        return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)
    user.set_password(new)
    user.save()
    return Response({'detail': 'Password has been reset'})


@api_view(['GET'])
@permission_classes([AllowAny])
def confirm_email(request, uid, token):
    """Activate a new user account after email confirmation."""
    from django.contrib.auth.tokens import default_token_generator
    from django.utils.http import urlsafe_base64_decode
    from django.utils.encoding import force_str
    try:
        uid_decoded = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=uid_decoded)
    except Exception:
        return Response({'error': 'Invalid link'}, status=status.HTTP_400_BAD_REQUEST)
    if default_token_generator.check_token(user, token):
        user.is_active = True
        user.save()
        return Response({'detail': 'Email confirmed'})
    return Response({'error': 'Invalid or expired link'}, status=status.HTTP_400_BAD_REQUEST)
