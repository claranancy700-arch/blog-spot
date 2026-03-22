import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCSRFToken } from '../csrf';

const API_BASE = 'http://localhost:8000/api';

export default function PostDetail({ currentUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`${API_BASE}/posts/${id}/`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPost(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`${API_BASE}/posts/${id}/comments/`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setCommentLoading(true);
    try {
      const res = await fetch(`${API_BASE}/posts/${id}/comments/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRFToken': getCSRFToken(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newComment }),
      });
      if (res.ok) {
        setNewComment('');
        fetchComments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCommentLoading(false);
    }
  };

  const toggleLike = async () => {
    if (!currentUser) return;
    setLikeLoading(true);
    try {
      const res = await fetch(`${API_BASE}/posts/${id}/like/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRFToken': getCSRFToken() },
      });
      if (res.ok) {
        const data = await res.json();
        setPost(p => ({ ...p, liked: data.liked, likes_count: data.count }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLikeLoading(false);
    }
  };

  if (loading || !post) return <p>Loading...</p>;

  return (
    <div className="post-detail">
      <h1>{post.title}</h1>
      <p className="post-meta">
        By <a href={`/user/${post.author_username}`}>{post.author_username}</a> on{' '}
        {new Date(post.created).toLocaleDateString()}
      </p>
      {post.image && <img src={post.image} alt="" className="post-image" />}
      {post.video && (
        <div className="post-video">
          <video src={post.video} controls style={{ maxWidth: '100%' }} />
        </div>
      )}
      <div dangerouslySetInnerHTML={{ __html: post.body_html || post.body }} />
      {post.tags && post.tags.length > 0 && (
        <div className="post-tags">
          {post.tags.map(t => (
            <button key={t} className="tag-btn" onClick={() => {
              navigate(`/?tag=${encodeURIComponent(t)}`);
            }}>
              #{t}
            </button>
          ))}
        </div>
      )}
      <div className="post-interactions">
        <button onClick={toggleLike} disabled={likeLoading || !currentUser}>
          {post.liked ? 'Unlike' : 'Like'} ({post.likes_count || 0})
        </button>
      </div>
      <h2>Comments</h2>
      {comments.map(c => (
        <div key={c.id} className="comment">
          <p><strong>{c.author_username}</strong> on {new Date(c.created).toLocaleString()}</p>
          <p>{c.body}</p>
        </div>
      ))}
      {currentUser ? (
        <form onSubmit={handleComment} className="comment-form">
          <textarea
            rows={3}
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Write a comment..."
          />
          <button type="submit" disabled={commentLoading}>
            {commentLoading ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <p><a href="/login">Log in</a> to comment.</p>
      )}
    </div>
  );
}
