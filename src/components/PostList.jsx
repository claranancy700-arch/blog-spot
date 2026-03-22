import React, { useState } from 'react';

export default function PostList({ posts, onTagClick }) {
  const [likedPosts, setLikedPosts] = useState(new Set());

  const handleLike = (postId) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  return (
    <div className="post-list">
      {posts.map((post) => (
        <div key={post.id} className="post-card">
          {/* Post Header */}
          <div className="post-header">
            <div className="post-author">
              {post.author_profile && post.author_profile.avatar_url ? (
                <img
                  src={post.author_profile.avatar_url}
                  alt="avatar"
                  className="author-avatar"
                />
              ) : (
                <div className="author-avatar-placeholder">
                  {post.author_username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="author-info">
                <a href={`/user/${post.author_username}`} className="author-name">
                  {post.author_username}
                </a>
                <span className="post-time">
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <button className="post-menu">⋯</button>
          </div>

          {/* Post Content */}
          <div className="post-content">
            {post.image && (
              <div className="post-image">
                <img src={post.image} alt="" />
              </div>
            )}
            {post.video && (
              <div className="post-video">
                <video
                  src={post.video}
                  loop
                  playsInline
                  preload="metadata"
                  onMouseEnter={(e) => e.target.play()}
                  onMouseLeave={(e) => e.target.pause()}
                />
              </div>
            )}
            <div className="post-text">
              <h2 className="post-title">
                <a href={`/post/${post.id}`}>{post.title}</a>
              </h2>
              <div
                className="post-body"
                dangerouslySetInnerHTML={{ __html: post.body_html || post.body }}
              />
            </div>
          </div>

          {/* Post Actions */}
          <div className="post-actions">
            <div className="action-buttons">
              <button
                className={`action-btn like-btn ${likedPosts.has(post.id) ? 'liked' : ''}`}
                onClick={() => handleLike(post.id)}
                aria-label="Like"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
              <button className="action-btn comment-btn" aria-label="Comment">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </button>
              <button className="action-btn share-btn" aria-label="Share">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                  <polyline points="16 6 12 2 8 6"></polyline>
                  <line x1="12" y1="2" x2="12" y2="14"></line>
                </svg>
              </button>
            </div>
            <button className="action-btn bookmark-btn" aria-label="Bookmark">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </button>
          </div>

          {/* Post Stats */}
          <div className="post-stats">
            <span className="likes-count">
              {likedPosts.has(post.id) ? '1 like' : '0 likes'}
            </span>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="post-tags">
              {post.tags.map((tag) => (
                <button
                  key={tag}
                  className="tag-btn"
                  onClick={() => onTagClick && onTagClick(tag)}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
