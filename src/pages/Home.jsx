import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import PostList from '../components/PostList';

const API_BASE = 'http://localhost:8000/api';

export default function Home({ token, user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [page, setPage] = useState(1);
  const location = useLocation();
  const [showFollowing, setShowFollowing] = useState(false);
  const [tagFilter, setTagFilter] = useState('');

  useEffect(() => {
    // parse url params on initial load
    const params = new URLSearchParams(location.search);
    const tag = params.get('tag');
    if (tag) setTagFilter(tag);
    // Reset pagination when filters change
    setPosts([]);
    setPage(1);
    setHasNextPage(true);
    fetchPosts({ following: showFollowing, tag: tag || tagFilter, reset: true });
  }, [location.search, showFollowing]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (loadingMore || !hasNextPage) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Load more when user is within 200px of bottom
    if (scrollTop + windowHeight >= documentHeight - 200) {
      loadMorePosts();
    }
  }, [loadingMore, hasNextPage]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const fetchPosts = async ({ following = false, tag = '', pageNum = 1, reset = false } = {}) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      let url = `${API_BASE}/posts/?page=${pageNum}`;
      const params = [];
      if (following) params.push('following=1');
      if (tag) params.push(`tag=${encodeURIComponent(tag)}`);
      if (params.length) url += '&' + params.join('&');

      const res = await fetch(url, {
        credentials: 'include',
      });
      const data = await res.json();

      if (reset) {
        setPosts(data.results || data);
      } else {
        setPosts(prev => [...prev, ...(data.results || data)]);
      }

      // Check if there are more pages
      setHasNextPage(!!data.next);
      if (!reset) {
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMorePosts = () => {
    if (!loadingMore && hasNextPage) {
      fetchPosts({
        following: showFollowing,
        tag: tagFilter,
        pageNum: page + 1
      });
    }
  };

  if (loading) {
    return (
      <div className="home-loading">
        <div className="loading-spinner"></div>
        <p>Loading your feed...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Stories/Highlights Section */}
      <div className="stories-section">
        <div className="stories-container">
          <div className="story-item featured">
            <div className="story-avatar">
              <span>📌</span>
            </div>
            <span className="story-label">Featured</span>
          </div>
          <div className="story-item">
            <div className="story-avatar">
              <span>💡</span>
            </div>
            <span className="story-label">Ideas</span>
          </div>
          <div className="story-item">
            <div className="story-avatar">
              <span>🎨</span>
            </div>
            <span className="story-label">Design</span>
          </div>
          <div className="story-item">
            <div className="story-avatar">
              <span>📚</span>
            </div>
            <span className="story-label">Tutorials</span>
          </div>
          <div className="story-item">
            <div className="story-avatar">
              <span>🚀</span>
            </div>
            <span className="story-label">Projects</span>
          </div>
        </div>
      </div>

      {/* Main Feed */}
      <div className="feed-container">
        {/* Feed Header */}
        <div className="feed-header">
          <h1 className="feed-title">Home</h1>
          <div className="feed-controls">
            {token && (
              <button
                className={`feed-toggle ${showFollowing ? 'active' : ''}`}
                onClick={() => setShowFollowing(!showFollowing)}
              >
                {showFollowing ? 'Following' : 'For You'}
              </button>
            )}
          </div>
        </div>

        {/* Posts Feed */}
        <div className="posts-feed">
          {posts.length > 0 ? (
            <PostList posts={posts.filter(p => p.published)} onTagClick={setTagFilter} />
          ) : (
            <div className="empty-feed">
              <div className="empty-icon">📝</div>
              <h3>No posts yet</h3>
              <p>Be the first to share something amazing!</p>
            </div>
          )}
          {loadingMore && (
            <div className="loading-more">
              <div className="loading-spinner"></div>
              <span>Loading more posts...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
