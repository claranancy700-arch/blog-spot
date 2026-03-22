import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCSRFToken } from '../csrf';
import PostGrid from '../components/PostGrid';

const API_BASE = 'http://localhost:8000/api';

export default function Profile({ user, setUser }) {
  const [email, setEmail] = useState(user.email || '');
  const [firstName, setFirstName] = useState(user.first_name || '');
  const [lastName, setLastName] = useState(user.last_name || '');
  const [bio, setBio] = useState((user.profile && user.profile.bio) || '');
  const [avatarUrl, setAvatarUrl] = useState((user.profile && user.profile.avatar) || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserPosts();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const res = await fetch(`${API_BASE}/users/${user.username}/`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to fetch profile');
      }
      const data = await res.json();
      setFollowers(data.followers || 0);
      setFollowing(data.following || 0);
      if (data.profile) {
        setBio(data.profile.bio || '');
        setAvatarUrl(data.profile.avatar_url || '');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      setPostsLoading(true);
      const response = await fetch(`${API_BASE}/posts/?author=${user.id}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setPosts(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      let options = {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'X-CSRFToken': getCSRFToken(),
        },
      };
      if (avatarFile) {
        const body = new FormData();
        body.append('email', email);
        body.append('first_name', firstName);
        body.append('last_name', lastName);
        body.append('bio', bio);
        body.append('avatar', avatarFile);
        options.body = body;
      } else {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify({ email, first_name: firstName, last_name: lastName, bio });
      }
      const res = await fetch(`${API_BASE}/user/`, options);
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Failed to update');
      }
      const data = await res.json();
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      setAvatarUrl(data.profile?.avatar || '');
      setMessage('Profile updated successfully');
      await fetchProfile();
    } catch (err) {
      setMessage(err.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const totalPosts = posts?.length || 0;
  const activityCount = totalPosts + followers + following;

  if (!user) {
    return <p>Please log in to view your profile.</p>;
  }

  const navigate = useNavigate();

  return (
    <div className="profile-page">
      {/* Header Image Section */}
      <div className="profile-header-image">
        <img
          src={avatarUrl || 'https://picsum.photos/800/400?random='}
          alt="profile header"
        />
      </div>

      {/* Profile Info */}
      <div className="profile-info-container">
        {message && <p className="info-message">{message}</p>}

        {/* Avatar + Name + Edit */}
        <div className="profile-header-info">
          <div className="profile-avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" />
            ) : (
              <div className="profile-avatar-placeholder">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="profile-header-text">
            <h1 className="profile-name">{`${firstName || ''} ${lastName || ''}`.trim() || user.username}</h1>
            <p className="profile-username">@{user.username}</p>
          </div>
        </div>

        {/* Stats Grid */}
        {profileLoading ? (
          <p className="loading-stats">Loading stats...</p>
        ) : (
          <div className="stats-grid-section">
            <div className="stat-item">
              <div className="stat-number">{followers}</div>
              <div className="stat-label">Followers</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">{following}</div>
              <div className="stat-label">Following</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">{totalPosts}</div>
              <div className="stat-label">Posts</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">{activityCount}</div>
              <div className="stat-label">Activity</div>
            </div>
          </div>
        )}

        {/* Bio Section */}
        <div className="profile-bio-section">
          <p className="profile-bio-quote">{bio || 'No bio yet. Add one to show here!'}</p>
        </div>
      </div>

      {/* Posts Section */}
      <div className="profile-posts-section">
        <h2>Your Posts</h2>
        {postsLoading ? (
          <p className="loading-posts">Loading posts...</p>
        ) : (
          <PostGrid posts={posts} />
        )}
      </div>
    </div>
  );
}
