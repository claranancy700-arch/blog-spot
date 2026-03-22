import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PostGrid from '../components/PostGrid';
import { getCSRFToken } from '../csrf';
import { API_BASE } from '../config';

export default function UserPage({ currentUser }) {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [username]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/users/${username}/`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setIsFollowing(data.is_following);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      // first get the user's id (profile) then query posts
      const res = await fetch(`${API_BASE}/users/${username}/`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.id) {
          const p = await fetch(`${API_BASE}/posts/?author=${data.id}`, { credentials: 'include' });
          const pst = await p.json();
          setPosts(pst.filter(p=>p.published));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/${username}/follow/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRFToken': getCSRFToken(),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(!isFollowing);
        // optionally adjust followers count
        setProfile(prev => prev ? { ...prev, followers: prev.followers + (isFollowing ? -1 : 1) } : prev);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFollowLoading(false);
    }
  };

  if (!profile) return <p>Loading profile...</p>;

  return (
    <div className="user-page">
      {/* Header Image Section */}
      <div className="profile-header-image">
        <img
          src={profile.profile?.avatar_url || 'https://picsum.photos/800/400?random='}
          alt="profile header"
        />
      </div>

      {/* Profile Info */}
      <div className="profile-info-container">
        {/* Avatar + Name */}
        <div className="profile-header-info">
          <div className="profile-avatar">
            {profile.profile?.avatar_url ? (
              <img src={profile.profile.avatar_url} alt="avatar" />
            ) : (
              <div className="profile-avatar-placeholder">
                {profile.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="profile-header-text">
            <h1 className="profile-name">
              {profile.first_name && profile.last_name
                ? `${profile.first_name} ${profile.last_name}`
                : profile.username}
            </h1>
            <p className="profile-username">@{profile.username}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid-section">
          <div className="stat-item">
            <div className="stat-number">{profile.followers || 0}</div>
            <div className="stat-label">Followers</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number">{profile.following || 0}</div>
            <div className="stat-label">Following</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number">{posts.length}</div>
            <div className="stat-label">Posts</div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="profile-bio-section">
          <p className="profile-bio-quote">{profile.profile?.bio || 'No bio yet'}</p>
        </div>
      </div>

      {/* Posts Section */}
      <div className="profile-posts-section">
        <h2>Posts</h2>
        {loading ? (
          <p className="loading-posts">Loading posts...</p>
        ) : (
          <PostGrid posts={posts} />
        )}
      </div>

      {/* Follow Button (if not own profile) */}
      {currentUser && currentUser.username !== profile.username && (
        <div className="profile-action-section">
          <button
            onClick={() => navigate(`/messages/${profile.username}`)}
            className="message-btn"
          >
            Message
          </button>
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className="follow-btn"
          >
            <i className="fa-solid fa-plus"></i>
            {isFollowing ? 'UNFOLLOW' : 'FOLLOW'}
          </button>
        </div>
      )}
    </div>
  );
}