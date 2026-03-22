import React, { useState, useEffect } from 'react';
import PostForm from '../components/PostForm';
import PostList from '../components/PostList';
import { getCSRFToken } from '../csrf';
import { API_BASE } from '../config';

export default function Admin({ token, user }) {
  // note: this component renders the app's own administration/dashboard interface
  // which is different from Django's built-in /admin site located at http://localhost:8000/admin
  const [posts, setPosts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/posts/`, {
        credentials: 'include',
      });
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostSaved = () => {
    setShowForm(false);
    setEditingPost(null);
    fetchPosts();
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setShowForm(true);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;

    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-CSRFToken': getCSRFToken(),
        },
      });

      if (res.ok) {
        fetchPosts();
      }
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  return (
    <div className="admin-page">
      <h1>Admin Dashboard</h1>
      <p>Welcome, <strong>{user.username}</strong></p>

      <div className="admin-toolbar">
        <button
          onClick={() => {
            setEditingPost(null);
            setShowForm(!showForm);
          }}
          className="btn-primary"
        >
          {showForm ? 'Close' : 'Create New Post'}
        </button>
      </div>

      {showForm && (
        <PostForm
          userId={user.id}
          post={editingPost}
          onPostSaved={handlePostSaved}
        />
      )}

      <div className="admin-posts">
        <h2>Your Posts</h2>
        {loading ? (
          <p>Loading...</p>
        ) : posts.length > 0 ? (
          <div className="posts-table">
            {posts.map((post) => (
              <div key={post.id} className="post-row">
                <div className="post-info">
                  <h3>{post.title}</h3>
                  {post.image && (
                    <div className="post-thumb">
                      <img src={post.image} alt="" />
                    </div>
                  )}
                  {post.video && (
                    <div className="post-thumb">
                      <video src={post.video} style={{maxWidth:'100%'}} />
                    </div>
                  )}
                  <p className="post-meta">
                    {new Date(post.created).toLocaleDateString()} •{' '}
                    <span className={post.published ? 'published' : 'draft'}>
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                  </p>
                </div>
                <div className="post-actions">
                  <button onClick={() => handleEditPost(post)} className="btn-edit">Edit</button>
                  <button onClick={() => handleDeletePost(post.id)} className="btn-delete">Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No posts created yet.</p>
        )}
      </div>
    </div>
  );
}
