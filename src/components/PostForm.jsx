import React, { useState, useEffect } from 'react';
import { getCSRFToken } from '../csrf';

const API_BASE = 'http://localhost:8000/api';

export default function PostForm({ userId, post, onPostSaved }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [published, setPublished] = useState(false);
  const [tags, setTags] = useState(''); // comma-separated
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setBody(post.body);
      setPublished(post.published);
      setTags(post.tags ? post.tags.join(', ') : '');
      // if there is an existing image, we can't prefill file input but
      // we can show it below
      if (post.image) {
        setImageFile(null); // no new selection yet
      }
    }
  }, [post]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const method = post ? 'PATCH' : 'POST';
      const url = post ? `${API_BASE}/posts/${post.id}/` : `${API_BASE}/posts/`;

      let options = {
        method,
        headers: {
          'X-CSRFToken': getCSRFToken(),
        },
        credentials: 'include',
      };
      let form;
      const tagList = tags.split(',').map(t=>t.trim()).filter(Boolean);
      // if any file is present we switch to FormData so we can handle both image
      // and video file simultaneously. videoUrl is always string so can live in
      // JSON branch but keep things uniform.
      if (imageFile || videoFile) {
        form = new FormData();
        form.append('title', title);
        form.append('body', body);
        form.append('published', published);
        form.append('author', userId);
        tagList.forEach(t=>form.append('tags', t));
        if (imageFile) form.append('image', imageFile);
        if (videoFile) form.append('video_file', videoFile);
        if (videoUrl) form.append('video_url', videoUrl);
        options.body = form;
      } else {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify({
          title,
          body,
          published,
          author: userId,
          video_url: videoUrl,
          tags: tagList,
        });
      }
      const res = await fetch(url, options);

      if (!res.ok) {
        throw new Error('Failed to save post');
      }

      setTitle('');
      setBody('');
      setPublished(false);
      onPostSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-form">
      <h2>{post ? 'Edit Post' : 'Create New Post'}</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Content</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows="10"
          ></textarea>
        </div>
        <div className="form-group">
          <label>Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
          />
          {imageFile && (
            <p>Selected: {imageFile.name}</p>
          )}
          {!imageFile && post && post.image && (
            <div className="existing-image">
              <p>Current:</p>
              <img src={post.image} alt="" style={{maxWidth:'100%',borderRadius:'8px'}} />
            </div>
          )}
        </div>
        <div className="form-group">
          <label>Video URL</label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://"
          />
        </div>
        <div className="form-group">
          <label>Video file</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files[0])}
          />
          {videoFile && <p>Selected: {videoFile.name}</p>}
          {!videoFile && post && post.video_url && (
            <p>Current URL: {post.video_url}</p>
          )}
          {!videoFile && post && post.video_file && (
            <div className="existing-video">
              <p>Current file:</p>
              <video
                src={post.video_file}
                controls
                style={{maxWidth:'100%',borderRadius:'8px'}}
              />
            </div>
          )}
        </div>
        <div className="form-group">
          <label>Tags (comma separated)</label>
          <input
            type="text"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="e.g. travel,food,code"
          />
        </div>
        <div className="form-group checkbox">
          <input
            type="checkbox"
            id="published"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          <label htmlFor="published">Publish immediately</label>
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : post ? 'Update Post' : 'Create Post'}
        </button>
      </form>
    </div>
  );
}
