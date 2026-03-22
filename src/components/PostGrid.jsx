import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PostGrid({ posts = [] }) {
  const navigate = useNavigate();
  const [likedPosts, setLikedPosts] = useState(new Set());

  const handleLike = (postId) => {
    setLikedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  if (!posts || posts.length === 0) {
    return <p className="text-center py-8">No posts yet</p>;
  }

  return (
    <div className="post-grid">
      {posts.map((post) => (
        <div
          key={post.id}
          className="post-grid-card"
          onClick={() => navigate(`/post/${post.id}`)}
        >
          {/* Card Image */}
          <div className="post-grid-image">
            {post.image ? (
              <img src={post.image} alt={post.title} />
            ) : post.video ? (
              <video src={post.video} />
            ) : (
              <div className="post-grid-placeholder">
                <span>{post.title.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>

          {/* Card Info */}
          <div className="post-grid-info">
            <h3 className="post-grid-title">{post.title}</h3>

            {/* Stats Row */}
            <div className="post-grid-stats">
              <div className="stat-item">
                <i className="fa-solid fa-eye"></i>
                <span>{post.likes_count || 0}</span>
              </div>
              <div className="stat-item">
                <i className="fa-solid fa-message"></i>
                <span>{post.comments?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
