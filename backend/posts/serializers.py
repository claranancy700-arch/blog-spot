from rest_framework import serializers
from .models import Post, Profile, Follow, Comment, Like, Tag, Message
from django.contrib.auth import get_user_model
User = get_user_model()


class ProfileSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Profile
        fields = ['bio', 'avatar_url']

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.avatar and hasattr(obj.avatar, 'url'):
            url = obj.avatar.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return ''


class PostSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)
    author_profile = ProfileSerializer(source='author.profile', read_only=True)
    body_html = serializers.SerializerMethodField(read_only=True)
    video = serializers.SerializerMethodField(read_only=True)
    tags = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True
    )
    tags_display = serializers.SlugRelatedField(
        many=True,
        slug_field='name',
        source='tags',
        read_only=True
    )
    likes_count = serializers.SerializerMethodField(read_only=True)
    liked = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Post
        fields = [
            'id', 'author', 'author_username', 'author_profile', 'title', 'body', 'body_html',
            'image', 'video_url', 'video_file', 'video', 'tags', 'tags_display',
            'likes_count', 'liked',
            'created', 'updated', 'published'
        ]
        read_only_fields = ['id', 'created', 'updated', 'author_username', 'body_html', 'video', 'tags_display']

    def get_body_html(self, obj):
        import markdown as md
        return md.markdown(obj.body or '', extensions=['extra', 'nl2br'])

    def get_video(self, obj):
        # prefer uploaded file URL, fallback to plain URL field
        if obj.video_file:
            try:
                return f'http://localhost:8000{obj.video_file.url}'
            except Exception:
                pass
        return obj.video_url

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def create(self, validated_data):
        tags_data = validated_data.pop('tags', [])
        post = Post.objects.create(**validated_data)
        for name in tags_data:
            if name:  # Skip empty strings
                tag, _ = Tag.objects.get_or_create(name=name.strip())
                post.tags.add(tag)
        return post

    def update(self, instance, validated_data):
        tags_data = validated_data.pop('tags', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tags_data is not None:
            instance.tags.clear()
            for name in tags_data:
                if name:
                    tag, _ = Tag.objects.get_or_create(name=name.strip())
                    instance.tags.add(tag)
        return instance


class CommentSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'post', 'author', 'author_username', 'body', 'created']
        read_only_fields = ['id', 'author', 'author_username', 'created']


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    recipient_username = serializers.CharField(source='recipient.username', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_username', 'recipient', 'recipient_username', 'body', 'read', 'read_at', 'created']
        read_only_fields = ['id', 'sender', 'sender_username', 'recipient_username', 'read', 'read_at', 'created']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already taken')
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already in use')
        return value

    def create(self, validated_data):
        # create user immediately active (no email confirmation)
        user = User(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            is_active=True,
        )
        user.set_password(validated_data['password'])
        user.save()
        return user
